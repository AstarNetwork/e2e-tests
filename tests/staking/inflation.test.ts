import { expect } from 'vitest'
import { Struct, u16, u32, bool } from '@polkadot/types'
import { given } from '../../helpers'

interface PeriodInfo extends Struct {
  number: u32
  subperiod: any
  nextSubperiodStartEra: u32
}

interface ProtocolState extends Struct {
  era: u32
  nextEraStart: u32
  periodInfo: PeriodInfo
  maintenance: bool
}

given('astar')('Reward payouts based on inflation (decayed)', async ({ networks: { astar } }) => {
  const baseRewards = 1_000_000_000_000_000_000n // 1 ASTR
  const totalIssuance = 8_400_000_000_000_000_000_000_000_000n // 8.4B
  const palletVersion = (await astar.api.query.inflation.palletVersion<u16>()).toNumber()

  const advanceNextVotingSubPeriod = async () => {
    const state = await astar.api.query.dappStaking.activeProtocolState<ProtocolState>()
    const currentBlock = (await astar.api.rpc.chain.getHeader()).number.toNumber()
    const blocksPerEra = await astar.api.call.dappStakingApi.blocksPerEra<number>()
    const beEras = await astar.api.call.dappStakingApi.erasPerBuildAndEarnSubperiod<number>()

    const currentEra = state.era.toNumber()
    const nextEraBlock = state.nextEraStart.toNumber()
    const nextSubperiodEra = state.periodInfo.nextSubperiodStartEra.toNumber()
    const remainingEraBlocks = nextEraBlock - currentBlock
    const remainingEras = nextSubperiodEra - currentEra

    let remainingBlocks: number
    if (state.periodInfo.subperiod.toString() === 'BuildAndEarn') {
      // Build&Earn -> Voting
      remainingBlocks = remainingEraBlocks + remainingEras * blocksPerEra
    } else if (state.periodInfo.subperiod.toString() === 'Voting') {
      // Voting -> Build&Earn -> next Voting
      remainingBlocks = remainingEraBlocks + remainingEras * blocksPerEra + beEras * blocksPerEra
    } else {
      // Something is wrong
      console.warn('Something is wrong; unknown subperiod')
      return
    }

    const targetBlockHeight = currentBlock + remainingBlocks

    // Set the current block number in storage to be exactly 1 less than target
    // This satisfies the runtime's assertion: current_block + 1 == new_block
    await astar.dev.setStorage({
      system: {
        number: targetBlockHeight - 1,
      },
    })
    await astar.dev.newBlock({ count: 1, unsafeBlockHeight: targetBlockHeight })
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
