import {
    MIST, XMIST, DAI, USDT, USDC
} from '../config/tokens'
// a list of tokens by chain
import { ChainId, Currency, Token, WNATIVE } from '@dogmoneyswap/sdk'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

// List of all mirror's assets addresses.
// Last pulled from : https://whitelist.mirror.finance/eth/tokenlists.json
// TODO: Generate this programmatically ?
const MIRROR_ADDITIONAL_BASES: { [tokenAddress: string]: Token[] } = {
}

// TODO: SDK should have two maps, WETH map and WNATIVE map.
const WRAPPED_NATIVE_ONLY: ChainTokenList = {
  [ChainId.DOGECHAIN]: [WNATIVE[ChainId.DOGECHAIN]],
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WRAPPED_NATIVE_ONLY,
  [ChainId.DOGECHAIN]: [
    ...WRAPPED_NATIVE_ONLY[ChainId.DOGECHAIN],
    MIST[ChainId.DOGECHAIN],
    DAI, USDT, USDC,
  ],
}

export const ADDITIONAL_BASES: {
  [chainId: number]: { [tokenAddress: string]: Token[] }
} = {
  [ChainId.DOGECHAIN]: {
    ...MIRROR_ADDITIONAL_BASES,
  },
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: {
  [chainId: number]: { [tokenAddress: string]: Token[] }
} = {}

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainTokenList = {
  [ChainId.DOGECHAIN]: [
    ...WRAPPED_NATIVE_ONLY[ChainId.DOGECHAIN],
    MIST[ChainId.DOGECHAIN],
    DAI, USDT, USDC,
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_ONLY,
  [ChainId.DOGECHAIN]: [
    ...WRAPPED_NATIVE_ONLY[ChainId.DOGECHAIN],
    MIST[ChainId.DOGECHAIN],
    DAI, USDT, USDC,
  ],
}

export const PINNED_PAIRS: {
  readonly [chainId in ChainId]?: [Token, Token][]
} = {
  [ChainId.DOGECHAIN]: [
      [MIST[ChainId.DOGECHAIN], WNATIVE[ChainId.DOGECHAIN]],
  ],
}
