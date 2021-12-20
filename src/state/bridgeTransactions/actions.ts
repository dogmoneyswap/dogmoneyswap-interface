import { createAction } from '@reduxjs/toolkit'
import { TransactionDetails } from './reducer'

export const addTransaction = createAction<TransactionDetails>('bridgeTransactions/addTransaction')

export const clearAllTransactions = createAction<{}>('bridgeTransactions/clearAllTransactions')

export const updateTransaction = createAction<TransactionDetails>('bridgeTransactions/updateTransaction')

export const deleteTransaction = createAction<{hash: string}>('bridgeTransactions/deleteTransaction')
