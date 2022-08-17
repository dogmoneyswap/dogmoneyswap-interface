import { AddressZero } from '@ethersproject/constants'
import { ChainId, FLEXUSD_ADDRESS } from '@dogmoneyswap/sdk'

type Currency = { address: string; decimals: number }

// Pricing currency
// TODO: Check decimals and finish table
export const USD_CURRENCY: { [chainId in ChainId]?: Currency } = {
  [ChainId.SMARTBCH]: {
    address: FLEXUSD_ADDRESS[ChainId.SMARTBCH],
    decimals: 18,
  },
  [ChainId.SMARTBCH_AMBER]: {
    address: FLEXUSD_ADDRESS[ChainId.SMARTBCH_AMBER],
    decimals: 18,
  },
}

export function getCurrency(chainId: ChainId): Currency {
  return (
    USD_CURRENCY[chainId] || {
      address: AddressZero,
      decimals: 18,
    }
  )
}
