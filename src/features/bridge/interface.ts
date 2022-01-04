import { ChainId } from "@mistswapdex/sdk"
import { default as bridge } from './bridge.json';

export type Chain = {
  id: ChainId
  name?: string
  icon?: string
}

export type BridgeDataInfo = {
  methodId: string,
  symbol: string,
  hint: string,
  name: string,
  logoUrl: string,
  title: string,
  chainId: number,
}

export type AnyswapTokenInfo = {
  ID: string
  Name: string
  Symbol: string
  Decimals: number
  Description: string
  BaseFeePercent: number
  BigValueThreshold: number
  DepositAddress: string
  ContractAddress: string
  DcrmAddress: string
  DisableSwap: boolean
  IsDelegateContract: boolean
  MaximumSwap: number
  MaximumSwapFee: number
  MinimumSwap: number
  MinimumSwapFee: number
  PlusGasPricePercentage: number
  SwapFeeRate: number
  FeeUsd?: number
  SwapRate?: number
}

export type AnyswapResultPairInfo = {
  DestToken: AnyswapTokenInfo
  PairID: string
  SrcToken: AnyswapTokenInfo
  destChainID: string
  logoUrl: string
  name: string
  srcChainID: string
  symbol: string
}

export type AvailableChainsInfo = {
  id: string
  token: AnyswapTokenInfo
  other: AnyswapTokenInfo
  logoUrl: string
  name: string
  symbol: string
  destChainID: string
}

export type AnyswapTokensMap = { [chainId: number]: { [contract: string]: AvailableChainsInfo } }


export const bridgeData: BridgeDataInfo[] = bridge;
export const ourTokenInfo = { Symbol: "BCH", Name: "Bitcoin Cash", Decimals: 18, ContractAddress: "bch" } as AnyswapTokenInfo

export const anyswapInfo: AnyswapTokensMap = (() => {
  const data = {}
  bridgeData.forEach(val => data[val.methodId] = val)

  let result: AnyswapTokensMap = {}

  Object.keys(data || {}).map((key) => {
    const bridgeInfo: BridgeDataInfo = data[key]
    const info: AnyswapResultPairInfo = [bridgeInfo].map(val => {
      return {
        SrcToken: {
          Decimals: 18,
          Symbol: val.symbol,
          ID: val.methodId,
          Name: val.title,
          ContractAddress: val.methodId
        } as AnyswapTokenInfo,
        DestToken: ourTokenInfo,
        PairID: val.methodId,
        destChainID: String(ChainId.SMARTBCH),
        srcChainID: String(val.chainId),
        logoUrl: val.logoUrl,
        name: val.title,
        symbol: val.symbol
      } as AnyswapResultPairInfo
    })[0]

    let sourceContractAddress = info.SrcToken.ContractAddress

    let existingSource = result[parseInt(info.srcChainID)]
    if (!existingSource) {
      result[parseInt(info.srcChainID)] = {
        [sourceContractAddress]: {
          destChainID: info.destChainID,
          id: info.PairID,
          logoUrl: info.logoUrl,
          name: info.name,
          symbol: info.symbol,
          token: info.DestToken,
          other: info.SrcToken,
        },
      }
    } else {
      result[parseInt(info.srcChainID)][sourceContractAddress] = {
        destChainID: info.destChainID,
        id: info.PairID,
        logoUrl: info.logoUrl,
        name: info.name,
        symbol: info.symbol,
        token: info.DestToken,
        other: info.SrcToken,
      }
    }

    let destContractAddress = info.DestToken.ContractAddress

    let existingDestination = result[parseInt(info.destChainID)]
    if (!existingDestination) {
      result[parseInt(info.destChainID)] = {
        [destContractAddress]: {
          destChainID: info.srcChainID,
          id: info.PairID,
          logoUrl: info.logoUrl,
          name: info.name,
          symbol: info.symbol,
          token: info.SrcToken,
          other: info.DestToken,
        },
      }
    } else {
      result[parseInt(info.destChainID)][destContractAddress] = {
        destChainID: info.srcChainID,
        id: info.PairID,
        logoUrl: info.logoUrl,
        name: info.name,
        symbol: info.symbol,
        token: info.SrcToken,
        other: info.DestToken,
      }
    }
  })

  const nativeBch = result[0]["bch"]

  bridgeData.forEach(val => {
    result[ChainId.SMARTBCH][val.methodId] = {
      destChainID: String(val.chainId),
      id: val.methodId,
      logoUrl: val.logoUrl,
      name: val.title,
      symbol: val.symbol,
      other: {
        Decimals: 18,
        Symbol: val.symbol,
        ID: val.methodId,
        Name: val.title,
        ContractAddress: val.methodId
      } as AnyswapTokenInfo,
      token: ourTokenInfo,
    }
  })

  return result
})()

const _chains: { [chainId: number]: Chain } = {}
const _chainIds = bridgeData.map(val => val.chainId).filter((val, index, array) => array.indexOf(val) === index)
const _chainMap: { [chainId: string]: BridgeDataInfo[] } = {}

_chainIds.forEach((chainId) => {
  _chainMap[chainId] = bridgeData.filter(val => val.chainId === chainId);
  const chainInfo = _chainMap[chainId][0]
  _chains[chainId] = { id: chainId, icon: chainInfo.logoUrl, name: chainInfo.name, symbol: chainInfo.symbol } as Chain
})

export const chains = _chains;
export const chainIds = _chainIds;
export const chainMap = _chainMap;