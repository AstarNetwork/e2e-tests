import { checkHrmp, checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { query, tx } from '../../helpers/api'
import { shiden as shidenUtil } from '../../networks/astar'
import { statemine as statemineUtil } from '../../networks/statemint'

describe('Shiden & AssetHub', () => {
  given('shiden', 'statemine')(
    '001: AssetHub transfer USDT to Shiden',
    async ({ networks: { shiden, statemine }, keyring: { alice, bob } }) => {
      await statemine.dev.setStorage({
        Assets: {
          account: [[[statemineUtil.usdtIndex, alice.address], { balance: 100e6 }]],
        },
      })

      await tx.xcmPallet
        .limitedReserveTransferAssetsV3(statemineUtil.usdt, 10e6, tx.xcmPallet.parachainV3(
            1,
            shidenUtil.paraId,
          ))(statemine, bob.addressRaw)
        .signAndSend(alice)

      await statemine.chain.newBlock()

      await checkHrmp(statemine)
        .redact({ redactKeys: /setTopic/ })
        .toMatchSnapshot('001: statemine ump messages')

      await shiden.chain.newBlock()

      const bobBalance = await query.assets(shidenUtil.usdt)(shiden, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        10_000_000,
        10_000, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(shiden, 'xcmpQueue', 'messageQueue').toMatchSnapshot('002: shiden event')
    },
  )

  given('shiden', 'statemine')(
    '002: Shiden transfer USDT to AssetHub',
    async ({ networks: { shiden, statemine }, keyring: { alice, bob } }) => {
      await shiden.dev.setStorage({
        Assets: {
          account: [[[shidenUtil.usdt, alice.address], { balance: 100e6 }]],
        },
      })

      await tx.xtokens
        .transfer(shidenUtil.usdt, 10e6, tx.xtokens.parachainV3(statemineUtil.paraId))(shiden, bob.addressRaw)
        .signAndSend(alice)

      await shiden.chain.newBlock()

      await checkHrmp(shiden)
        .redact({ redactKeys: /setTopic/ })
        .toMatchSnapshot('001: shiden ump messages')

      await statemine.chain.newBlock()

      const bobBalance = await query.assets(statemineUtil.usdtIndex)(statemine, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        10_000_000,
        20_000, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(statemine, 'xcmpQueue', 'messageQueue').toMatchSnapshot('002: statemine event')
    },
  )

  given('shiden', 'statemine')(
    '003: Transfer KSM from AssetHub (statemine) to Shiden',
    async ({ networks: { shiden, statemine }, keyring: { alice, bob } }) => {
      await tx.xcmPallet
        .limitedReserveTransferAssetsV3(statemineUtil.ksm, 1e12, tx.xcmPallet.parachainV3(
          1,
          shidenUtil.paraId,
        ))(statemine, bob.addressRaw)
        .signAndSend(alice)

      await statemine.chain.newBlock()

       await checkHrmp(statemine)
        .redact({ redactKeys: /setTopic/ })
        .toMatchSnapshot('003: statemine ump messages')

      await shiden.chain.newBlock()

      const bobBalance = await query.assets(shidenUtil.ksm)(shiden, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        1_000_000_000_000,
        1_000_000, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(shiden, 'xcmpQueue', 'messageQueue').toMatchSnapshot('003: shiden event')
    },
  )
})
