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
      const manager = new NetworkManager()
      _.assign(task, { __networkManager__: manager })
      const networks = await manager.buildNetworks(names)
      await use(networks)
      await Promise.all(Object.values(networks).map(({ teardown }) => teardown()))
    },
    keyring: async ({ task }, use) => {
      // network manager is assigned above
      const manager: NetworkManager = _.get(task, '__networkManager__')!
      await use(manager.keyring)
    },
  })
