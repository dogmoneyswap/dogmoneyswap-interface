import { useENSRegistrarContract, useENSResolverContract } from './useContract'

import { isZero } from '../functions'
import { namehash } from '@ethersproject/hash'
import { useMemo } from 'react'
import { useSingleCallResult } from '../state/multicall/hooks'

/**
 * Does a lookup for a text record on an ENS name
 */
export default function useENSText(ensName?: string | null, record?: string | null): {
  loading: boolean
  ENSContent: string | null
} {
  const ensNodeArgument1 = useMemo(() => {
    if (!ensName) return [undefined]
    try {
      return ensName ? [namehash(ensName)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [ensName])
  const ensNodeArgument2 = useMemo(() => {
    if (!ensName) return [undefined, undefined]
    if (!record) return [undefined, undefined]
    try {
      return (ensName && record) ? [namehash(ensName), record] : [undefined, undefined]
    } catch (error) {
      return [undefined, undefined]
    }
  }, [ensName])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddressResult = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument1)
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress,
    false
  )
  const ENSContent = useSingleCallResult(resolverContract, 'text', ensNodeArgument2)

  return {
    ENSContent: ENSContent.result?.[0] ?? null,
    loading: resolverAddressResult.loading || ENSContent.loading,
  }
}
