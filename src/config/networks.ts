import { ChainId } from '@dogmoneyswap/sdk'

const SmartBCH = 'https://raw.githubusercontent.com/mistswapdex/icons/master/network/smartbch.jpg'
const SmartBCHAmber = 'https://raw.githubusercontent.com/mistswapdex/icons/master/network/smartbch_amber.jpg'
const DogeChain = 'https://raw.githubusercontent.com/dogmoneyswap/icons/master/network/dogechain.jpg'

export const NETWORK_ICON = {
  [ChainId.SMARTBCH]: SmartBCH,
  [ChainId.SMARTBCH_AMBER]: SmartBCHAmber,
  [ChainId.DOGECHAIN]: DogeChain,
}

export const NETWORK_LABEL: { [chainId in ChainId]?: string } = {
  [ChainId.SMARTBCH]: 'smartBCH',
  [ChainId.SMARTBCH_AMBER]: 'Amber Testnet',
  [ChainId.DOGECHAIN]: 'DogeChain',
}
