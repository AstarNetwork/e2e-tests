import { checkHrmp, checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { query, tx } from '../../helpers/api'
import { shiden as shidenUtil } from '../../networks/astar'
import { statemine as statemineUtil } from '../../networks/statemint'

describe('Shiden & AssetHub', () => {
  given('shiden', 'statemine')(
    '001: Transfer KSM from AssetHub (statemine) to Shiden',
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
        .toMatchSnapshot('001: statemine ump messages')

      await shiden.chain.newBlock()

      const bobBalance = await query.assets(shidenUtil.ksm)(shiden, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        1_000_000_000_000,
        1_000_000, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(shiden, 'xcmpQueue', 'messageQueue').toMatchSnapshot('001: shiden event')
    },
  )
})
