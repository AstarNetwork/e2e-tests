import { expect } from 'vitest'
import { Perbill } from '@polkadot/types/interfaces'
import { Struct, Vec, u16, u128 } from '@polkadot/types'
import { given } from '../../helpers'

interface TiersConfigurationV8 extends Struct {
  readonly slotsPerTier: Vec<u16>
  readonly rewardPortion: Vec<Perbill>
  readonly tierThresholds: Vec<u128>
}

const calculateNumberOfSlots = (slotsPerTier: u16[]): number => {
  return slotsPerTier.reduce((acc, val) => acc + val.toNumber(), 0)
}

given('astar')('Number of slots adjusted based on price', async ({ networks: { astar } }) => {
  const advanceNextEra = async () => {
    const state = await astar.api.query.dappStaking.activeProtocolState<any>()
    await astar.dev.newBlock({ count: 1, unsafeBlockHeight: state.nextEraStart.toNumber() })
  }

  const palletVersion = (await astar.api.query.dappStaking.palletVersion<u16>()).toNumber()

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
        // Permill percentages
        slotDistribution: [
          50000, // 5%
          200000, // 20%
          300000, // 30%
          450000, // 45%
        ],
        // Perbill percentages
        // percentages below are calculated based on total issuance at the time when dApp staking v3 was launched (8.4B)
        tierThresholds: [
          {
            DynamicPercentage: {
              percentage: 35_700_000, // 3.57%
              minimumRequiredPercentage: 23_800_000, // 2.38%
              // new parameter on version 10
              ...(palletVersion >= 10
                ? {
                    maximumPossiblePercentage: 35_700_000, // 3.57%
                  }
                : {}),
            },
          },
          {
            DynamicPercentage: {
              percentage: 8_900_000, // 0.89%
              minimumRequiredPercentage: 6_000_000, // 0.6%
              // new parameter on version 10
              ...(palletVersion >= 10
                ? {
                    maximumPossiblePercentage: 8_900_000, // 0.89%
                  }
                : {}),
            },
          },
          {
            DynamicPercentage: {
              percentage: 2_380_000, // 0.238%
              minimumRequiredPercentage: 1_790_000, // 0.179%
              // new parameter on version 10
              ...(palletVersion >= 10
                ? {
                    maximumPossiblePercentage: 2_380_000, // 0.238%
                  }
                : {}),
            },
          },
          {
            FixedPercentage: {
              requiredPercentage: 200_000, // 0.02%
            },
          },
        ],
        slotNumberArgs: [1000, 50],
      },
    },
    priceAggregator: {
      valuesCircularBuffer: {
        head: 1,
        buffer: [
          100_000_000_000_000_000n, // $0.10
        ],
      },
    },
  })

  await advanceNextEra()

  let config = await astar.api.query.dappStaking.tierConfig<TiersConfigurationV8>()
  let numberOfSlots = calculateNumberOfSlots(config.slotsPerTier)

  expect(numberOfSlots).toEqual(149)
  expect(config.toHuman()).toMatchInlineSnapshot(`
    {
      "rewardPortion": [
        "25.00%",
        "47.00%",
        "25.00%",
        "3.00%",
      ],
      "slotsPerTier": [
        "7",
        "30",
        "45",
        "67",
      ],
      "tierThresholds": [
        "199,920,000,432,452,922,658,838,699",
        "50,400,000,109,021,745,182,910,596",
        "15,036,000,032,524,820,646,234,994",
        "1,680,000,003,634,058,172,763,687",
      ],
    }
  `)

  // set price to $0.50
  await astar.dev.setStorage({
    priceAggregator: {
      valuesCircularBuffer: {
        head: 1,
        buffer: [
          500_000_000_000_000_000n, // $0.50
        ],
      },
    },
  })

  await advanceNextEra()

  config = await astar.api.query.dappStaking.tierConfig<TiersConfigurationV8>()
  numberOfSlots = calculateNumberOfSlots(config.slotsPerTier)

  expect(numberOfSlots).toEqual(549)
  expect(config.toHuman()).toMatchInlineSnapshot(`
    {
      "rewardPortion": [
        "25.00%",
        "47.00%",
        "25.00%",
        "3.00%",
      ],
      "slotsPerTier": [
        "27",
        "110",
        "165",
        "247",
      ],
      "tierThresholds": [
        "199,920,000,864,905,845,117,757,396",
        "50,400,000,218,043,490,365,821,192",
        "15,036,000,065,049,641,292,469,989",
        "1,680,000,007,268,116,345,527,373",
      ],
    }
  `)

  // set price to $0.01
  await astar.dev.setStorage({
    priceAggregator: {
      valuesCircularBuffer: {
        head: 1,
        buffer: [
          10_000_000_000_000_000n, // $0.01
        ],
      },
    },
  })

  await advanceNextEra()

  config = await astar.api.query.dappStaking.tierConfig<TiersConfigurationV8>()
  numberOfSlots = calculateNumberOfSlots(config.slotsPerTier)

  expect(numberOfSlots).toEqual(60)
  if (palletVersion >= 10) {
    expect(config.toHuman()).toMatchInlineSnapshot(`
      {
        "rewardPortion": [
          "25.00%",
          "47.00%",
          "25.00%",
          "3.00%",
        ],
        "slotsPerTier": [
          "3",
          "12",
          "18",
          "27",
        ],
        "tierThresholds": [
          "299,880,001,946,038,151,514,954,140",
          "74,760,000,485,146,766,063,952,153",
          "19,992,000,129,735,876,767,663,609",
          "1,680,000,010,902,174,518,291,060",
        ],
      }
    `)
  } else {
    expect(config.toHuman()).toMatchInlineSnapshot(`
      {
        "rewardPortion": [
          "25.00%",
          "47.00%",
          "25.00%",
          "3.00%",
        ],
        "slotsPerTier": [
          "3",
          "12",
          "18",
          "27",
        ],
        "tierThresholds": [
          "499,800,003,243,396,919,291,550,233",
          "124,600,000,808,577,943,464,840,255",
          "33,320,000,216,226,461,286,103,348",
          "1,680,000,010,902,174,518,291,060",
        ],
      }
    `)
  }
})
