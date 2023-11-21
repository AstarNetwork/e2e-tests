import { Context } from '../../networks/types'
import { query, tx } from '../../helpers/api'

import { shiden } from '../../networks/astar'
import { statemine } from '../../networks/statemint'

import buildTest from './shared'

const tests = [
  // statemine -> shiden
  {
    from: 'statemine',
    to: 'shiden',
    name: 'USDT',
    fromStorage: ({ alice }: Context) => ({
      System: {
        account: [[[shiden.paraAccount], { data: { free: 10e10 } }]],
      },
      Assets: {
        account: [[[statemine.usdtIndex, alice.address], { balance: 1e8 }]],
        asset: [[[statemine.usdtIndex], { supply: 1e8 }]],
      },
    }),
    test: {
      xcmPalletHorizontal: {
        tx: tx.xcmPallet.limitedReserveTransferAssetsV3(
          statemine.usdt,
          1e7,
          tx.xcmPallet.parachainV3(1, shiden.paraId),
        ),
        fromBalance: query.assets(statemine.usdtIndex),
        toBalance: query.assets(shiden.usdt),
      },
    },
  },
  // shiden -> statemine
  {
    from: 'shiden',
    to: 'statemine',
    name: 'USDT',
    fromStorage: ({ alice }: Context) => ({
      Assets: {
        account: [[[shiden.usdt, alice.address], { balance: 1e8 }]],
      },
    }),
    test: {
      xtokenstHorizontal: {
        tx: tx.xtokens.transfer(shiden.usdt, 1e7, tx.xtokens.parachainV3(statemine.paraId)),
        fromBalance: query.assets(shiden.usdt),
        toBalance: query.assets(statemine.usdtIndex),
      },
    },
  },
] as const

export type TestType = (typeof tests)[number]

buildTest(tests)
