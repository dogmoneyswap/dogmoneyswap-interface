import {
  ChainId,
  Currency,
  Token,
} from '@mistswapdex/sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { AutoRow } from '../../components/Row'
import Container from '../../components/Container'
import Head from 'next/head'
import { ArrowRight } from 'react-feather'
import Typography from '../../components/Typography'
import Web3Connect from '../../components/Web3Connect'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useETHBalances } from '../../state/wallet/hooks'
import DoubleGlowShadow from '../../components/DoubleGlowShadow'
import { BottomGrouping } from '../../features/exchange-v1/swap/styleds'
import Button from '../../components/Button'
import DualChainCurrencyInputPanel from '../../components/DualChainCurrencyInputPanel'
import ChainSelect from '../../components/ChainSelect'
import { QuestionMarkCircleIcon } from '@heroicons/react/solid'
import { classNames, formatNumber } from '../../functions'
import { ethers } from 'ethers'
import { useWeb3React } from '@web3-react/core'
import NavLink from '../../components/NavLink'

import { useEthPrice } from '../../services/graph';
import BridgeModal from '../../modals/BridgeModal';
import { xaiGetPermissions, xaiQuote } from '../../services/sideshift.ai';
import { getBchPoolBalance, getSmartBchPoolBalance, HopDirection, randomId } from '../../services/hop.cash';
import { useTransactionUpdater } from '../../state/bridgeTransactions/hooks';
import { TransactionDetails } from '../../state/bridgeTransactions/reducer';
import CashAddressInput from '../../components/Input/Cashaddress';
import { AvailableChainsInfo, chains, Chain, anyswapInfo, SwapInfo} from '../../features/bridge/interface';
import { NetworkContextName } from '../../constants'

export const DEFAULT_CHAIN_FROM: Chain = chains[0]
export const DEFAULT_CHAIN_TO: Chain = chains[ChainId.SMARTBCH]
export const BridgeChains = chains

