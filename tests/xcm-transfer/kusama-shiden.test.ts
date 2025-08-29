import { checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { kusama as kusamaUtil } from '../../networks/polkadot'
import { query, tx } from '../../helpers/api'
import { shiden as shidenUtil } from '../../networks/astar'
import { KusamaMigationStep, AssetHubMigrationStep } from './asset_hub_migration_config.ts'

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

      if (KusamaMigationStep === AssetHubMigrationStep.NotStrated) {
        await checkSystemEvents(kusama, 'xcmPallet').toMatchSnapshot('001: kusama event')

        await shiden.chain.newBlock()

        const bobBalance = await query.assets(shidenUtil.ksm)(shiden, bob.address)
        expect(bobBalance.unwrap().balance.toNumber()).closeTo(
          1e12,
          1e6, // some fee
          'Expected amount was not received',
        )

        await checkSystemEvents(shiden, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot(
          '003: shiden event',
        )
      } else if (KusamaMigationStep === AssetHubMigrationStep.Ongoing) {
        // Do not check snapshot

        // Tokens should not have been received, and balance is none
        const bobBalance = await query.assets(shidenUtil.ksm)(shiden, bob.address)
        expect(bobBalance.isNone, 'Expected no balance').toBe(true)
      }
    },
  )

  given('kusama', 'shiden')(
    '002: Shiden transfer DOT to Kusama',
    async ({ networks: { shiden, kusama }, keyring: { alice, bob } }) => {
      await tx.xtokens
        .transfer(shidenUtil.ksm, 1e12, tx.xtokens.relaychainV3)(shiden, bob.addressRaw)
        .signAndSend(alice)

      await shiden.chain.newBlock()

      if (KusamaMigationStep === AssetHubMigrationStep.NotStrated) {
        await checkSystemEvents(shiden, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot(
          '001: shiden event',
        )

        await kusama.chain.newBlock()

        const bobBalance = await kusama.api.query.system.account(bob.address)
        expect(bobBalance.data.free.toNumber()).closeTo(
          0,
          1e8, // some fee
          'Expected amount was not received',
        )

        await checkSystemEvents(kusama, 'messageQueue').toMatchSnapshot('002: kusama event')
      } else if (KusamaMigationStep === AssetHubMigrationStep.Ongoing) {
        // Do not check snapshot

        // Tokens should not have been received
        const bobBalance = await kusama.api.query.system.account(bob.address)
        expect(bobBalance.data.free.toNumber()).closeTo(
          0,
          0, // some fee
          'Should be 0',
        )
      }
    },
  )
})
