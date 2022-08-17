import { MIST_ADDRESS } from '@dogmoneyswap/sdk'
import React, { useMemo } from 'react'
import ScrollableGraph from '../../components/ScrollableGraph'
import AnalyticsContainer from '../../features/analytics/AnalyticsContainer'
import Background from '../../features/analytics/Background'
import InfoCard from '../../features/analytics/Bar/InfoCard'
import { classNames, formatNumber, formatPercent } from '../../functions'
import { aprToApy } from '../../functions/convert/apyApr'
import {
  useBlock,
  useDayData,
  useEthPrice,
  useFactory,
  useNativePrice,
  useTokenDayData,
  useTokens,
} from '../../services/graph'
import { useBar, useBarHistory } from '../../services/graph/hooks/bar'
import ColoredNumber from '../../features/analytics/ColoredNumber'
import { XMIST } from '../../config/tokens'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'

export default function XMIST_PAGE() {
  const { chainId } = useActiveWeb3React()
  const block1d = useBlock({ daysAgo: 1, chainId })

  const exchange = useFactory({ chainId: chainId})
  const exchange1d = useFactory({ block: block1d, chainId })

  const dayData = useDayData()

  const ethPrice = useNativePrice({ chainId })
  const ethPrice1d = useNativePrice({ block: block1d, chainId, shouldFetch: !!block1d })

  const xSushi = useTokens({ chainId, subset: [XMIST[chainId].address] })?.[0]
  const xSushi1d = useTokens({ block: block1d, chainId, subset: [XMIST[chainId].address] })?.[0]
  const sushiDayData = useTokenDayData({ token: MIST_ADDRESS[chainId], chainId })

  const bar = useBar()
  const bar1d = useBar({ block: block1d, shouldFetch: !!block1d })
  const barHistory = useBarHistory()

  const [xSushiPrice, xSushiMarketcap] = [
    xSushi?.derivedETH * ethPrice,
    xSushi?.derivedETH * ethPrice * bar?.totalSupply,
  ]

  const [xSushiPrice1d, xSushiMarketcap1d] = [
    xSushi1d?.derivedETH * ethPrice1d,
    xSushi1d?.derivedETH * ethPrice1d * bar1d?.totalSupply,
  ]

  const data = useMemo(
    () =>
      barHistory && dayData && sushiDayData && bar
        ? barHistory.map((barDay) => {
            const exchangeDay = dayData.find((day) => day.date === barDay.date)
            const sushiDay = sushiDayData.find((day) => day.date === barDay.date)

            const totalSushiStakedUSD = barDay.xSushiSupply * barDay.ratio * sushiDay.priceUSD

            const APR =
              totalSushiStakedUSD !== 0 ? ((exchangeDay.volumeUSD * 0.0005 * 365) / totalSushiStakedUSD) * 100 : 0

            return {
              APR: APR,
              APY: aprToApy(APR, 365),
              xSushiSupply: barDay.xSushiSupply,
              date: barDay.date,
              feesReceived: exchangeDay.volumeUSD * 0.0005,
              sushiStakedUSD: barDay.sushiStakedUSD,
              sushiHarvestedUSD: barDay.sushiHarvestedUSD,
            }
          })
        : [],
    [barHistory, dayData, sushiDayData, bar]
  )

  const APY1d = aprToApy(
    (((exchange?.volumeUSD - exchange1d?.volumeUSD) * 0.0005 * 365.25) / (bar?.totalSupply * xSushiPrice)) * 100 ?? 0
  )
  const APY1w = aprToApy(data.slice(-7).reduce((acc, day) => (acc += day.APY), 0) / 7)

  const graphs = useMemo(
    () => [
      {
        labels: ['APY', 'APR'],
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.APY,
          })),
          data.map((d) => ({
            date: d.date * 1000,
            value: d.APR,
          })),
        ],
      },
      {
        title: 'Fees received (USD)',
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.feesReceived,
          })),
        ],
      },
      {
        labels: ['Mist Staked (USD)', 'Mist Harvested (USD)'],
        note: '/ day',
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.sushiStakedUSD,
          })),
          data.map((d) => ({
            date: d.date * 1000,
            value: d.sushiHarvestedUSD,
          })),
        ],
      },
      {
        title: 'xMist Total Supply',
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.xSushiSupply,
          })),
        ],
      },
    ],
    [data]
  )

  return (
    <AnalyticsContainer>
      <Background background="bar">
        <div className="grid items-center justify-between grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
          <div className="space-y-5">
            <div className="text-3xl font-bold text-high-emphesis">xMist</div>
            <div>Find out all about xMist here.</div>
          </div>
          <div className="flex space-x-12">
            <div className="flex flex-col">
              <div>Price</div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-medium text-high-emphesis">{formatNumber(xSushiPrice ?? 0, true)}</div>
                <ColoredNumber number={(xSushiPrice / xSushiPrice1d) * 100 - 100} percent={true} />
              </div>
            </div>
            <div className="flex flex-col">
              <div>Market Cap</div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-medium text-high-emphesis">
                  {formatNumber(xSushiMarketcap ?? 0, true, false)}
                </div>
                <ColoredNumber number={(xSushiMarketcap / xSushiMarketcap1d) * 100 - 100} percent={true} />
              </div>
            </div>
          </div>
        </div>
      </Background>
      <div className="pt-4 space-y-5 lg:px-14">
        <div className="flex flex-row space-x-4 overflow-auto">
          <InfoCard text="APY (Last 24 Hours)" number={formatPercent(APY1d)} />
          <InfoCard text="APY (Last 7 Days)" number={formatPercent(APY1w)} />
          <InfoCard text="xMIST Supply" number={formatNumber(bar?.totalSupply)} />
          <InfoCard text="xMIST : MIST" number={Number(bar?.ratio ?? 0)?.toFixed(4)} />
        </div>
        <div className="space-y-4">
          {graphs.map((graph, i) => (
            <div
              className={classNames(
                graph.data[0].length === 0 && 'hidden',
                'p-1 rounded bg-dark-900 border border-dark-700'
              )}
              key={i}
            >
              <div className="w-full h-96">
                <ScrollableGraph
                  labels={graph.labels}
                  title={graph.title}
                  note={graph.note}
                  data={graph.data}
                  margin={{ top: 64, right: 32, bottom: 16, left: 64 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsContainer>
  )
}
