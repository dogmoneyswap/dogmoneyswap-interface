import {
  clearAllTransactions,
  updateTransaction,
  deleteTransaction,
} from './actions'

import { createReducer } from '@reduxjs/toolkit'
import { ShiftStatus } from '../../services/sideshift.ai'
import { HopStatus } from '../../services/hop.cash'
import { Currency } from '@mistswapdex/sdk'

const now = () => new Date().getTime()

export interface TransactionDetails {
  hash: string
  destChainId?: number
  srcChainId?: number
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string

  hopStatus?: HopStatus
  shiftStatus?: ShiftStatus
  symbol?: string
  methodId?: string
  initialAmount: string
  finalAmount?: string
  destinationAddress: string
  beforeError?: TransactionDetails
  errorTrace?: string
}

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

export const initialState: TransactionState = {}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(
      updateTransaction,
      (transactions, { payload }) => {
        const {hash} = payload
        const txs = transactions ?? {}
        txs[hash] = payload
      }
    )
    .addCase(clearAllTransactions, (transactions, { payload: { } }) => {
      transactions = {}
    })
    .addCase(deleteTransaction, (transactions, { payload: { hash } }) => {
      if (!transactions[hash]) return
      delete transactions[hash]
    })
)
