import {
  BAR_ADDRESS,
  BENTOBOX_ADDRESS,
  BORING_HELPER_ADDRESS,
  ChainId,
  ENS_REGISTRAR_ADDRESS,
  FACTORY_ADDRESS,
  KASHI_ADDRESS,
  MAKER_ADDRESS,
  MASTERCHEF_ADDRESS,
  MASTERCHEF_V2_ADDRESS,
  MULTICALL2_ADDRESS,
  ROUTER_ADDRESS,
  STOP_LIMIT_ORDER_ADDRESS,
  MIST_ADDRESS,
  MISTROLL_ADDRESS,
  WNATIVE_ADDRESS,
} from '@dogmoneyswap/sdk'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
} from '../constants/abis/argent-wallet-detector'

import BAR_ABI from '../constants/abis/bar.json'
import BENTOBOX_ABI from '../constants/abis/bentobox.json'
import BORING_HELPER_ABI from '../constants/abis/boring-helper.json'
import CLONE_REWARDER_ABI from '../constants/abis/clone-rewarder.json'
import COMPLEX_REWARDER_ABI from '../constants/abis/complex-rewarder.json'
import { Contract } from '@ethersproject/contracts'
import EIP_2612_ABI from '../constants/abis/eip-2612.json'
import ENS_ABI from '../constants/abis/ens-registrar.json'
import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ERC20_ABI from '../constants/abis/erc20.json'
import { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import FACTORY_ABI from '../constants/abis/factory.json'
import IUniswapV2PairABI from '../constants/abis/uniswap-v2-pair.json'
import LIMIT_ORDER_ABI from '../constants/abis/limit-order.json'
import LIMIT_ORDER_HELPER_ABI from '../constants/abis/limit-order-helper.json'
import MAKER_ABI from '../constants/abis/maker.json'
import MASTERCHEF_ABI from '../constants/abis/masterchef.json'
import MASTERCHEF_V2_ABI from '../constants/abis/masterchef-v2.json'
import MULTICALL2_ABI from '../constants/abis/multicall2.json'
import ROUTER_ABI from '../constants/abis/router.json'
import SUSHI_ABI from '../constants/abis/sushi.json'
import SUSHIROLL_ABI from "@mistswapdex/core/abi/SushiRoll.json";
import WBCH_ABI from '../constants/abis/weth.json'
import ZENKO_ABI from '../constants/abis/zenko.json'
import { getContract } from '../functions/contract'
import { useActiveWeb3React } from './useActiveWeb3React'
import { useMemo } from 'react'

export function useEIP2612Contract(tokenAddress?: string): Contract | null {
  return useContract(tokenAddress, EIP_2612_ABI, false)
}

// returns null on errors
export function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWBCHContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && WNATIVE_ADDRESS[chainId], WBCH_ABI, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    undefined,
    ARGENT_WALLET_DETECTOR_ABI,
    false
  )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && ENS_REGISTRAR_ADDRESS[chainId], ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useMerkleDistributorContract(): Contract | null {
  throw new Error('useMerkleDistributorContract disabled');
}

export function useBoringHelperContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && BORING_HELPER_ADDRESS[chainId], BORING_HELPER_ABI, false)
}

export function useMulticall2Contract() {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MULTICALL2_ADDRESS[chainId], MULTICALL2_ABI, false)
}

export function useSushiContract(withSignerIfPossible = true): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MIST_ADDRESS[chainId], SUSHI_ABI, withSignerIfPossible)
}

export function useMasterChefContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MASTERCHEF_ADDRESS[chainId], MASTERCHEF_ABI, withSignerIfPossible)
}

export function useMasterChefV2Contract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MASTERCHEF_V2_ADDRESS[chainId], MASTERCHEF_V2_ABI, withSignerIfPossible)
}

export function useFactoryContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && FACTORY_ADDRESS[chainId], FACTORY_ABI, false)
}

export function useRouterContract(useArcher = false, withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && ROUTER_ADDRESS[chainId], ROUTER_ABI, withSignerIfPossible)
}

export function useSushiBarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && BAR_ADDRESS[chainId], BAR_ABI, withSignerIfPossible)
}

export function useMakerContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MAKER_ADDRESS[chainId], MAKER_ABI, false)
}

export function useTimelockContract(): Contract | null {
  throw new Error('useTimelockContract disabled');
}

export function useBentoBoxContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && BENTOBOX_ADDRESS[chainId], BENTOBOX_ABI, withSignerIfPossible)
}

export function useChainlinkOracle(): Contract | null {
  throw new Error('useChainlinkOracle disabled');
}

export function useSushiRollContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MISTROLL_ADDRESS[chainId], SUSHIROLL_ABI, false);
}

export function useComplexRewarderContract(address, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, COMPLEX_REWARDER_ABI, withSignerIfPossible)
}

export function useCloneRewarderContract(address, withSignerIfPossibe?: boolean): Contract | null {
  return useContract(address, CLONE_REWARDER_ABI, withSignerIfPossibe)
}

export function useLimitOrderContract(withSignerIfPossibe?: boolean): Contract | null {
  throw new Error('useLimitOrderContract disabled');
}

export function useLimitOrderHelperContract(withSignerIfPossible?: boolean): Contract | null {
  throw new Error('useLimitOrderHelperContract disabled');
}
