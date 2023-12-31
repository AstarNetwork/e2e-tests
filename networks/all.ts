import { Config } from './types'

import acalaConfig from './acala'
import astarConfig from './astar'
import astarNextConfig from './astar-next'
import bifrostConfig from './bifrost'
import centrifugeConfig from './centrifuge'
import crustConfig from './crust'
import darwiniaConfig from './darwinia'
import hydraDXConfig from './hydraDX'
import interlayConfig from './interlay'
import moonbeamConfig from './moonbeam'
import parallelConfig from './parallel'
import phalaConfig from './phala'
import polkadotConfig from './polkadot'
import statemintConfig from './statemint'
import uniqueConfig from './unique'

const all = {
  polkadot: polkadotConfig,
  statemint: statemintConfig,
  acala: acalaConfig,
  astar: astarConfig,
  astarNext: astarNextConfig,
  moonbeam: moonbeamConfig,
  hydraDX: hydraDXConfig,
  bifrost: bifrostConfig,
  centrifuge: centrifugeConfig,
  parallel: parallelConfig,
  crust: crustConfig,
  unique: uniqueConfig,
  interlay: interlayConfig,
  phala: phalaConfig,
  darwinia: darwiniaConfig,
} satisfies Record<string, Config>

export default all
