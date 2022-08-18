import { ChainId, MIST_ADDRESS, BAR_ADDRESS, Token, WBCH} from '@dogmoneyswap/sdk'

export const DAI = new Token(ChainId.DOGECHAIN, '0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C', 18, 'DAI', 'Dai Stablecoin')
export const USDT = new Token(ChainId.DOGECHAIN, '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D', 6, 'USDT', 'Tether USD')
export const USDC = new Token(ChainId.DOGECHAIN, '0x765277EebeCA2e31912C9946eAe1021199B39C61', 6, 'USDC', 'USD Coin')

export const XMIST: ChainTokenMap = {
    [ChainId.DOGECHAIN]: new Token(ChainId.DOGECHAIN, BAR_ADDRESS[ChainId.DOGECHAIN], 18, 'xDOGMONEY', 'Staked Dog Money'),
}

type ChainTokenMap = {
  readonly [chainId in ChainId]?: Token
}

export const MIST: ChainTokenMap = {
  [ChainId.DOGECHAIN]: new Token(ChainId.DOGECHAIN, MIST_ADDRESS[ChainId.DOGECHAIN], 18, 'DOGMONEY', 'Dog Money'),
}

export const WBCH_EXTENDED: { [chainId: number]: Token } = {
  ...WBCH,
}

type ChainTokenMapList = {
  readonly [chainId in ChainId]?: Token[]
}

// These are available for migrate
export const BENSWAP_TOKENS: ChainTokenMapList = {
}
