import { AccountInfo } from '@polkadot/types/interfaces'
import { ApiPromise } from '@polkadot/api'

export const balance = async (api: ApiPromise, address: string) => {
  const account = await api.query.system.account<AccountInfo>(address)
  return account.data.toJSON()
}

export const relayChainV3limitedReserveTransferAssets = (
  api: ApiPromise,
  parachainId: string,
  amount: string,
  address: Uint8Array,
) => {
  return api.tx.xcmPallet.limitedReserveTransferAssets(
    {
      V3: {
        parents: 0,
        interior: {
          X1: { Parachain: parachainId },
        },
      },
    },
    {
      V3: {
        parents: 0,
        interior: {
          X1: {
            AccountId32: {
              id: address,
            },
          },
        },
      },
    },
    {
      V3: [
        {
          id: { Concrete: { parents: 0, interior: 'Here' } },
          fun: { Fungible: amount },
        },
      ],
    },
    0,
    'Unlimited',
  )
}

