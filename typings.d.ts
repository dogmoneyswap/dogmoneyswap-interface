import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import Fraction from './src/entities/Fraction'
import { HopStatus } from './src/services/hop.cash'
import { ShiftStatus } from './src/services/sideshift.ai'

declare module 'fortmatic'

declare global {
  function hex2wif(hex): string
  const Wallet: any
  function OpReturnDataFromString(string): any

  interface String {
    toBigNumber(decimals: number): BigNumber
  }
  interface Window {
    ethereum?: {
      isMetaMask?: true
      on?: (...args: any[]) => void
      removeListener?: (...args: any[]) => void
      autoRefreshOnNetworkChange?: boolean
    }
    web3?: Record<string, unknown>
    hopStatus: HopStatus
    hopwallet: any
    shiftStatus: ShiftStatus
    FromBlock: number
  }
}

declare module 'content-hash' {
  declare function decode(x: string): string
  declare function getCodec(x: string): string
}

declare module 'multihashes' {
  declare function decode(buff: Uint8Array): {
    code: number
    name: string
    length: number
    digest: Uint8Array
  }
  declare function toB58String(hash: Uint8Array): string
}

declare module 'jazzicon' {
  export default function (diameter: number, seed: number): HTMLElement
}

declare module 'formatic'

declare module '@ethersproject/bignumber' {
  interface BigNumber {
    mulDiv(multiplier: BigNumberish, divisor: BigNumberish): BigNumber
    toFixed(decimals: BigNumberish): string
    toFraction(decimals: BigNumberish, base: BigNumberish): Fraction
  }
}
