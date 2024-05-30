import { expect } from 'vitest'
import { given } from '../../helpers'

given('astar')('Number of slots adjusted based on price', async ({ networks: { astar } }) => {
  const advanceNextEra = async () => {
    const state = await astar.api.query.dappStaking.activeProtocolState<any>()
    await astar.dev.newBlock({ count: 1, unsafeBlockHeight: state.nextEraStart.toNumber() })
  }

  // set price to $0.10
  await astar.dev.setStorage({
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

  expect((await astar.api.query.dappStaking.tierConfig()).toHuman()).toMatchInlineSnapshot(`
      {
        "numberOfSlots": "150",
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
          {
            "DynamicTvlAmount": {
              "amount": "306,666,666,666,666,666,901,705,287",
              "minimumAmount": "200,000,000,000,000,000,000,000,000",
            },
          },
          {
            "DynamicTvlAmount": {
              "amount": "76,666,666,666,666,666,725,426,320",
              "minimumAmount": "50,000,000,000,000,000,000,000,000",
            },
          },
          {
            "DynamicTvlAmount": {
              "amount": "23,000,000,000,000,000,017,627,893",
              "minimumAmount": "15,000,000,000,000,000,000,000,000",
            },
          },
          {
            "FixedTvlAmount": {
              "amount": "1,500,000,000,000,000,000,000,000",
            },
          },
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

  expect((await astar.api.query.dappStaking.tierConfig()).toHuman()).toMatchInlineSnapshot(`
      {
        "numberOfSlots": "550",
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
          {
            "DynamicTvlAmount": {
              "amount": "200,000,000,000,000,000,000,000,000",
              "minimumAmount": "200,000,000,000,000,000,000,000,000",
            },
          },
          {
            "DynamicTvlAmount": {
              "amount": "50,000,000,000,000,000,000,000,000",
              "minimumAmount": "50,000,000,000,000,000,000,000,000",
            },
          },
          {
            "DynamicTvlAmount": {
              "amount": "15,000,000,000,000,000,000,000,000",
              "minimumAmount": "15,000,000,000,000,000,000,000,000",
            },
          },
          {
            "FixedTvlAmount": {
              "amount": "1,500,000,000,000,000,000,000,000",
            },
          },
        ],
      }
    `)

  // set price to $0.05
  await astar.dev.setStorage({
    priceAggregator: {
      valuesCircularBuffer: {
        head: 1,
        buffer: [
          50_000_000_000_000_000n, // $0.05
        ],
      },
    },
  })

  await advanceNextEra()

  expect((await astar.api.query.dappStaking.tierConfig()).toHuman()).toMatchInlineSnapshot(`
      {
        "numberOfSlots": "100",
        "rewardPortion": [
          "25.00%",
          "47.00%",
          "25.00%",
          "3.00%",
        ],
        "slotsPerTier": [
          "5",
          "20",
          "30",
          "45",
        ],
        "tierThresholds": [
          {
            "DynamicTvlAmount": {
              "amount": "1,100,000,000,000,000,000,000,000,000",
              "minimumAmount": "200,000,000,000,000,000,000,000,000",
            },
          },
          {
            "DynamicTvlAmount": {
              "amount": "275,000,000,000,000,000,000,000,000",
              "minimumAmount": "50,000,000,000,000,000,000,000,000",
            },
          },
          {
            "DynamicTvlAmount": {
              "amount": "82,500,000,000,000,000,000,000,000",
              "minimumAmount": "15,000,000,000,000,000,000,000,000",
            },
          },
          {
            "FixedTvlAmount": {
              "amount": "1,500,000,000,000,000,000,000,000",
            },
          },
        ],
      }
    `)
})
