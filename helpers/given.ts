import { test } from 'vitest'
import _ from 'lodash'

import { Network, NetworkNames, createContext, createNetworks } from '../networks'

class NetworkManager {
  keyring = createContext()

  async buildNetworks(names: NetworkNames[]) {
    const networkOptions = _.zipObject(_.zip(names) as any) as any as Record<NetworkNames, undefined>
    return createNetworks(networkOptions, this.keyring)
  }
}

export const given = <T extends NetworkNames>(...names: NetworkNames[]) =>
  test.extend<{
    networks: Record<T, Network>
    keyring: ReturnType<typeof createContext>
  }>({
    networks: async ({ task }, use) => {
      if (task.retry) {
        throw new Error('given cannot run with retry')
      }
      if (task.concurrent) {
        throw new Error('given cannot run in concurrent mode')
      }
      const manager = new NetworkManager()
      _.assign(task.suite, { __networkManager__: manager })
      await use(await manager.buildNetworks(names))
    },
    keyring: async ({ task }, use) => {
      // network manager is assigned above
      const manager: NetworkManager = _.get(task.suite, '__networkManager__')!
      await use(manager.keyring)
    },
  })
