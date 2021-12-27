import React, { FC, useCallback, useEffect, useState } from 'react'

import Container from '../../../components/Container'
import Head from 'next/head'
import Typography from '../../../components/Typography'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import DoubleGlowShadow from '../../../components/DoubleGlowShadow'
import NavLink from '../../../components/NavLink'
import { BottomGrouping } from '../../../features/exchange-v1/swap/styleds'
import Web3Connect from '../../../components/Web3Connect'
import { useWeb3React } from '@web3-react/core'
import { useAllTransactions } from '../../../state/bridgeTransactions/hooks'
import moment from 'moment'
import { TransactionDetails } from '../../../state/bridgeTransactions/reducer'
import { AvailableChainsInfo } from '../interface'
import { HopStage } from '../../../services/hop.cash'
import { useAppDispatch } from '../../../state/hooks'
import { deleteTransaction } from '../../../state/bridgeTransactions/actions'
import BridgeModal from '../../../modals/BridgeModal'
import { TrashIcon } from '@heroicons/react/outline'
import { BridgeChains } from '..'

export type AnyswapTokensMap = { [chainId: number]: { [contract: string]: AvailableChainsInfo } }

const Transaction: FC<{ chainId: string; hash: string, onClick: (hash) => any }> = ({ chainId, hash, onClick }) => {
  const { i18n } = useLingui()
  const allTransactions = useAllTransactions()

  const tx: TransactionDetails = allTransactions?.[hash]

  const destChainId = tx?.destChainId
  const srcChainId = tx?.srcChainId
  const status = tx?.hopStatus?.stage

  const tzTime = tx?.addedTime / 1000

  const addedTime = moment.unix(tzTime).fromNow()
  const amount = tx?.initialAmount
  const symbol = tx?.symbol

  const dispatch = useAppDispatch()
  const deleteTransactionCallback = useCallback((hash: string) => {
    dispatch(deleteTransaction({hash}))
  }, [dispatch])

  return (
    <div onClick={() => onClick(hash)} className={'w-full px-2 py-2 text-left rounded bg-dark-700  text-primary text-sm md:text-lg'}>
      <div className="flex flex-col px-2 md:px-0 md:flex-row">
        <div className="flex flex-row justify-between md:flex-none md:w-40">
          <div className="items-center text-base font-bold text-primary md:hidden">
            <div className="w-40">{i18n._(t`Date`)}</div>
          </div>
          <Typography variant="sm" className="flex items-center py-0.5">
            {addedTime}
          </Typography>
        </div>
        <div className="flex flex-row justify-between md:flex-grow">
          <div className="items-center text-base font-bold text-primary md:hidden">
            <div className="w-40">{i18n._(t`Asset`)}</div>
          </div>
          <Typography variant="sm" className="flex items-center py-0.5">
            {amount} {symbol}
          </Typography>
        </div>
        <div className="flex flex-row justify-between md:flex-none md:w-24">
          <div className="items-center text-base font-bold text-primary md:hidden">
            <div className="w-40">{i18n._(t`From`)}</div>
          </div>
          <Typography variant="sm" className="flex items-center py-0.5">
            {BridgeChains[srcChainId].name}
          </Typography>
        </div>
        <div className="flex flex-row justify-between md:flex-none md:w-24">
          <div className="items-center text-base font-bold text-primary md:hidden">
            <div className="w-40">{i18n._(t`To`)}</div>
          </div>
          <Typography variant="sm" className="flex items-center py-0.5">
            {BridgeChains[destChainId].name}
          </Typography>
        </div>
        <div className="flex flex-row justify-between md:justify-end md:flex-none md:w-24 ">
          <div className="items-center text-base font-bold text-primary md:hidden">
            <div className="w-40">{i18n._(t`Status`)}</div>
          </div>
          <Typography variant="sm" className="flex items-center md:py-0.5 justify-end">
            <div className={'text-primary'}>
              {status === HopStage.settled ? i18n._(t`Settled`)
                : status === HopStage.cancelled ? i18n._(t`Cancelled`)
                : i18n._(t`Pending`)
              }
            </div>
          </Typography>
        </div>
        <div className="flex flex-row justify-between md:justify-end md:flex-none md:w-10">
          <div className="items-center text-base font-bold text-primary md:hidden">
            <div className="w-10"></div>
          </div>
          <Typography variant="sm" className="flex items-center md:py-0.5 justify-end">
            <div className={'cursor-pointer text-primary'} onClick={(e) => {
              e.stopPropagation()
              e.nativeEvent.stopImmediatePropagation()
              deleteTransactionCallback(hash)
            }} >
              <TrashIcon width="20" height="20" />
            </div>
          </Typography>
        </div>
      </div>
    </div>
  )
}

function renderTransactions(
  address: string,
  transactions: { [txHash: string]: TransactionDetails },
  onClick: (hash) => any
) {
  const txs = []
  Object.values(transactions).forEach((tx, i) => {
    if (tx.from == address?.toString()) {
      txs.push({ ...tx, chainId: tx.srcChainId, hash: tx.hash })
    }
  })
  return (
    <div className="flex flex-col gap-2 flex-nowrap">
      {txs
        .sort((tx, tx1) => tx1.addedTime - tx.addedTime)
        .map((tx, i) => {
          return <Transaction key={i} hash={tx.hash} chainId={tx.chainId} onClick={onClick} />
        })}
    </div>
  )
}

export default function Bridge() {
  const { i18n } = useLingui()

  const { account: activeAccount, chainId: activeChainId } = useActiveWeb3React()
  const { account, chainId, library, activate } = useWeb3React()
  const [refresher, setRefresher] = useState(0)

  const allTransactions = useAllTransactions(refresher)

  const [showBridgeModal, setShowBridgeModal] = useState(false)
  const [bridgeTransactionHash, setBridgeTransactionHash] = useState<string | null>(null)

  useEffect(() => {
  }, [activate, chainId, activeAccount, activeChainId])

  const onClick = (hash) => {
    setBridgeTransactionHash(hash)
    setShowBridgeModal(true)
  }

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
            <div className="p-4 text-center">
              <div className="items-center justify-between space-x-3">
                <Typography component="h3" variant="base">
                  {i18n._(t`View the history of all your bridge interactions`)}
                </Typography>
              </div>
            </div>
            <BottomGrouping>
              {!account && activeAccount ? (
                <Web3Connect size="lg" color="gradient" className="w-full" />
              ) : (
                <div className="space-y-2 p-4 rounded bg-dark-800 mb-2 h-[455px] overflow-y-auto">
                  {allTransactions && Object.keys(allTransactions).length > 0 ? (
                    <>
                      <div className="flex items-center px-2 text-base font-bold md:flex text-primary">
                        <div className="flex-none w-40">{i18n._(t`Date`)}</div>
                        <div className="flex-grow">{i18n._(t`Asset`)}</div>
                        <div className="flex-none w-24">{i18n._(t`From`)}</div>
                        <div className="flex-none w-24">{i18n._(t`To`)}</div>
                        <div className="flex-none w-24 text-right">{i18n._(t`Status`)}</div>
                        <div className="flex-none w-10"></div>
                      </div>
                      <div className="flex-col mt-2">
                        {renderTransactions(activeAccount || account, allTransactions, onClick)}
                      </div>
                    </>
                  ) : (
                    <Typography variant="sm" className="text-secondary">
                      {i18n._(t`Your transactions will appear here...`)}
                    </Typography>
                  )}
                </div>
              )}
            </BottomGrouping>
          </div>
        </DoubleGlowShadow>
      </Container>
    </>
  )
}
