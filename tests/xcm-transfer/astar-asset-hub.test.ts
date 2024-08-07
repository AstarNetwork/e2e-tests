import { astar as astarUtil } from '../../networks/astar'
import { checkHrmp, checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { query, tx } from '../../helpers/api'
import { statemint as statemintUtil } from '../../networks/statemint'

describe('Astar & AssetHub', () => {
  given('astar', 'statemint')(
    '001: AssetHub transfer USDT to Astar',
    async ({ networks: { astar, statemint }, keyring: { alice, bob } }) => {
      await statemint.dev.setStorage({
        Assets: {
          account: [[[statemintUtil.usdtIndex, alice.address], { balance: 100e6 }]],
        },
      })

      await tx.xcmPallet
        .limitedReserveTransferAssetsV3(statemintUtil.usdt, 10e6, tx.xcmPallet.parachainV3(
            1,
            astarUtil.paraId,
          ))(statemint, bob.addressRaw)
        .signAndSend(alice)

      await statemint.chain.newBlock()

      await checkHrmp(statemint)
        .redact({ redactKeys: /setTopic/ })
        .toMatchSnapshot('001: statemint ump messages')

      await astar.chain.newBlock()

      const bobBalance = await query.assets(astarUtil.usdt)(astar, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        10_000_000,
        20_000, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(astar, 'xcmpQueue', 'messageQueue').toMatchSnapshot('002: astar event')
    },
  )

  given('astar', 'statemint')(
    '002: Astar transfer USDT to AssetHub',
    async ({ networks: { astar, statemint }, keyring: { alice, bob } }) => {
      await astar.dev.setStorage({
        Assets: {
          account: [[[astarUtil.usdt, alice.address], { balance: 100e6 }]],
        },
      })

      await tx.xtokens
        .transfer(astarUtil.usdt, 10e6, tx.xtokens.parachainV3(statemintUtil.paraId))(astar, bob.addressRaw)
        .signAndSend(alice)

      await astar.chain.newBlock()

      await checkHrmp(astar)
        .redact({ redactKeys: /setTopic/ })
        .toMatchSnapshot('001: astar ump messages')

      await statemint.chain.newBlock()

      const bobBalance = await query.assets(statemintUtil.usdtIndex)(statemint, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        10_000_000,
        40_000, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(statemint, 'xcmpQueue', 'messageQueue').toMatchSnapshot('002: statemint event')
    },
  )
})
