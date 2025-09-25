import { expect } from 'vitest'
import { u16 } from '@polkadot/types'
import { given } from '../../helpers'

given('astar')('Reward payouts based on inflation (decayed)', async ({ networks: { astar } }) => {
  const palletVersion = (await astar.api.query.inflation.palletVersion<u16>()).toNumber()
  const config = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>

  // Scenario 1: baseline, no decay
  // new parameter on version 2
  if (palletVersion >= 2) {
    config.decayRate = 1_000_000_000_000_000_000n // 100%
    config.decayFactor = 1_000_000_000_000_000_000n // 100%
  }

  const totalIssuance = 8_400_000_000_000_000_000_000_000_000n // 8.4B
  await astar.dev.setStorage({
    balances: {
      totalIssuance,
    },
    inflation: {
      activeInflationConfig: config,
    },
  })

  await astar.dev.newBlock({ count: 1 })

  const issuance_1 = (await astar.api.query.balances.totalIssuance()).toBigInt()
  if (config.collatorRewardPerBlock == 0 && config.treasuryRewardPerBlock == 0) {
    expect(issuance_1).toEqual(totalIssuance)
  } else {
    expect(issuance_1).toBeGreaterThan(totalIssuance)
  }

  // Scenario 2: decayRate = 0%, expect no rewards
  if (palletVersion >= 2) {
    config.decayRate = 0n
    await astar.dev.setStorage({
      inflation: { activeInflationConfig: config },
    })

    await astar.dev.newBlock({ count: 1 })

    const activeConfig = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>
    const decay_factor = activeConfig.decayFactor
    expect(BigInt(decay_factor)).toBe(0n)

    const issuance_2 = (await astar.api.query.balances.totalIssuance()).toBigInt()
    expect(issuance_2).toEqual(issuance_1) // no increase
  }
})
