import { AppDispatch, AppState } from '../index'
import { RetryOptions, RetryableError, retry } from '../../functions/retry'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useCallback, useEffect, useMemo } from 'react'

import { updateBlockNumber } from '../application/actions'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'

const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 3, minWait: 1000, maxWait: 3000 }

export default function Updater(): null {
  return null
}