export default function Bridge() {
  const { i18n } = useLingui()

  const { account: activeAccount, chainId: activeChainId } = useActiveWeb3React()
  const { account, activate, chainId, library: accountLibrary } = useWeb3React()
  const { library: networkLibrary } = useWeb3React(NetworkContextName)
  const library = accountLibrary || networkLibrary
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const bchPrice = useEthPrice()
  const transactionUpdater = useTransactionUpdater();

  const [helpVisible, setHelpVisible] = useState<boolean>(false)
  const [chainFrom, setChainFrom] = useState<Chain | null>(DEFAULT_CHAIN_FROM)
  const [chainTo, setChainTo] = useState<Chain | null>(DEFAULT_CHAIN_TO)
  const [shiftAllowed, setShiftAllowed] = useState<boolean>(true)
  const [methodId, setMethodId] = useState<string | null>(null)
  const [bridgeTransactionHash, setBridgeTransactionHash] = useState<string | null>(null)
  const [destinationAddress, setDestinationAddress] = useState<string | null>("")
  const [tokenList, setTokenList] = useState<Currency[] | null>([])
  const [currency0, setCurrency0] = useState<Currency | null>(null)
  const [sendAmount, setSendAmount] = useState<string | null>('')
  const [receiveAmount, setReceiveAmount] = useState<string | null>('')
  const [tokenToBridge, setTokenToBridge] = useState<AvailableChainsInfo | null>(null)
  const [showBridgeModal, setShowBridgeModal] = useState(false)
  const [BCH, setBCH] = useState<Currency | null>(null)
  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null)

  const hopDirection = (chainTo === DEFAULT_CHAIN_TO) ? HopDirection.in : HopDirection.out

  useEffect(() => {
    const infoToCurrency = (chainId, r) => {
      const info: AvailableChainsInfo = anyswapInfo[chainId][r]
      const token = new Token(chainTo.id, ethers.constants.AddressZero, info.other.Decimals, info.other.Symbol, info.other.Name) as any
      token.logoURI = info.logoUrl
      return token
    }

    let tokens: Currency[] = Object.keys((anyswapInfo && anyswapInfo[chainFrom.id]) || {})
      .filter((r) => anyswapInfo[chainFrom.id][r].destChainID == chainTo.id.toString())
      .map((r) => infoToCurrency(chainFrom.id, r))

    setBCH(infoToCurrency(0, 'bch'));

    setTokenList(tokens)
    setSendAmount('')
    setReceiveAmount('')
    handleCurrencySelect(tokens[0])
  }, [chainFrom.id, chainTo.id])

  const handleChainFrom = useCallback(
    (chain: Chain) => {
      if (chain.id === ChainId.SMARTBCH) {
        setChainTo(DEFAULT_CHAIN_FROM)
      } else {
        setChainTo(DEFAULT_CHAIN_TO)
      }
      setChainFrom(chain)
    },
    [chainFrom.id, chainTo.id]
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
    [chainFrom.id, chainTo.id]
  )

  const handleSendAmount = useCallback(
    (sendAmount: string) => {
      setSendAmount(sendAmount);

      if (tokenToBridge) {
        const amount = parseFloat(sendAmount) || 0.
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

        setReceiveAmount(receiveAmount.toString());

        setSwapInfo({
          minimumAmount: minimumAssetAmount,
          maximumAmount: tokenToBridge.other.MaximumSwap,
          feeUsd: tokenToBridge.other.FeeUsd,
          feeBch: feeBch,
          receiveAmount: receiveAmount,
          from: hopDirection === HopDirection.in ? tokenToBridge.symbol : "BCH",
          to: hopDirection === HopDirection.in ? "BCH" : tokenToBridge.symbol,
        })

        if (!sendAmount) {
          setReceiveAmount('');
          return;
        }
      }
    },
    [setSendAmount, tokenToBridge]
  )

  const handleReceiveAmount = useCallback(
    (receiveAmount: string) => {
      setReceiveAmount(receiveAmount)

      if (tokenToBridge) {
        const amount = parseFloat(receiveAmount) || 0.
        const feeUsdInBch = tokenToBridge.other.FeeUsd / bchPrice
        const bchAmount = amount / tokenToBridge.other.SwapRate + (feeUsdInBch || 0.)
        let feeBch = bchAmount * 0.001
        if (feeBch < 0.0001)
          feeBch = 0.0001

        const minimumBchAmount = 0.01
        let minimumAssetAmount = minimumBchAmount / tokenToBridge.other.SwapRate
        minimumAssetAmount = Math.max(tokenToBridge.other.MinimumSwap, minimumBchAmount)
        minimumAssetAmount = Math.ceil(minimumAssetAmount * 1e6) / 1e6

        const sendAmount = Math.max(amount / tokenToBridge.other.SwapRate + feeBch, 0)

        setSendAmount(sendAmount.toString());

        setSwapInfo({
          minimumAmount: minimumAssetAmount,
          maximumAmount: tokenToBridge.other.MaximumSwap,
          feeUsd: tokenToBridge.other.FeeUsd,
          feeBch: feeBch,
          receiveAmount: parseFloat(receiveAmount) || 0.,
          from: hopDirection === HopDirection.in ? tokenToBridge.symbol : "BCH",
          to: hopDirection === HopDirection.in ? "BCH" : tokenToBridge.symbol,
        })

        if (!receiveAmount) {
          setSendAmount('');
          return;
        }
      }
    },
    [setReceiveAmount, tokenToBridge]
  )

  const handleCurrencySelect = useCallback(
    async (currency: Currency) => {
      setCurrency0(currency)
      // setSendAmount('')
      // setReceiveAmount('')
      if (currency) {
        const methodId = Object.values(anyswapInfo[chainFrom.id]).filter((val: AvailableChainsInfo) => Number(val.destChainID) === currency.chainId && val.symbol == currency.symbol && val.name == currency.name)[0].id
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
          hopCashMaximum = await getBchPoolBalance()
        }

        if (shiftNeeded) {
          const allowed = await xaiGetPermissions()
          setShiftAllowed(allowed)

          if (allowed) {
            const from = hopDirection === HopDirection.in ? methodId : "bch"
            const to = hopDirection === HopDirection.in ? "bch" : methodId
            const quote = await xaiQuote(from, to)

            tokenTo.other.MinimumSwap = parseFloat(quote.min)
            tokenTo.other.MaximumSwap = Math.min(parseFloat(quote.max), hopCashMaximum)
            tokenTo.other.FeeUsd = parseFloat(quote.estimatedNetworkFeesUsd)
            tokenTo.other.SwapRate = parseFloat(quote.rate)
          }
        } else {
          tokenTo.other.MinimumSwap = 0.01001000
          tokenTo.other.MaximumSwap = hopCashMaximum
        }
        setTokenToBridge(tokenTo)
        setMethodId(methodId)
      }
    },
    [chainFrom.id]
  )

  const bridgeButtonClick = () => {
    const destAddress = hopDirection === HopDirection.in ? (activeAccount || account) : destinationAddress

    const bridgeTransaction = {
      hash: randomId(),
      hopStatus: { destinationAddress: destAddress, direction: hopDirection },
      shiftStatus: { direction: hopDirection, methodId },
      addedTime: new Date().getTime(),
      initialAmount: sendAmount,
      symbol: hopDirection === HopDirection.in ? currency0.symbol : "BCH",
      from: activeAccount || account,
      srcChainId: chainFrom.id,
      destChainId: chainTo.id,
      methodId: methodId,
      destinationAddress: destAddress,
      errorTrace: null,
      beforeError: null
    } as TransactionDetails;

    if (hopDirection === HopDirection.out) {
      bridgeTransaction.hopStatus.sbchAmount = sendAmount;
    }

    transactionUpdater(bridgeTransaction)
    setShowBridgeModal(true)
    setBridgeTransactionHash(bridgeTransaction.hash)
  }

  useEffect(() => {
    handleSendAmount(sendAmount);
  }, [tokenToBridge])

  const insufficientBalance = () => {
    if (hopDirection !== HopDirection.out)
      return false;

    if (sendAmount) {
      try {
        const balance = parseFloat(userEthBalance.toFixed(currency0.decimals))
        const amount = parseFloat(sendAmount)
        return amount > balance
      } catch (ex) {
        return false
      }
    }
    return false
  }

  const aboveMin = () => {
    if (sendAmount && tokenToBridge) {
      const amount = parseFloat(sendAmount)
      const minAmount = parseFloat(tokenToBridge?.other?.MinimumSwap.toString())
      return amount >= minAmount
    }
    return false
  }

  const belowMax = () => {
    if (sendAmount && tokenToBridge) {
      const amount = parseFloat(sendAmount)
      const maxAmount = parseFloat(tokenToBridge?.other?.MaximumSwap.toString())
      return amount <= maxAmount
    }
    return false
  }

  const buttonDisabled =
    !currency0 ||
    !sendAmount ||
    sendAmount == '' ||
    !aboveMin() ||
    !belowMax() ||
    insufficientBalance()

  const buttonText =
    !shiftAllowed ? i18n._(t`Bridge forbidden (blocked country)`) :
    !currency0
      ? i18n._(t`Select a Token`)
      : !sendAmount || sendAmount == ''
      ? i18n._(t`Enter an Amount`)
      : !aboveMin()
      ? i18n._(t`Below Minimum Amount`)
      : !belowMax()
      ? i18n._(t`Above Maximum Amount`)
      : insufficientBalance()
      ? i18n._(t`Insufficient Balance`)
      : i18n._(t`Bridge ${currency0?.symbol}`)

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

      <Head>
        <title>{i18n._(t`Bridge`)} | MISTswap</title>
        <meta key="description" name="description" content="Bridge" />
      </Head>

      <Container maxWidth="2xl" className="mt-5 space-y-6">
        <DoubleGlowShadow>
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

            <div className="flex justify-center p-4 text-center">
              <div className="flex items-center gap-1">
                <Typography component="h3" variant="base">
                  {i18n._(t`Bridge tokens to and from the SmartBCH Network`)}
                </Typography>
                <QuestionMarkCircleIcon
                  className="cursor-pointer"
                  onClick={() => setHelpVisible(!helpVisible)}
                  width={16}
                  height={16} />
              </div>
            </div>

            {helpVisible && (<div className="p-3 mx-5 rounded bg-dark-800">
              <p>{i18n._(t`This service helps you to try out the SmartBCH network by converting your assets to BCH and bridging it to our network`)}</p>
              <p>{i18n._(t`Our bridge utilizes a two-step process:`)}</p>
              <p className="pl-4">{i18n._(t`1) asset coversion from anything to BCH with`)} <a className="font-bold" target="_blank" rel="noreferrer" href="https://sideshift.ai">SideShift.ai</a>.</p>
              <p className="pl-4">{i18n._(t`2) bridging the BCH to SmartBCH with `)} <a className="font-bold" target="_blank" rel="noreferrer" href="https://hop.cash">hop.cash</a></p>
              <p>{i18n._(t`If you experience any issues with SideShift conversion, note the order id, visit their website and ask for support there or in their telegram group: `)} <a className="font-bold" target="_blank" rel="noreferrer" href="https://t.me/sideshift">https://t.me/sideshift</a>.</p>
              <p>{i18n._(t`For issues related to hop cash, note the BCH and SBCH transaction ids and ask for support here:`)} <a className="font-bold" target="_blank" rel="noreferrer" href="https://t.me/hopcash">https://t.me/hopcash</a>.</p>
            </div>)}

            <div className="flex flex-row items-center justify-between text-center">
              <ChainSelect
                chains={chains}
                availableChains={availableChains}
                label={i18n._(t`From`)}
                chain={chainFrom}
                otherChain={chainTo}
                onChainSelect={(chain) => handleChainFrom(chain)}
              />
              <button className={'sm:m-6'}>
                <ArrowRight size="32" onClick={() => {
                  if (chainTo.id === ChainId.SMARTBCH) {
                    setChainTo(chains[0])
                    setChainFrom(chains[ChainId.SMARTBCH])
                  } else {
                    setChainTo(chains[ChainId.SMARTBCH])
                    setChainFrom(chains[0])
                  }
                }} />
              </button>
              <ChainSelect
                chains={chains}
                availableChains={chainFrom.id == ChainId.SMARTBCH ? availableChains : [ChainId.SMARTBCH]}
                label={i18n._(t`To`)}
                chain={chainTo}
                otherChain={chainFrom}
                onChainSelect={(chain) => handleChainTo(chain)}
              />
            </div>

            <div className={classNames('mt-0 pt-0 pb-0 rounded bg-dark-800')} style={{margin: 0}}>
              <DualChainCurrencyInputPanel
                label={i18n._(t`You send:`)}
                value={sendAmount}
                currency={chainFrom.id == ChainId.SMARTBCH ? BCH : currency0}
                onUserInput={handleSendAmount}
                onMax={(amount) => handleSendAmount(amount)}
                onCurrencySelect={(currency) => {
                  handleCurrencySelect(currency)
                }}
                chainFrom={chainFrom}
                chainTo={chainTo}
                tokenList={chainFrom.id == ChainId.SMARTBCH ? [BCH] : tokenList}
                chainList={anyswapInfo}
              />

              <DualChainCurrencyInputPanel
                label={i18n._(t`You receive:`)}
                value={receiveAmount}
                currency={chainTo.id == ChainId.SMARTBCH ? BCH : currency0}
                onUserInput={handleReceiveAmount}
                onMax={(amount) => handleReceiveAmount(amount)}
                onCurrencySelect={(currency) => {
                  handleCurrencySelect(currency)
                }}
                chainFrom={chainFrom}
                chainTo={chainTo}
                tokenList={chainTo.id == ChainId.SMARTBCH ? [BCH] : tokenList}
                chainList={anyswapInfo}
              >
                <div className={classNames('')}>
                  <div className="flex flex-col justify-end sm:flex-row">
                    <span className="float-right pt-1 text-sm">
                      {i18n._(t`*the amount received is estimated and may vary`)}
                    </span>
                  </div>
                </div>
              </DualChainCurrencyInputPanel>

              {hopDirection === HopDirection.out && (
                <div className={classNames('mt-0 p-5 pt-0 rounded rounded-t-none bg-dark-800')} style={{margin: 0}}>
                  <div className={"flex flex-col items-center md:text-xl text-base justify-between space-y-3 sm:space-y-0 sm:flex-row"}>
                    <div className={classNames('w-full sm:w-72')}>
                      {i18n._(t`Destination address`)}
                    </div>
                    <div className={classNames('flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3')}>
                      <CashAddressInput className='h-10 font-bold'
                        value={destinationAddress}
                        onUserInput={(value) => setDestinationAddress(value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                  {buttonText}
                </Button>
              )}
            </BottomGrouping>

            {currency0 && (
              <div className={'p-2 sm:p-5 rounded bg-dark-800'}>
                {tokenToBridge?.other?.MinimumSwapFee > 0 && (
                  <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                    <div className="text-sm font-medium text-secondary">
                      {i18n._(t`Minimum Bridge Fee: ${formatNumber(tokenToBridge?.other?.MinimumSwapFee)} ${tokenToBridge?.other?.Symbol}`)}
                    </div>
                  </div>
                )}
                {tokenToBridge?.other?.MaximumSwapFee > 0 && (
                  <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                    <div className="text-sm font-medium text-secondary">
                      {i18n._(t`Maximum Bridge Fee: ${formatNumber(tokenToBridge?.other?.MaximumSwapFee)} ${tokenToBridge?.other?.Symbol}`)}
                    </div>
                  </div>
                )}
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    {i18n._(t`Minimum Bridge Amount: ${swapInfo?.minimumAmount.toFixed(5)} ${swapInfo?.from}`)}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    {i18n._(t`Maximum Bridge Amount: ${formatNumber(swapInfo?.maximumAmount)} ${swapInfo?.from}`)}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    {i18n._(t`Estimated Fee Included: ${swapInfo?.feeUsd.toFixed(2)} USD + ${swapInfo?.feeBch.toFixed(5)} BCH`)}
                  </div>
                </div>
                <div className="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
                  <div className="text-sm font-medium text-secondary">
                    {i18n._(t`You will receive about: ${formatNumber(swapInfo?.receiveAmount)} ${swapInfo?.to}`)}
                  </div>
                </div>
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
