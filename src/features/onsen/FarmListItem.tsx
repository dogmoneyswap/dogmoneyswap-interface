import { classNames, formatNumber, formatPercent } from '../../functions'

import { ChainId } from '@dogmoneyswap/sdk'
import { MIST } from '../../config/tokens'
import { ZERO } from '@dogmoneyswap/sdk'
import { Disclosure } from '@headlessui/react'
import DoubleLogo from '../../components/DoubleLogo'
import FarmListItemDetails from './FarmListItemDetails'
import Image from '../../components/Image'
import { PairType } from './enum'
import React from 'react'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
import { useCurrency } from '../../hooks/Tokens'
import { usePendingSushi, useUserInfo } from './hooks'
import { isMobile } from 'react-device-detect'

const FarmListItem = ({ farm, ...rest }) => {
  const token0 = useCurrency(farm.pair.token0.id)
  const token1 = useCurrency(farm.pair.token1.id)

  const pendingSushi = usePendingSushi(farm)

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
            <div className="grid grid-cols-5">
              <div className="flex col-span-2 space-x-4 md:col-span-1">
                <DoubleLogo currency0={token0} currency1={token1} size={isMobile ? 30 : 40} />
                <div className="flex flex-col justify-center">
                  <div>
                    <p className="font-bold">{farm?.pair?.token0?.symbol}</p>
                    <p className={farm?.pair?.type === PairType.KASHI ? 'font-thin' : 'font-bold'}>
                      {farm?.pair?.token1?.symbol}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center font-bold">{formatNumber(farm.tvl, true)}</div>
              <div className="flex-row items-center hidden space-x-4 md:flex">
                <div className="flex items-center space-x-2">
                  {farm?.rewards?.map((reward, i) => (
                    <div key={i} className="flex items-center">
                      <Image
                        src={reward.icon}
                        width="30px"
                        height="30px"
                        className="rounded-md"
                        layout="fixed"
                        alt={reward.token}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col space-y-1">
                  {farm?.rewards?.map((reward, i) => (
                    <div key={i} className="text-xs md:text-sm whitespace-nowrap">
                      {formatNumber(reward.rewardPerDay)} {reward.token} / {i18n._(t`DAY`)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="font-bold text-righttext-high-emphesis">
                  {formatPercent(farm?.roiPerYear * 100)}
                </div>
                <div className="text-xs text-right md:text-base text-secondary">{i18n._(t`annualized`)}</div>
              </div>
              {pendingSushi && pendingSushi.greaterThan(ZERO) ? (
                <div className="flex flex-col items-center justify-center md:flex-row space-x-4 font-bold md:flex">
                  <div className="hidden md:flex items-center space-x-2">
                    <div key="0" className="flex items-center">
                      <Image
                        src="https://assets.dogmoney.money/blockchains/dogechain/assets/{MIST[ChainId.DOGECHAIN].address}/logo.png"
                        width="30px"
                        height="30px"
                        className="rounded-md"
                        layout="fixed"
                        alt="DOGMONEY"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div key="0" className="text-xs md:text-sm">
                      {formatNumber(pendingSushi.toFixed(18))} DOGMONEY
                    </div>
                  </div>
              </div>
              ) : (
                <div className="flex-row items-center justify-center flex pl-3 font-bold text-sm">
                  {i18n._(t`Stake LP to Farm`)}
                </div>
              )}
            </div>
          </Disclosure.Button>

          {open && <FarmListItemDetails farm={farm} />}
        </>
      )}
    </Disclosure>
  )
}

export default FarmListItem
