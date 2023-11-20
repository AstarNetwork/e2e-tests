import { Config } from './types'

import astarConfig, { Vars } from './astar'

export default {
  ...astarConfig,
  polkadot: {
    ...astarConfig.polkadot,
    name: 'astarNext' as const,
  },
  kusama: {
    ...astarConfig.kusama,
    name: 'shidenNext' as const,
  },
  config: (opt) => ({
    ...astarConfig.config(opt),
    options: {
      wasmOverride: {
        polkadot: './wasm/astar_runtime.wasm',
        kusama: './wasm/shiden_runtime.wasm',
      }[opt.network],
    },
  }),
} satisfies Config<Vars>
