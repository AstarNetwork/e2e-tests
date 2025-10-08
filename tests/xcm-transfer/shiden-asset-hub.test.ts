import { checkHrmp, checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { query, tx } from '../../helpers/api'
import { shiden as shidenUtil } from '../../networks/astar'
import { assethub as assethubUtil } from '../../networks/statemint'

describe('Shiden & AssetHub', () => {
  given('shiden', 'assethub')(
    '001: Transfer KSM from AssetHub to Shiden',
    async ({ networks: { shiden, assethub }, keyring: { alice, bob } }) => {
      await tx.xcmPallet
        .transferAssetsUsingTypeAndThenV3(assethubUtil.ksm, 1e12, tx.xcmPallet.parachainV3(
            1,
            shidenUtil.paraId,
          ))(assethub, bob.addressRaw)
        .signAndSend(alice)

      await assethub.chain.newBlock()

      await checkHrmp(assethub)
        .redact({ redactKeys: /setTopic/ })
        .toMatchSnapshot('001: statemine ump messages')

      await shiden.chain.newBlock()

      const bobBalance = await query.assets(shidenUtil.ksm)(shiden, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        1_000_000_000_000,
        1e8, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(shiden, 'xcmpQueue', 'messageQueue').toMatchSnapshot('001: shiden event')
    },
  )
})

describe('Shiden & AssetHub', () => {
  given('shiden', 'assethub')(
    '002: Transfer KSM from Shiden to Asset Hub',
    async ({ networks: { shiden, assethub }, keyring: { alice, bob } }) => {
      await tx.xtokens
        .transfer(shidenUtil.ksm, 1e12, tx.xtokens.parachainV3(assethubUtil.paraId))(shiden, bob.addressRaw)
        .signAndSend(alice)

      await shiden.chain.newBlock()

      await checkSystemEvents(shiden, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot(
        '002: shiden event',
      )

      await assethub.chain.newBlock()

      const bobBalance = await assethub.api.query.system.account(bob.address)
      expect(bobBalance.data.free.toNumber()).closeTo(
        1e12,
        1e9, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(assethub, 'messageQueue').toMatchSnapshot('002: asset hub event')
    },
  )
})