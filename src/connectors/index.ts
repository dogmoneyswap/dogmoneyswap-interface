import { BscConnector } from '@binance-chain/bsc-connector'
import { ChainId } from '@dogmoneyswap/sdk'
import { FortmaticConnector } from '../entities/FortmaticConnector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '../entities/NetworkConnector'
import { PortisConnector } from '@web3-react/portis-connector'
import { TorusConnector } from '@web3-react/torus-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { Web3Provider } from '@ethersproject/providers'
import RPC from '../config/rpc';

export function getNetwork(defaultChainId, urls = RPC) {
  return new NetworkConnector({
    defaultChainId,
    urls,
  })
}

export const network = new NetworkConnector({
  defaultChainId: ChainId.DOGECHAIN,
  urls: RPC,
})

let networkLibrary: Web3Provider | undefined

export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

const supportedChainIds = Object.values(ChainId) as number[]

export const injected = new InjectedConnector({
  supportedChainIds,
})

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: RPC,
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  supportedChainIds: [
    ChainId.SMARTBCH,
    ChainId.SMARTBCH_AMBER,
  ],
  chainId: network.provider.chainId
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: process.env.NEXT_PUBLIC_FORTMATIC_API_KEY ?? '',
  chainId: ChainId.SMARTBCH,
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: process.env.NEXT_PUBLIC_PORTIS_ID ?? '',
  networks: [ChainId.SMARTBCH],
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: RPC[ChainId.SMARTBCH],
  appName: 'DogMoneySwap',
  appLogoUrl: 'https://raw.githubusercontent.com/mistswapdex/art/master/mist/logo-256x256.png',
})

// mainnet only
export const torus = new TorusConnector({
  chainId: ChainId.SMARTBCH,
})

// binance only
export const binance = new BscConnector({ supportedChainIds: [56] })
