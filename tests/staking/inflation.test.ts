import { expect } from 'vitest'
import { u16 } from '@polkadot/types'
import { given } from '../../helpers'

given('astar')('Reward payouts based on inflation (decayed)', async ({ networks: { astar } }) => {
  const baseRewards = 1_000_000_000_000_000_000n // 1 ASTR
  const totalIssuance = 8_400_000_000_000_000_000_000_000_000n // 8.4B
  const palletVersion = (await astar.api.query.inflation.palletVersion<u16>()).toNumber()

  const advanceNextVotingSubPeriod = async () => {
    const finalEra = (await astar.api.query.dappStaking.periodEnd<any>()).finalEra
    await astar.dev.newBlock({ count: 1, unsafeBlockHeight: finalEra + 1 })
  }

  if (palletVersion >= 2) {
    const config = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>

    // Scenario 1: baseline, no decay
    config.decayRate = 1_000_000_000_000_000_000n // 100%
    config.decayFactor = 1_000_000_000_000_000_000n // 100%
    config.collatorRewardPerBlock = baseRewards
    config.treasuryRewardPerBlock = baseRewards
    config.dappRewardPoolPerEra = 0n
    config.baseStakerRewardPoolPerEra = 0n
    config.adjustableStakerRewardPoolPerEra = 0n
    config.bonusRewardPoolPerPeriod = 0n

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
    expect(issuance_1).toEqual(totalIssuance + baseRewards * 2n)

    // Scenario 2: decayRate = 50%, expect half rewards
    const decayRate_2 = 500_000_000_000_000_000n // 50%
    config.decayRate = decayRate_2
    config.collatorRewardPerBlock = baseRewards
    config.treasuryRewardPerBlock = baseRewards
    config.dappRewardPoolPerEra = 0n
    config.baseStakerRewardPoolPerEra = 0n
    config.adjustableStakerRewardPoolPerEra = 0n
    config.bonusRewardPoolPerPeriod = 0n
    await astar.dev.setStorage({
      balances: {
        totalIssuance: issuance_1,
      },
      inflation: { activeInflationConfig: config },
    })

    await astar.dev.newBlock({ count: 1 })

    const activeConfig_2 = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>
    expect(BigInt(activeConfig_2.decayFactor)).toBe(decayRate_2)

    const issuance_2 = (await astar.api.query.balances.totalIssuance()).toBigInt()
    expect(issuance_2).toEqual(issuance_1 + baseRewards)

    // Scenario 3: decayRate = 0%, expect no rewards
    config.decayRate = 0n
    config.collatorRewardPerBlock = baseRewards
    config.treasuryRewardPerBlock = baseRewards
    config.dappRewardPoolPerEra = baseRewards
    config.baseStakerRewardPoolPerEra = baseRewards
    config.adjustableStakerRewardPoolPerEra = baseRewards
    config.bonusRewardPoolPerPeriod = baseRewards
    await astar.dev.setStorage({
      balances: {
        totalIssuance: issuance_2,
      },
      inflation: { activeInflationConfig: config },
    })

    // We make sure all rewards including bonuses are paid out
    await advanceNextVotingSubPeriod()

    const activeConfig_3 = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>
    expect(BigInt(activeConfig_3.decayFactor)).toBe(0n)

    const issuance_3 = (await astar.api.query.balances.totalIssuance()).toBigInt()
    expect(issuance_3).toEqual(issuance_2) // no increase
  }
})
