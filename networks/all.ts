import { Config } from './types'

import astar from './astar'
import astarNext from './astar-next'
import polkadot from './polkadot'
import statemint from './statemint'

const all = {
  polkadot,
  statemint,
  astar,
  astarNext,
} satisfies Record<string, Config>

export default all
