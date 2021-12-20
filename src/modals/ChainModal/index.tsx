// import { bridgeInjected, injected } from '../../connectors'
import { /*useChainModalToggle*/ useModalOpen, useNetworkModalToggle } from '../../state/application/hooks'

import { ApplicationModal } from '../../state/application/actions'
import {
  ChainId,
} from '@mistswapdex/sdk'
import { ExternalLinkIcon } from '@heroicons/react/solid'
import Image from 'next/image'
import Modal from '../../components/Modal'
import ModalHeader from '../../components/ModalHeader'
import React from 'react'
import cookie from 'cookie-cutter'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useWeb3React } from '@web3-react/core'
import { NETWORK_ICON, NETWORK_LABEL } from '../../config/networks'

export type Chain = {
  id: ChainId
  name?: string
  icon?: string
}

export const SUPPORTED_NETWORKS: {
  [chainId in ChainId]?: {
    chainId: string
    chainName: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
} = {
  [ChainId.SMARTBCH]: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://etherscan.com'],
  },
  [ChainId.SMARTBCH]: {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  [ChainId.SMARTBCH]: {
    chainId: '0x505',
    chainName: 'Moonriver',
    nativeCurrency: {
      name: 'Moonriver',
      symbol: 'MOVR',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.moonriver.moonbeam.network', 'https://moonriver.api.onfinality.io/public'],
    blockExplorerUrls: ['https://blockscout.moonriver.moonbeam.network/'],
  },
}

interface ChainModalProps {
  chains: { [chainId: number]: Chain },
  availableChains: number[]
  title?: string
  chain?: Chain
  isOpen: boolean
  onDismiss: () => void
  onSelect: (chain: Chain) => void
  switchOnSelect: boolean
}

export default function ChainModal({
  chains,
  availableChains,
  title,
  chain,
  isOpen,
  onDismiss,
  onSelect,
  switchOnSelect,
}: ChainModalProps): JSX.Element | null {
  const { chainId, library, account, activate } = useWeb3React()

  // const goToRelay = () => {
  //   window.open('https://app.relaychain.com/transfer', '_blank').focus()
  // }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={400}>
      <ModalHeader onClose={onDismiss} title={title} />
      <div className="grid grid-flow-row-dense grid-cols-1 gap-3 mt-4 overflow-y-auto">
        {availableChains.map((key: ChainId, i: number) => {
          if (chain.id === key) {
            return (
              <button key={i} className="w-full col-span-1 p-px rounded bg-gradient-to-r from-yellow to-yellow">
                <div className="flex items-center w-full h-full p-3 space-x-3 rounded bg-dark-1000">
                  <Image
                    src={chains[key].icon}
                    alt={`Select ${chains[key].name} Network`}
                    className="rounded-md"
                    width="32px"
                    height="32px"
                  />
                  <div className="font-bold text-primary">{chains[key].name}</div>
                </div>
              </button>
            )
          }
          return (
            <button
              key={i}
              onClick={() => {
                onSelect({ id: key, icon: chains[key].icon, name: chains[key].name })
                onDismiss()
                if (switchOnSelect) {
                  // activate(bridgeInjected)
                  const params = SUPPORTED_NETWORKS[key]
                  cookie.set('chainId', key)
                  if (key === ChainId.SMARTBCH) {
                    library?.send('wallet_switchEthereumChain', [{ chainId: '0x2710' }, account])
                  } else {
                    library?.send('wallet_addEthereumChain', [params, account])
                  }
                }
              }}
              className="flex items-center w-full col-span-1 p-3 space-x-3 rounded cursor-pointer bg-dark-800 hover:bg-dark-900"
            >
              <Image src={chains[key].icon} alt="Switch Network" className="rounded-md" width="32px" height="32px" />
              <div className="font-bold text-primary">{chains[key].name}</div>
            </button>
          )
        })}

        {/* Redirect to relay bridge while implementing UI integration */}
        {/* <button className="w-full col-span-1 p-px rounded bg-dark-800 hover:bg-dark-900" onClick={() => goToRelay()}>
          <div className="flex items-center w-full h-full p-3 space-x-3 rounded">
            <Image
              src={NETWORK_ICON[ChainId.SMARTBCH]}
              alt={`Select ${NETWORK_LABEL[ChainId.SMARTBCH]} Network`}
              className="rounded-md"
              width="32px"
              height="32px"
            />
            <div className="font-bold text-primary">{NETWORK_LABEL[ChainId.SMARTBCH]}</div>
            <ExternalLinkIcon style={{ width: '26px', height: '26px', marginLeft: 'auto' }} />
          </div>
        </button>

        <button className="w-full col-span-1 p-px rounded bg-dark-800 hover:bg-dark-900" onClick={() => goToRelay()}>
          <div className="flex items-center w-full h-full p-3 space-x-3 rounded">
            <Image
              src={NETWORK_ICON[ChainId.SMARTBCH]}
              alt={`Select ${NETWORK_LABEL[ChainId.SMARTBCH]} Network`}
              className="rounded-md"
              width="32px"
              height="32px"
            />
            <div className="font-bold text-primary">{NETWORK_LABEL[ChainId.SMARTBCH]}</div>
            <ExternalLinkIcon style={{ width: '26px', height: '26px', marginLeft: 'auto' }} />
          </div>
        </button> */}
      </div>
    </Modal>
  )
}
