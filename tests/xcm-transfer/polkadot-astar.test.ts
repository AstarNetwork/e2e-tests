import { astar as astarUtil } from '../../networks/astar'
import { checkSystemEvents, given } from '../../helpers'
import { describe, expect } from 'vitest'
import { polkadot as polkadotUtil } from '../../networks/polkadot'
import { query, tx } from '../../helpers/api'

describe('Polkadot & Astar', () => {
  given('polkadot', 'astar')(
    '001: Polkadot transfer DOT to Astar',
    async ({ networks: { astar, polkadot }, keyring: { alice, bob } }) => {
      await tx.xcmPallet
        .limitedReserveTransferAssetsV3(polkadotUtil.dot, 1e12, tx.xcmPallet.parachainV3(
            0,
            astarUtil.paraId,
          ))(polkadot, bob.addressRaw)
        .signAndSend(alice)

      await polkadot.chain.newBlock()

      await checkSystemEvents(polkadot, 'xcmPallet').toMatchSnapshot('001: polkadot event')

      await astar.chain.newBlock()

      const bobBalance = await query.assets(astarUtil.dot)(astar, bob.address)
      expect(bobBalance.unwrap().balance.toNumber()).closeTo(
        1e12,
        1e6, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(astar, 'parachainSystem', 'dmpQueue', 'messageQueue')
        // TODO: remove this when astar is upgraded with runtime-1500
        .redact({ redactKeys: /proofSize|refTime/ })
        .toMatchSnapshot('002: astar event')
    },
  )

  given('polkadot', 'astar')(
    '002: Astar transfer DOT to Polkadot',
    async ({ networks: { astar, polkadot }, keyring: { alice, bob } }) => {
      await tx.xtokens.transfer(astarUtil.dot, 1e12, tx.xtokens.relaychainV3)(astar, bob.addressRaw).signAndSend(alice)

      await astar.chain.newBlock()

      await checkSystemEvents(astar, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot('001: astar event')

      await polkadot.chain.newBlock()

      const bobBalance = await polkadot.api.query.system.account(bob.address)
      expect(bobBalance.data.free.toNumber()).closeTo(
        1e12,
        1e8, // some fee
        'Expected amount was not received',
      )

      await checkSystemEvents(polkadot, 'messageQueue').toMatchSnapshot('002: polkadot event')
    },
  )
})
