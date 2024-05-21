import { astar as astarUtil } from '../../networks/astar'
import { check, checkSystemEvents, given } from '../../helpers'
import { describe } from 'vitest'
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

      await check(query.assets(astarUtil.dot)(astar, bob.address)).toMatchSnapshot('002: astar balance')

      await checkSystemEvents(astar, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot('003: astar event')
    },
  )

  given('polkadot', 'astar')(
    '002: Astar transfer DOT to Polkadot',
    async ({ networks: { astar, polkadot }, keyring: { alice, bob } }) => {
      await tx.xtokens.transfer(astarUtil.dot, 1e12, tx.xtokens.relaychainV3)(astar, bob.addressRaw).signAndSend(alice)

      await astar.chain.newBlock()

      await checkSystemEvents(astar, 'parachainSystem', 'dmpQueue', 'messageQueue').toMatchSnapshot('001: astar event')

      await polkadot.chain.newBlock()

      await check(polkadot.api.query.system.account(bob.address)).toMatchSnapshot('002: polkadot balance')

      await checkSystemEvents(polkadot, 'messageQueue').toMatchSnapshot('003: polkadot event')
    },
  )
})
