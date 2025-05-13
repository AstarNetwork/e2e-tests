import { checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { kusama as kusamaUtil } from '../../networks/polkadot'
import { query, tx } from '../../helpers/api'
import { shiden as shidenUtil } from '../../networks/astar'

describe('Kusama & Shiden', () => {
  given('kusama', 'shiden')(
    '001: Kusama transfer KSM to Shiden',
    async ({ networks: { kusama, shiden }, keyring: { alice, bob } }) => {
      await tx.xcmPallet
        .limitedReserveTransferAssetsV3(kusamaUtil.ksm, 1e12, tx.xcmPallet.parachainV3(
            0,
            shidenUtil.paraId,
          ))(kusama, bob.addressRaw)
        .signAndSend(alice)

      await kusama.chain.newBlock()

      await checkSystemEvents(kusama, 'xcmPallet').toMatchSnapshot('001: kusama event')

      await shiden.chain.newBlock()

      const bobBalance = await query.assets(shidenUtil.ksm)(shiden, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        1e12,
        1e6, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(shiden, 'parachainSystem', 'dmpQueue', 'messageQueue')
        // TODO: remove this when shiden is upgraded with runtime-1500
        .redact({ redactKeys: /proofSize|refTime/ })
        .toMatchSnapshot('003: shiden event')
    },
  )

  given('kusama', 'shiden')(
    '002: Shiden transfer DOT to Kusama',
    async ({ networks: { shiden, kusama }, keyring: { alice, bob } }) => {
      await tx.xtokens
        .transfer(shidenUtil.ksm, 1e12, tx.xtokens.relaychainV3)(shiden, bob.addressRaw)
        .signAndSend(alice)

      await shiden.chain.newBlock()

      await checkSystemEvents(shiden, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot(
        '001: shiden event',
      )

      await kusama.chain.newBlock()

      const bobBalance = await kusama.api.query.system.account(bob.address)
      expect(bobBalance.data.free.toNumber()).closeTo(
        1e12,
        1e8, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(kusama, 'messageQueue').toMatchSnapshot('002: kusama event')
    },
  )
})
