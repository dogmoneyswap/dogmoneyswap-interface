import { ChainId, MIST_ADDRESS, BAR_ADDRESS, Token, WBCH} from '@mistswapdex/sdk'

export const FLEXUSD = new Token(ChainId.SMARTBCH, '0x7b2B3C5308ab5b2a1d9a94d20D35CCDf61e05b72', 18, 'flexUSD', 'flexUSD')
export const LAWUSD = new Token(ChainId.SMARTBCH, '0xE1E655BE6F50344e6dd708c27BD8D66492d6ecAf', 18, 'lawUSD', 'LAW US Dollar')
export const SBUSD = new Token(ChainId.SMARTBCH, '0x9288df32951386A8254aEaF80a66B78cCaf75b82', 2, 'sBUSD', 'Smart BUSD')
export const LAW = new Token(ChainId.SMARTBCH, '0x0b00366fBF7037E9d75E4A569ab27dAB84759302', 18, 'LAW', 'LAW')

export const XMIST: ChainTokenMap = {
    [ChainId.SMARTBCH]: new Token(ChainId.SMARTBCH, BAR_ADDRESS[ChainId.SMARTBCH], 18, 'xMIST', 'MistBar'),
    [ChainId.SMARTBCH_AMBER]: new Token(ChainId.SMARTBCH_AMBER, BAR_ADDRESS[ChainId.SMARTBCH_AMBER], 18, 'xMIST', 'MistBar'),
}

type ChainTokenMap = {
  readonly [chainId in ChainId]?: Token
}

export const MIST: ChainTokenMap = {
  [ChainId.SMARTBCH]: new Token(ChainId.SMARTBCH, MIST_ADDRESS[ChainId.SMARTBCH], 18, 'MIST', 'MistToken'),
  [ChainId.SMARTBCH_AMBER]: new Token(ChainId.SMARTBCH_AMBER, MIST_ADDRESS[ChainId.SMARTBCH_AMBER], 18, 'MIST', 'MistToken'),
}

export const WBCH_EXTENDED: { [chainId: number]: Token } = {
  ...WBCH,
}

type ChainTokenMapList = {
  readonly [chainId in ChainId]?: Token[]
}

// These are available for migrate
export const BENSWAP_TOKENS: ChainTokenMapList = {
  [ChainId.SMARTBCH]: [
  ],
  [ChainId.SMARTBCH_AMBER]: [
    new Token(ChainId.SMARTBCH_AMBER, '0x842692f8A4D0743e942dF5D52155a037327d4f3f', 18, 'EBENS/BCH LP Token', 'EBEN-BCH'),
  ],
}
