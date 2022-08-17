import { AddressZero } from '@ethersproject/constants'
import { ChainId } from '@dogmoneyswap/sdk'
import { DAI } from '../../config/tokens';

type Currency = { address: string; decimals: number }

// Pricing currency
export const USD_CURRENCY: { [chainId in ChainId]?: Currency } = {
  [ChainId.DOGECHAIN]: {
    address: DAI.address,
    decimals: 6,
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
