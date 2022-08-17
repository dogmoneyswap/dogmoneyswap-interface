import { classNames, formatNumber, formatPercent } from '../../functions'

import { ZERO } from '@dogmoneyswap/sdk'
import { Disclosure } from '@headlessui/react'
import ProposalListItemDetails from './ProposalListItemDetails'
import Image from '../../components/Image'
import React from 'react'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import { useCurrency } from '../../hooks/Tokens'
import { isMobile } from 'react-device-detect'

const ProposalListItem = ({ proposal, ...rest }) => {
  // const token0 = useCurrency(farm.pair.token0.id)
  // const token1 = useCurrency(farm.pair.token1.id)

  // const pendingSushi = usePendingSushi(farm)

  const { i18n } = useLingui()

  return (
    <Disclosure {...rest}>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={classNames(
              open && 'rounded-b-none',
              'w-full px-4 py-6 text-left rounded cursor-pointer select-none bg-dark-900 text-primary text-sm md:text-lg'
            )}
          >
            <div className="grid grid-cols-3">
              <div className="flex col-span-1 space-x-4">
                <div className="flex flex-col justify-center">
                  <div>
                    <p className="font-bold">{proposal?.title}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center font-bold">
                <div>{proposal?.status}</div>
                <div>{proposal?.statusText}</div>
              </div>
              <div className="flex flex-col items-center justify-center font-mono">
                <div className="font-bold text-righttext-high-emphesis">
                  <div>{proposal?.snapshotBlock}</div>
                  <div>{proposal?.endBlock}</div>
                </div>
              </div>
            </div>
          </Disclosure.Button>

          {open && <ProposalListItemDetails proposal={proposal} />}
        </>
      )}
    </Disclosure>
  )
}

export default ProposalListItem
