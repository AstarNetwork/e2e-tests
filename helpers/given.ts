import { test } from 'vitest'
import _ from 'lodash'

import { Network, NetworkNames, createContext, createNetworks } from '../networks'

class NetworkManager {
  networks: Record<string, Network> = {}
  heads: Record<string, string> = {}

  async buildNetworks(names: NetworkNames[], ctx: ReturnType<typeof createContext>) {
    const existing = _.keys(this.networks)
    const networkOptions = _.zipObject(_.zip(_.filter(names, (x) => !existing.includes(x))) as any) as any as Record<
      NetworkNames,
      undefined
    >
    if (_.isEmpty(networkOptions)) return
    const newNetworks = await createNetworks(networkOptions, ctx)
    const heads = _.map(newNetworks, ({ chain }, name) => ({ [name]: chain.head.hash }))
    _.each(heads, (head) => _.assign(this.heads, head))
    _.assign(this.networks, newNetworks)
  }

  async resetHeads() {
    await Promise.all(
      Object.entries(this.heads).map(async ([name, head]) => {
        const network = this.networks[name]
        if (typeof head === 'number' && network.chain.head.number === head) {
          return
        }
        if (typeof head === 'string' && network.chain.head.hash === head) {
          return
        }
        await network.dev.setHead(head)
      }),
    )
  }
}

export const given = (
  names: NetworkNames[],
  config?: {
    preserveHead?: boolean
    ctx?: ReturnType<typeof createContext>
  },
) => {
  config ??= {}
  config.preserveHead ??= false
  config.ctx ??= createContext()

  return test.extend<{
    networks: Record<NetworkNames, Network>
    keyring: ReturnType<typeof createContext>
  }>({
    networks: async ({ task }, use) => {
      if (task.concurrent) {
        throw new Error('cannot run in concurrent mode')
      }
      if (!_.has(task.suite, '__networkManager__')) {
        _.assign(task.suite, { __networkManager__: new NetworkManager() })
      }
      const manager: NetworkManager = _.get(task.suite, '__networkManager__')!
      await manager.buildNetworks(names, config.ctx!)
      if (!config.preserveHead) {
        await manager.resetHeads()
      }
      await use(manager.networks)
    },
    keyring: config.ctx,
  })
}
