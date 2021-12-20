import { AppDispatch, AppState } from '../index'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { TransactionDetails } from './reducer'
import { TransactionResponse } from '@ethersproject/providers'
import { addTransaction, deleteTransaction, updateTransaction } from './actions'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useWeb3React } from '@web3-react/core'

export function useTransactionUpdater(): (
  payload: TransactionDetails
) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (
      payload: TransactionDetails
    ) => {
      dispatch(
        updateTransaction(payload)
      )
    },
    [dispatch]
  )
}

export function useTransactionRemover(): (hash: string) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (
      hash: string
    ) => {
      dispatch(
        deleteTransaction({hash})
      )
    },
    [dispatch]
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(refresher = 0): { [txHash: string]: TransactionDetails } {
  const state = useAppSelector((state) => state.bridgeTransactions) || {}
  return useMemo(() => {
    return state
  }, [state, refresher])
}

export function useTransactionGetter(hash: string): TransactionDetails | null {
  const state = useAppSelector((state) => state.bridgeTransactions) || {}
  return useMemo(() => {
    return state[hash]
  }, [state])
}
