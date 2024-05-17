import { ApiPromise } from '@polkadot/api'
import { describe, expect } from 'vitest'

import { given } from './given'

const systemBalance = ({ api }: { api: ApiPromise }, address: string) =>
  api.query.system.account(address).then((x) => x.toHuman())

describe('Given network test helper', () => {
  given(['astar'])('001: basic transfer works', async ({ networks: { astar }, keyring: { alice, bob } }) => {
    // bob has no balance
    expect(await systemBalance(astar, bob.address)).toMatchInlineSnapshot(`
      {
        "consumers": "0",
        "data": {
          "flags": "170,141,183,460,469,231,731,687,303,715,884,105,728",
          "free": "0",
          "frozen": "0",
          "reserved": "0",
        },
        "nonce": "0",
        "providers": "0",
        "sufficients": "0",
      }
    `)
    // send tx
    await astar.api.tx.balances.transferAllowDeath(bob.address, 10n ** 18n).signAndSend(alice)
    // mine block
    await astar.chain.newBlock()
    // bob has balance now
    expect(await systemBalance(astar, bob.address)).toMatchInlineSnapshot(`
      {
        "consumers": "0",
        "data": {
          "flags": "170,141,183,460,469,231,731,687,303,715,884,105,728",
          "free": "1,000,000,000,000,000,000",
          "frozen": "0",
          "reserved": "0",
        },
        "nonce": "0",
        "providers": "1",
        "sufficients": "0",
      }
    `)
  })

  let lastAstarHead: number

  given(['astar', 'statemint'])('002: create new required networks', async ({ networks }) => {
    expect(networks.astar).toBeTruthy()
    expect(networks.statemint).toBeTruthy()
    expect(networks.acala).not.toBeTruthy()
    await networks.astar.chain.newBlock()
    lastAstarHead = networks.astar.chain.head.number
  })

  given(['astar', 'statemint', 'acala'], { preserveHead: true })(
    '003: preserves head from 002',
    async ({ networks }) => {
      expect(networks.astar).toBeTruthy()
      expect(networks.statemint).toBeTruthy()
      expect(networks.acala).toBeTruthy()
      expect(networks.astar.chain.head.number).eq(lastAstarHead)
    },
  )

  given(['astar', 'statemint', 'acala'])(
    '004: networks should be available within 10ms',
    async ({ networks }) => {
      expect(networks.astar).toBeTruthy()
      expect(networks.statemint).toBeTruthy()
      expect(networks.acala).toBeTruthy()
    },
    10,
  )
})

let lastAstarHead: number

given(['astar', 'statemint'])('001: works without describe', async ({ networks }) => {
  await networks.astar.chain.newBlock()
  lastAstarHead = networks.astar.chain.head.number
})

given(['astar', 'acala'], { preserveHead: true })('002: preserves head from 001', async ({ networks }) => {
  expect(networks.astar).toBeTruthy()
  expect(networks.acala).toBeTruthy()
  expect(networks.astar.chain.head.number).eq(lastAstarHead)
})
