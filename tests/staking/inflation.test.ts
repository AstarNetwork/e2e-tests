import { expect } from 'vitest'
import { u16 } from '@polkadot/types'
import { given } from '../../helpers'

given('astar')('Reward payouts based on inflation (decayed)', async ({ networks: { astar } }) => {
  const advanceNextEra = async () => {
    const state = await astar.api.query.dappStaking.activeProtocolState<any>()
    await astar.dev.newBlock({ count: 1, unsafeBlockHeight: state.nextEraStart.toNumber() })
  }

  const palletVersion = (await astar.api.query.inflation.palletVersion<u16>()).toNumber()
  const config = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>

  // Scenario 1: baseline, no decay
  // new parameter on version 2
  if (palletVersion >= 2) {
    config.decayRate = 1_000_000_000_000_000_000n; // 100%
    config.decayFactor = 1_000_000_000_000_000_000n; // 100%
  }

  await astar.dev.setStorage({
    balances: {
      totalIssuance: 8_400_000_000_000_000_000_000_000_000n, // 8.4B
    },
    inflation: {
      activeInflationConfig: config,
    }
  });

  await advanceNextEra()

  const issuance_1 = (await astar.api.query.balances.totalIssuance()).toBigInt()
  expect(issuance_1).toBeGreaterThan(8_400_000_000_000_000_000_000_000_000n)

  // Scenario 2: decayRate = 0%, expect no rewards
  if (palletVersion >= 2) {
    config.decayRate = 0n
    await astar.dev.setStorage({
      inflation: { activeInflationConfig: config },
    })

    await advanceNextEra()

    const activeConfig = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>
    const decay_factor = activeConfig.decayFactor
    expect(BigInt(decay_factor)).toBe(0n)

    const issuance_2 = (await astar.api.query.balances.totalIssuance()).toBigInt()
    expect(issuance_2).toBe(issuance_1) // no increase
  }
})
