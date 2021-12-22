import {
  AbstractCurrency,
  ChainId,
  Currency,
  CurrencyAmount,
  JSBI,
  SmartBCH,
  NATIVE,
  Token,
  WNATIVE,
} from '@mistswapdex/sdk'
import React, { useCallback, useEffect, useState } from 'react'
let json;
import { AutoRow } from '../../components/Row'
import Container from '../../components/Container'
import Head from 'next/head'
import { ArrowDown, ArrowRight, Clock, Settings } from 'react-feather'
import Typography from '../../components/Typography'
import Web3Connect from '../../components/Web3Connect'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { /*useMultichainCurrencyBalance,*/ useTokenBalance } from '../../state/wallet/hooks'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import SolarbeamLogo from '../../components/SolarbeamLogo'
import { BottomGrouping } from '../../features/exchange-v1/swap/styleds'
import Button from '../../components/Button'
import DualChainCurrencyInputPanel from '../../components/DualChainCurrencyInputPanel'
import ChainSelect from '../../components/ChainSelect'

export type Chain = {
  id: ChainId
  name?: string
  icon?: string
}

import { useBridgeInfo } from '../../features/bridge/hooks'
import useSWR, { SWRResponse } from 'swr'
import { getAddress } from '@ethersproject/address'
import { classNames, formatNumber, formatPrice } from '../../functions'
import { SUPPORTED_NETWORKS } from '../../modals/ChainModal'
// import { NETWORK_ICON, NETWORK_LABEL } from '../../constants/networks'
import { ethers } from 'ethers'
// import { useAnyswapTokenContract, useTokenContract } from '../../hooks'
import Loader from '../../components/Loader'
import { getWeb3ReactContext, useWeb3React } from '@web3-react/core'
import NavLink from '../../components/NavLink'
import { useRouter } from 'next/router'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import { NETWORK_ICON, NETWORK_LABEL } from '../../config/networks'
import { useTokenContract } from '../../hooks'

import { default as bridge } from './bridge.json';
import { useEthPrice } from '../../services/graph';
import BridgeModal from '../../modals/BridgeModal';
import { xaiGetPermissions, xaiQuote } from '../../services/sideshift.ai';
import { getBchPoolBalance, getSmartBchPoolBalance, HopDirection, randomId } from '../../services/hop.cash';
import { useTransactionUpdater } from '../../state/bridgeTransactions/hooks';
import { TransactionDetails } from '../../state/bridgeTransactions/reducer';
import CashAddressInput from '../../components/Input/Cashaddress';

type BridgeDataInfo = {
  methodId: string,
  symbol: string,
  hint: string,
  name: string,
  logoUrl: string,
  title: string,
  chainId: number,
}

