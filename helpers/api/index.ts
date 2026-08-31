import { ApiPromise } from '@polkadot/api'

export const xcmPallet = {
  parachainV2: (parents: number, paraId: number) => ({
    V1: {
      parents,
      interior: {
        X1: { Parachain: paraId },
      },
    },
  }),
  relaychainV3: (acc: any) => ({
    V3: {
      parents: 1,
      interior: {
        X1: {
          AccountId32: {
            network: 'Any',
            id: acc,
          },
        },
      },
    },
  }),
  parachainV3: (parents: number, paraId: any) => ({
    V3: {
      parents,
      interior: {
        X1: { Parachain: paraId },
      },
    },
  }),
  limitedTeleportAssets:
    (token: any, amount: any, dest: any) =>
    ({ api }: { api: ApiPromise }, acc: any) =>
      (api.tx.xcmPallet || api.tx.polkadotXcm).limitedTeleportAssets(
        dest,
        {
          V3: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  // network: 'Any',
                  id: acc,
                },
              },
            },
          },
        },
        {
          V3: [
            {
              id: token,
              fun: { Fungible: amount },
            },
          ],
        },
        0,
        'Unlimited',
      ),
  limitedReserveTransferAssetsV2:
    (token: any, amount: any, dest: any) =>
    ({ api }: { api: ApiPromise }, acc: any) =>
      (api.tx.xcmPallet || api.tx.polkadotXcm).limitedReserveTransferAssets(
        dest,
        {
          V1: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  network: 'Any',
                  id: acc,
                },
              },
            },
          },
        },
        {
          V1: [
            {
              id: token,
              fun: { Fungible: amount },
            },
          ],
        },
        0,
        'Unlimited',
      ),
  limitedReserveTransferAssetsV3:
    (token: any, amount: any, dest: any) =>
    ({ api }: { api: ApiPromise }, acc: any) =>
      (api.tx.xcmPallet || api.tx.polkadotXcm).limitedReserveTransferAssets(
        dest,
        {
          V3: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  id: acc,
                },
              },
            },
          },
        },
        {
          V3: [
            {
              id: token,
              fun: { Fungible: amount },
            },
          ],
        },
        0,
        'Unlimited',
      ),
  transferAssetsUsingTypeAndThenV3:
    (token: any, amount: any, dest: any) =>
    ({ api }: { api: ApiPromise }, acc: any) =>
      (api.tx.xcmPallet || api.tx.polkadotXcm).transferAssetsUsingTypeAndThen(
        dest,
        {
          V3: [
            {
              id: token,
              fun: { Fungible: amount },
            },
          ],
        },
        'LocalReserve',
        { V3: token },
        'LocalReserve',
        {
          V3: [
            {
              DepositAsset: {
                assets: { Wild: 'All' },
                beneficiary: {
                  parents: 0,
                  interior: {
                    X1: {
                      AccountId32: {
                        id: acc,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        'Unlimited',
      ),

  // Sends a single asset to a sibling parachain and deposits it to `acc` there.
  transferAssetToParachainV3:
    (token: any, amount: any, paraId: number, transferType: string = 'DestinationReserve') =>
    ({ api }: { api: ApiPromise }, acc: any) =>
      api.tx.polkadotXcm.transferAssetsUsingTypeAndThen(
        { V3: { parents: 1, interior: { X1: { Parachain: paraId } } } },
        {
          V3: [
            {
              id: token,
              fun: { Fungible: amount },
            },
          ],
        },
        transferType,
        { V3: token },
        transferType,
        {
          V3: [
            {
              DepositAsset: {
                assets: { Wild: { AllCounted: 1 } },
                beneficiary: {
                  parents: 0,
                  interior: {
                    X1: {
                      AccountId32: {
                        id: acc,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        'Unlimited',
      ),
}

export const tx = {
  xcmPallet,
}

export const query = {
  balances: ({ api }: { api: ApiPromise }, address: string) => api.query.system.account(address),
  tokens:
    (token: any) =>
    ({ api }: { api: ApiPromise }, address: string) =>
      api.query.tokens.accounts(address, token),
  assets:
    (token: number | bigint) =>
    ({ api }: { api: ApiPromise }, address: string) =>
      api.query.assets.account(token, address),
  evm:
    (contract: string, slot: string) =>
    ({ api }: { api: ApiPromise }, _address: string) =>
      api.query.evm.accountStorages(contract, slot),
}
