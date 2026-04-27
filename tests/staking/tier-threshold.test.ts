import { expect } from 'vitest'
import { Perbill } from '@polkadot/types/interfaces'
import { Struct, Vec, u16, u128 } from '@polkadot/types'
import { given } from '../../helpers'

const PRE_CLEANUP_SPEC_VERSION = 2101

interface TiersConfigurationV8 extends Struct {
  readonly slotsPerTier: Vec<u16>
  readonly rewardPortion: Vec<Perbill>
  readonly tierThresholds: Vec<u128>
}

const calculateNumberOfSlots = (slotsPerTier: u16[]): number => {
  return slotsPerTier.reduce((acc, val) => acc + val.toNumber(), 0)
}

given('astar')('Static number of slots, not adjusted based on price', async ({ networks: { astar } }) => {
  const advanceNextEra = async () => {
    const state = await astar.api.query.dappStaking.activeProtocolState<any>()
    const targetBlock = state.nextEraStart.toNumber()

    // Set the current block number in storage to be exactly 1 less than target
    // This satisfies the runtime's assertion: current_block + 1 == new_block
    await astar.dev.setStorage({
      system: {
        number: targetBlock - 1,
      },
    })
    await astar.dev.newBlock({ count: 1, unsafeBlockHeight: targetBlock })
  }

  const specVersion = (await astar.api.query.system.lastRuntimeUpgrade<any>()).toJSON().specVersion.toString()

  const inflationConfig = (await astar.api.query.inflation.activeInflationConfig()).toJSON() as Record<string, any>
  const noRewardsConfig = {
    ...inflationConfig,
    collatorRewardPerBlock: 0n,
    treasuryRewardPerBlock: 0n,
    dappRewardPoolPerEra: 0n,
    baseStakerRewardPoolPerEra: 0n,
    adjustableStakerRewardPoolPerEra: 0n,
    bonusRewardPoolPerPeriod: 0n,
  }

  // set total issuance to 8.4B (dApp staking v3 launch)
  // set price to $0.10
  await astar.dev.setStorage({
    balances: {
      totalIssuance: 8_400_000_000_000_000_000_000_000_000n, // 8.4B
    },
    dappStaking: {
      staticTierParams: {
        // Permill percentages
        rewardPortion: [
          250000, // 25%
          470000, // 47%
          250000, // 25%
          30000, // 3%
        ],
        // Permill percentages for a fixed 16 slots capacity
        slotDistribution: [
          62500, // 6.25% (1 slot)
          187500, // 18.75% (3 slots)
          312500, // 31.25% (5 slots)
          437500, // 43.75% (7 slots)
        ],
        // Perbill percentages
        // percentages below are calculated based on Tokenomics 3.0 revamp
        tierThresholds: [
          {
            FixedPercentage: {
              requiredPercentage: 23_200_000, // 2.32%
            },
          },
          {
            FixedPercentage: {
              requiredPercentage: 9_300_000, // 0.93%
            },
          },
          {
            FixedPercentage: {
              requiredPercentage: 3_500_000, // 0.35%
            },
          },
          {
            FixedPercentage: {
              requiredPercentage: 0, // 0%
            },
          },
        ],
        tierRankMultipliers: [0, 24_000, 46_700, 0],
        ...(specVersion == PRE_CLEANUP_SPEC_VERSION
          ? {
              slotNumberArgs: [0, 16],
            }
          : {}),
      },
    },
    inflation: {
      activeInflationConfig: noRewardsConfig,
    },
    ...(specVersion == PRE_CLEANUP_SPEC_VERSION
      ? {
          priceAggregator: {
            valuesCircularBuffer: {
              head: 1,
              buffer: [
                100_000_000_000_000_000n, // $0.10
              ],
            },
          },
        }
      : {}),
  })

  await advanceNextEra()

  const config = await astar.api.query.dappStaking.tierConfig<TiersConfigurationV8>()
  const numberOfSlots = calculateNumberOfSlots(config.slotsPerTier)

  expect(numberOfSlots).toEqual(16)
  expect(config.toHuman()).toMatchInlineSnapshot(`
  {
    "rewardPortion": [
      "25.00%",
      "47.00%",
      "25.00%",
      "3.00%",
    ],
    "slotsPerTier": [
      "1",
      "3",
      "5",
      "7",
    ],
    "tierThresholds": [
      "194,880,000,000,000,000,000,000,000",
      "78,120,000,000,000,000,000,000,000",
      "29,400,000,000,000,000,000,000,000",
      "0",
    ],
  }
`)
})