type AnyswapTokenInfo = {
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

type AnyswapResultPairInfo = {
  DestToken: AnyswapTokenInfo
  PairID: string
  SrcToken: AnyswapTokenInfo
  destChainID: string
  logoUrl: string
  name: string
  srcChainID: string
  symbol: string
}

type AvailableChainsInfo = {
  id: string
  token: AnyswapTokenInfo
  other: AnyswapTokenInfo
  logoUrl: string
  name: string
  symbol: string
  destChainID: string
}

export type AnyswapTokensMap = { [chainId: number]: { [contract: string]: AvailableChainsInfo } }

const bridgeData: BridgeDataInfo[] = bridge;
const ourTokenInfo = { Symbol: "BCH", Name: "Bitcoin Cash", Decimals: 18, ContractAddress: "bch" } as AnyswapTokenInfo

const anyswapInfo: AnyswapTokensMap = (() => {
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
    // if (!sourceContractAddress) {
    //   sourceContractAddress = WNATIVE[parseInt(info.srcChainID)].address
    // }

    // sourceContractAddress = sourceContractAddress.toLowerCase()

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
    // if (!destContractAddress) {
    //   destContractAddress = WNATIVE[parseInt(info.destChainID)].address
    // }

    // destContractAddress = destContractAddress.toLowerCase()

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
  result[ChainId.SMARTBCH] = {
    "bch": {
        destChainID: "0",
        id: nativeBch.id,
        logoUrl: nativeBch.logoUrl,
        name: nativeBch.name,
        symbol: nativeBch.symbol,
        token: ourTokenInfo,
        other: nativeBch.token,
    }
  }

  return result
})()

const chains: { [chainId: number]: Chain } = {}
const chainIds = bridgeData.map(val => val.chainId).filter((val, index, array) => array.indexOf(val) === index)
const chainMap: { [chainId: string]: BridgeDataInfo[] } = {}

chainIds.forEach((chainId) => {
  chainMap[chainId] = bridgeData.filter(val => val.chainId === chainId);
  const chainInfo = chainMap[chainId][0]
  chains[chainId] = { id: chainId, icon: chainInfo.logoUrl, name: chainInfo.name, symbol: chainInfo.symbol } as Chain
})

export const DEFAULT_CHAIN_FROM: Chain = chains[0]
export const DEFAULT_CHAIN_TO: Chain = chains[ChainId.SMARTBCH]
export const BridgeChains = chains

export default function Bridge() {
  const { i18n } = useLingui()

  const { account: activeAccount, chainId: activeChainId } = useActiveWeb3React()
  const { account, library, activate, chainId } = useWeb3React()
  const { push } = useRouter()

  const bchPrice = useEthPrice()

  const transactionUpdater = useTransactionUpdater();

  const currentChainFrom = chainId && chains[chainId] &&
    { id: chainId, icon: chains[chainId].icon, name: chains[chainId].name }

  const [chainFrom, setChainFrom] = useState<Chain | null>(DEFAULT_CHAIN_FROM)
  const [chainTo, setChainTo] = useState<Chain | null>(DEFAULT_CHAIN_TO)
  const [shiftAllowed, setShiftAllowed] = useState<boolean>(true)
  const hopDirection = (chainTo === DEFAULT_CHAIN_TO) ? "in" : "out"

  const [methodId, setMethodId] = useState<string | null>(null)
  const [bridgeTransactionHash, setBridgeTransactionHash] = useState<string | null>(null)
  const [destinationAddress, setDestinationAddress] = useState<string | null>("")

  const [tokenList, setTokenList] = useState<Currency[] | null>([])
  const [currency0, setCurrency0] = useState<Currency | null>(null)
  const [currencyAmount, setCurrencyAmount] = useState<string | null>('')
  const [tokenToBridge, setTokenToBridge] = useState<AvailableChainsInfo | null>(null)
  const currencyContract = null // useTokenContract(currency0?.isToken && currency0?.address, true)
  const anyswapCurrencyContract = null
  // const anyswapCurrencyContract = useAnyswapTokenContract(
  //   currency0 && currency0.chainId == ChainId.SMARTBCH && tokenToBridge.other.ContractAddress,
  //   true
  // )
  const [pendingTx, setPendingTx] = useState(false)
  const [showBridgeModal, setShowBridgeModal] = useState(false)

  const selectedCurrencyBalance = useMultichainCurrencyBalance(
    chainFrom?.id,
    account ?? undefined,
    currency0 ?? undefined
  )

  useEffect(() => {
    let tokens: Currency[] = Object.keys((anyswapInfo && anyswapInfo[chainFrom.id]) || {})
      .filter((r) => anyswapInfo[chainFrom.id][r].destChainID == chainTo.id.toString())
      .map((r) => {
        const info: AvailableChainsInfo = anyswapInfo[chainFrom.id][r]
        const token = new Token(chainFrom.id, ethers.constants.AddressZero, info.other.Decimals, info.other.Symbol, info.other.Name) as any
        token.logoURI = info.logoUrl
        return token
      })

    setTokenList(tokens)
    setCurrencyAmount('0')
    handleCurrencySelect(tokens[0])
  }, [chainFrom.id, chainTo.id, anyswapInfo])

  const handleChainFrom = useCallback(
    (chain: Chain) => {
      if (chain.id === ChainId.SMARTBCH) {
        setChainTo(DEFAULT_CHAIN_FROM)
      } else {
        setChainTo(DEFAULT_CHAIN_TO)
      }
      setChainFrom(chain)
    },
    [chainFrom, chainTo]
  )

  const handleChainTo = useCallback(
    (chain: Chain) => {
      let changeFrom = chainFrom
      if (chainFrom.id == chain.id) {
        changeFrom = chainTo
      }
      if (changeFrom.id !== ChainId.SMARTBCH && chain.id !== ChainId.SMARTBCH) {
        setChainFrom(DEFAULT_CHAIN_TO)
      } else {
        setChainFrom(changeFrom)
      }
      setChainTo(chain)
    },
    [chainFrom, chainTo]
  )

  const handleTypeInput = useCallback(
    (value: string) => {
      setCurrencyAmount(value)
    },
    [setCurrencyAmount]
  )

  const handleCurrencySelect = useCallback(
    async (currency: Currency) => {
      setCurrency0(currency)
      handleTypeInput('')
      if (currency) {
        const methodId = Object.values(anyswapInfo[chainFrom.id]).filter((val: AvailableChainsInfo) => (currency.chainId === ChainId.SMARTBCH) || (val.symbol == currency.symbol && val.name == currency.name))[0].id
        const tokenTo = anyswapInfo[chainFrom.id][methodId]

        tokenTo.other.MinimumSwap = 0
        tokenTo.other.MaximumSwap = 0
        tokenTo.other.FeeUsd = 0
        tokenTo.other.SwapRate = 1

        const shiftNeeded = methodId !== "bch"

        let hopCashMaximum: number
        if (hopDirection === HopDirection.in) {
          hopCashMaximum = library ? parseFloat(await getSmartBchPoolBalance(library)) || 0. : 0.
        } else {
          hopCashMaximum = parseFloat(await getBchPoolBalance()) || 0.
        }

        if (shiftNeeded) {
          const allowed = await xaiGetPermissions()
          setShiftAllowed(allowed)

          if (allowed) {
            const quote = await xaiQuote(methodId)

            tokenTo.other.MinimumSwap = parseFloat(quote.min)
            tokenTo.other.MaximumSwap = Math.min(parseFloat(quote.max), hopCashMaximum)
            tokenTo.other.FeeUsd = parseFloat(quote.estimatedNetworkFeesUsd)
            tokenTo.other.SwapRate = parseFloat(quote.rate)
          }
        } else {
          if (!shiftAllowed) {
            setShiftAllowed(true)
          }

          tokenTo.other.MinimumSwap = 0.01001000
          tokenTo.other.MaximumSwap = hopCashMaximum
        }
        setTokenToBridge(tokenTo)
        setMethodId(methodId)
      }
    },
    [anyswapInfo, chainFrom.id, handleTypeInput]
  )

  const bridgeButtonClick = () => {
    const address = hopDirection === HopDirection.in ? account : destinationAddress;

    const bridgeTransaction = {
      hash: randomId(),
      hopStatus: { destinationAddress: address, direction: hopDirection },
      shiftStatus: {},
      addedTime: new Date().getTime(),
      initialAmount: currencyAmount,
      symbol: currency0.symbol,
      from: activeAccount || account,
      srcChainId: chainFrom.id,
      destChainId: chainTo.id,
      methodId: methodId,
      destinationAddress: address
    } as TransactionDetails;

    if (hopDirection === HopDirection.out) {
      bridgeTransaction.hopStatus.sbchAmount = currencyAmount;
    }

    transactionUpdater(bridgeTransaction)
    setShowBridgeModal(true)
    setBridgeTransactionHash(bridgeTransaction.hash)
  }

  type SwapInfo = {
    minimumAmount: number,
    maximumAmount: number,
    feeUsd: number,
    feeBch: number,
    receiveAmount: number,
  }
  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null)
  useEffect(() => {
    if (tokenToBridge) {
      const amount = parseFloat(currencyAmount) || 0.
      const feeUsdInBch = tokenToBridge.other.FeeUsd / bchPrice
      const bchAmount = tokenToBridge.other.SwapRate * amount + (feeUsdInBch || 0.)
      let feeBch = bchAmount * 0.001
      if (feeBch < 0.0001)
        feeBch = 0.0001

      const minimumBchAmount = 0.01
      let minimumAssetAmount = minimumBchAmount / tokenToBridge.other.SwapRate
      minimumAssetAmount = Math.max(tokenToBridge.other.MinimumSwap, minimumBchAmount)
      minimumAssetAmount = Math.ceil(minimumAssetAmount * 1e6) / 1e6

      const receiveAmount = Math.max(tokenToBridge.other.SwapRate * amount - feeBch, 0)

      setSwapInfo({
        minimumAmount: minimumAssetAmount,
        maximumAmount: tokenToBridge.other.MaximumSwap,
        feeUsd: tokenToBridge.other.FeeUsd,
        feeBch: feeBch,
        receiveAmount: receiveAmount
      })
    }
  }, [currencyAmount, tokenToBridge])

  const insufficientBalance = () => {
    if (currencyAmount && selectedCurrencyBalance) {
      try {
        const balance = parseFloat(selectedCurrencyBalance.toFixed(currency0.decimals))
        const amount = parseFloat(currencyAmount)
        return amount > balance
      } catch (ex) {
        return false
      }
    }
    return false
  }

  const aboveMin = () => {
    if (currencyAmount && tokenToBridge) {
      const amount = parseFloat(currencyAmount)
      const minAmount = parseFloat(tokenToBridge?.other?.MinimumSwap.toString())
      return amount >= minAmount
    }
    return false
  }

  const belowMax = () => {
    if (currencyAmount && tokenToBridge) {
      const amount = parseFloat(currencyAmount)
      const maxAmount = parseFloat(tokenToBridge?.other?.MaximumSwap.toString())
      return amount <= maxAmount
    }
    return false
  }

  const getAmountToReceive = () => {
    if (!tokenToBridge) return 0

    let fee = parseFloat(currencyAmount) * tokenToBridge?.other?.SwapFeeRate
    if (fee < tokenToBridge?.other?.MinimumSwapFee) {
      fee = tokenToBridge?.other?.MinimumSwapFee
    } else if (fee > tokenToBridge?.other?.MaximumSwapFee) {
      fee = tokenToBridge?.other?.MinimumSwapFee
    }

    return (parseFloat(currencyAmount) - fee).toFixed(6)
  }

  const buttonDisabled =
    !currency0 ||
    !currencyAmount ||
    currencyAmount == '' ||
    !aboveMin() ||
    !belowMax() ||
    // insufficientBalance() ||
    pendingTx

  const buttonText =
    !shiftAllowed ? `Bridge forbidden (blocked country)` :
    !currency0
      ? `Select a Token`
      : !currencyAmount || currencyAmount == ''
      ? 'Enter an Amount'
      : !aboveMin()
      ? `Below Minimum Amount`
      : !belowMax()
      ? `Above Maximum Amount`
      : insufficientBalance()
      ? `Insufficient Balance`
      : pendingTx
      ? `Confirming Transaction`
      : `Bridge ${currency0?.symbol}`

  // const bridgeToken = async () => {
  //   const token = tokenToBridge.other
  //   const depositAddress = currency0.chainId == ChainId.SMARTBCH ? token.ContractAddress : token.DepositAddress

  //   const amountToBridge = ethers.utils.parseUnits(currencyAmount, token.Decimals)
  //   setPendingTx(true)

  //   try {
  //     if (currency0.chainId == ChainId.SMARTBCH) {
  //       if (currency0.isNative) {
  //       } else if (currency0.isToken) {
  //         const fn = anyswapCurrencyContract?.interface?.getFunction('Swapout')
  //         const data = anyswapCurrencyContract.interface.encodeFunctionData(fn, [amountToBridge.toString(), account])
  //         const tx = await library.getSigner().sendTransaction({
  //           value: 0x0,
  //           from: account,
  //           to: currency0.address,
  //           data,
  //         })
  //         addTransaction(tx, {
  //           summary: `${i18n._(t`Bridge `)} ${tokenToBridge.symbol}`,
  //           destChainId: chainTo.id.toString(),
  //           srcChaindId: chainFrom.id.toString(),
  //           pairId: tokenToBridge.id,
  //         })
  //         push('/bridge/history')
  //       }
  //     } else {
  //       if (currency0.isNative) {
  //         const tx = await library.getSigner().sendTransaction({
  //           from: account,
  //           to: depositAddress,
  //           value: amountToBridge,
  //         })
  //         addTransaction(tx, {
  //           summary: `${i18n._(t`Bridge `)} ${tokenToBridge.symbol}`,
  //           destChainId: chainTo.id.toString(),
  //           srcChaindId: chainFrom.id.toString(),
  //           pairId: tokenToBridge.id,
  //         })
  //         push('/bridge/history')
  //       } else if (currency0.isToken) {
  //         const fn = currencyContract?.interface?.getFunction('transfer')
  //         const data = currencyContract.interface.encodeFunctionData(fn, [depositAddress, amountToBridge.toString()])
  //         const tx = await library.getSigner().sendTransaction({
  //           value: 0x0,
  //           from: account,
  //           to: currency0.address,
  //           data,
  //         })
  //         addTransaction(tx, {
  //           summary: `${i18n._(t`Bridge `)} ${tokenToBridge.symbol}`,
  //           destChainId: chainTo.id.toString(),
  //           srcChaindId: chainFrom.id.toString(),
  //           pairId: tokenToBridge.id,
  //         })
  //         push('/bridge/history')
  //       }
  //     }
  //   } catch (ex) {
  //   } finally {
  //     setPendingTx(false)
  //   }
  // }

  const anyswapChains = Object.keys(anyswapInfo).map(val => parseInt(val)) //[ChainId.SMARTBCH]
  let availableChains = Object.keys(anyswapInfo || {})
    .map((r) => parseInt(r))
    .filter((r) => anyswapChains.includes(r))

  // put smartbch on the top
  availableChains = [ChainId.SMARTBCH, ...availableChains.filter(val => val !== ChainId.SMARTBCH)]

  return (
    <>
      {showBridgeModal && (<BridgeModal
        isOpen={showBridgeModal}
        hash={bridgeTransactionHash}
        onDismiss={() => setShowBridgeModal(false)} />)}
      {/* <Modal isOpen={showBridgeModal} onDismiss={() => setShowBridgeModal(false)}>
        <div className="space-y-4">
          <ModalHeader title={i18n._(t`Bridge ${currency0?.symbol}`)} onClose={() => setShowBridgeModal(false)} />
          <Typography variant="sm" className="font-medium">
            {i18n._(t`You are sending ${formatNumber(currencyAmount)} ${currency0?.symbol} from ${chainFrom?.name}`)}
          </Typography>
          <Typography variant="sm" className="font-medium">
            {i18n._(t`You will receive ${formatNumber(getAmountToReceive())} ${currency0?.symbol} on ${chainTo?.name}`)}
          </Typography>

          <Button color="gradient" size="lg" disabled={pendingTx} onClick={() => bridgeToken()}>
            <Typography variant="lg">
              {pendingTx ? (
                <div className={'p-2'}>
                  <AutoRow gap="6px" justify="center">
                    {buttonText} <Loader stroke="white" />
                  </AutoRow>
                </div>
              ) : (
                i18n._(t`Bridge ${currency0?.symbol}`)
              )}
            </Typography>
          </Button>
        </div>
      </Modal> */}

      <Head>
        <title>{i18n._(t`Bridge`)} | MISTswap</title>
        <meta key="description" name="description" content="Bridge" />
      </Head>

      {/* <SolarbeamLogo /> */}

      <Container maxWidth="2xl" className="space-y-6">
        <DoubleGlowShadow /*opacity="0.6"*/>
          <div className="p-4 space-y-4 rounded bg-dark-900" style={{ zIndex: 1 }}>
            <div className="flex items-center justify-center mb-4 space-x-3">
              <div className="grid grid-cols-2 rounded p-3px bg-dark-800 h-[46px]">
                <NavLink
                  activeClassName="font-bold border rounded text-high-emphesis border-dark-700 bg-dark-700"
                  exact
                  href={{
                    pathname: '/bridge',
                  }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis ">
                    <Typography component="h1" variant="lg">
                      {i18n._(t`Bridge`)}
                    </Typography>
                  </a>
                </NavLink>
                <NavLink
                  activeClassName="font-bold border rounded text-high-emphesis border-dark-700 bg-dark-700"
                  exact
                  href={{
                    pathname: '/bridge/history',
                  }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                    <Typography component="h1" variant="lg">
                      {i18n._(t`History`)}
                    </Typography>
                  </a>
                </NavLink>
                {/* <NavLink
                  activeClassName="font-bold border rounded text-high-emphesis border-dark-700 bg-dark-700"
                  exact
                  href={{
                    pathname: '/bridge/faucet',
                  }}
                >
                  <a className="flex items-center justify-center px-4 text-base font-medium text-center rounded-md text-secondary hover:text-high-emphesis">
                    <Typography component="h1" variant="lg">
                      {i18n._(t`Faucet`)}
                    </Typography>
                  </a>
                </NavLink> */}
              </div>
            </div>

            <div className="p-4 text-center">
              <div className="items-center justify-between space-x-3">
                <Typography component="h3" variant="base">
                  {i18n._(t`Bridge tokens to and from the SmartBCH Network`)}
                </Typography>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between text-center">
              <ChainSelect
                chains={chains}
                availableChains={availableChains}
                label="From"
                chain={chainFrom}
                otherChain={chainTo}
                onChainSelect={(chain) => handleChainFrom(chain)}
                switchOnSelect={true}
              />
              <button className={'sm:m-6'}>
                <ArrowRight size="32" />
              </button>
              <ChainSelect
                chains={chains}
                availableChains={chainFrom.id == ChainId.SMARTBCH ? [0] : [ChainId.SMARTBCH]}
                label="To"
                chain={chainTo}
                otherChain={chainFrom}
                onChainSelect={(chain) => handleChainTo(chain)}
                switchOnSelect={false}
              />
            </div>

            <DualChainCurrencyInputPanel
              label={i18n._(t`Token to bridge:`)}
              value={currencyAmount}
              currency={currency0}
              onUserInput={handleTypeInput}
              onMax={(amount) => handleTypeInput(amount)}
              onCurrencySelect={(currency) => {
                handleCurrencySelect(currency)
              }}
              chainFrom={chainFrom}
              chainTo={chainTo}
              tokenList={tokenList}
              chainList={anyswapInfo}
            />

            {chainTo === BridgeChains[0] && <div className={classNames('mt-0 pt-0 p-5 rounded rounded-t-none bg-dark-800')} style={{margin: 0}}>
              <div className={"flex flex-col items-center md:text-xl text-base justify-between space-y-3 sm:space-y-0 sm:flex-row"}>
                <div className={classNames('w-full sm:w-72')}>
                  Destination address
                </div>
                <div className={classNames('flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3')}>
                  <CashAddressInput className='h-10 font-bold'
                    value={destinationAddress}
                    onUserInput={(value) => setDestinationAddress(value)} />
                </div>
              </div>
            </div>}

            <BottomGrouping>
              {!account ? (
                <Web3Connect size="lg" color="gradient" className="w-full" />
              ) : (
                <Button
                  onClick={bridgeButtonClick}
                  color={buttonDisabled ? 'gray' : 'gradient'}
                  size="lg"
                  disabled={buttonDisabled}
                >
                  {pendingTx ? (
                    <div className={'p-2'}>
                      <AutoRow gap="6px" justify="center">
                        {buttonText} <Loader stroke="white" />
                      </AutoRow>
                    </div>
                  ) : (
                    buttonText
                  )}
                </Button>
              )}
            </BottomGrouping>

            {currency0 && (
              <div className={'p-2 sm:p-5 rounded bg-dark-800'}>
                {tokenToBridge?.other?.MinimumSwapFee > 0 && (
                  <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                    <div className="text-sm font-medium text-secondary">
                      Minimum Bridge Fee: {formatNumber(tokenToBridge?.other?.MinimumSwapFee)}{' '}
                      {tokenToBridge?.other?.Symbol}
                    </div>
                  </div>
                )}
                {tokenToBridge?.other?.MaximumSwapFee > 0 && (
                  <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                    <div className="text-sm font-medium text-secondary">
                      Maximum Bridge Fee: {formatNumber(tokenToBridge?.other?.MaximumSwapFee)}{' '}
                      {tokenToBridge?.other?.Symbol}
                    </div>
                  </div>
                )}
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    Minimum Bridge Amount: {swapInfo?.minimumAmount.toFixed(5)}{' '}
                    {tokenToBridge?.other?.Symbol}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    Maximum Bridge Amount: {formatNumber(swapInfo?.maximumAmount)}{' '}
                    {tokenToBridge?.other?.Symbol}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    Estimated Fee Included: {swapInfo?.feeUsd.toFixed(2)} USD + {swapInfo?.feeBch.toFixed(5)} BCH
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    You will receive about: {formatNumber(swapInfo?.receiveAmount)} BCH
                  </div>
                </div>
                {/* <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    Amounts greater than {formatNumber(tokenToBridge?.other?.BigValueThreshold)}{' '}
                    {tokenToBridge?.other?.Symbol} could take up to 12 hours.
                  </div>
                </div> */}
              </div>
            )}

            <AutoRow
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
              justify={'center'}
              gap={'0 3px'}
            >
              {i18n._(t`Powered by SideShift.ai and hop.cash`)}
            </AutoRow>
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
function useMultichainCurrencyBalance(id: ChainId, arg1: string, arg2: Currency) {
  return 0
}

