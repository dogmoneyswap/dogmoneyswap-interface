import { Chef, PairType } from '../../features/onsen/enum'
import { useActiveWeb3React, useFuse } from '../../hooks'
import {
  useAverageBlockTime,
  useEthPrice,
  useFarmPairAddresses,
  useFarms,
  useMasterChefV1SushiPerBlock,
  useMasterChefV1TotalAllocPoint,
  useSushiPairs,
  useSushiPrice,
} from '../../services/graph'

import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, WNATIVE, Token, WBCH, MASTERCHEF_ADDRESS } from '@dogmoneyswap/sdk'
import { MIST, DAI, USDT, USDC } from '../../config/tokens'
import Container from '../../components/Container'
import FarmList from '../../features/onsen/FarmList'
import Head from 'next/head'
import Image from 'next/image'
import Menu from '../../features/onsen/FarmMenu'
import React, { useEffect } from 'react'
import Search from '../../components/Search'
import { classNames } from '../../functions'
import dynamic from 'next/dynamic'
import { getAddress } from '@ethersproject/address'
import useFarmRewards from '../../hooks/useFarmRewards'
import usePool from '../../hooks/usePool'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { usePositions, usePendingSushi } from '../../features/onsen/hooks'
import { useRouter } from 'next/router'
import { updateUserFarmFilter } from '../../state/user/actions'
import { getFarmFilter, useUpdateFarmFilter } from '../../state/user/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export default function Farm(): JSX.Element {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()
  const router = useRouter()

  const type = router.query.filter as string

  const savedFilter = getFarmFilter()

  if (!type && savedFilter) {
    router.push(`/farm?filter=${savedFilter}`)
  }

  const updateFarmFilter = useUpdateFarmFilter()
  updateFarmFilter(type)

  const hardcodedPairs = {
    [ChainId.DOGECHAIN]: {
      // wdoge/stables
      "0xd26745d973005bbdA64dB020B75B1720C4Ee7b23": {
        farmId: 0,
        allocPoint: 100000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: USDC,
      },
      "0x09C973cc157b2d99AdA183097c89EacFA73B0F59": {
        farmId: 1,
        allocPoint: 50000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: USDT,
      },
      "0xbD66c80177032252D44EF12142d8Db580595ffba": {
        farmId: 2,
        allocPoint: 100000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: DAI,
      },

      // wdoge/token
      "0x803f8D6017cEaE18152fc06c901184D7be7380BD": {
        farmId: 3,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0x0755FA2F4AA6311E1D7C19990416c86F17D16F86', 6, 'DOGEP', 'Doge Print')
      },
      "0xfDc909b3D9b1b13eC1F73d2c35C8E5EF919D188e": {
        farmId: 4,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0xe3fcA919883950c5cD468156392a6477Ff5d18de', 18, 'OMNOM', 'Doge Eat Doge'),
      },
      "0x8A02de3B3A03510802e685DC5E73E6a3c6A57714": {
        farmId: 5,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0x8a764cF73438dE795c98707B07034e577Af54825', 18, 'DINU', 'Doge Inu'),
      },
      "0x1c5778BcE35219f8D60EFf82CD88a6Bd1CF352E5": {
        farmId: 6,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0xA1D56fE00ca784c4F3414324d1Da6b3Df9A2aCF9', 18, 'Wiener', 'WienerDoge'),
      },
      "0xa163232cf831EaD2949abda9a537B98bD31cE4cC": {
        farmId: 7,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0x87b6bd987915b24361cf086490cB9F7e847e533d', 9, 'ASTRO', 'AstroDoge'),
      },
      "0x617Df613968284E280C88f455d7B1FD08aCC486a": {
        farmId: 8,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0x1df5c9B7789BD1416d005C15A42762481C95eDC2', 18, 'DTools', 'DogeTools'),
      },
      "0xf8407Ac942047A77aaCb73aB30dD47E02B07e69c": {
        farmId: 9,
        allocPoint: 25000000,
        token0: WBCH[ChainId.DOGECHAIN],
        token1: new Token(ChainId.DOGECHAIN, '0x44aA2dfe660439E9a93483EC665Bf20dE62CEc2B', 18, 'BOURBON', 'Bourbon'),
      },

      // stable/stable stable/othercoin
      "0xE770d97159303E5d4C934270579ad22715b37a08": {
        farmId: 10,
        allocPoint: 50000000,
        token0: USDC,
        token1: USDT,
      },
      "0xAF2501Ba965a0DefF1ECB1BdD6ab76A9EEcca0F5": {
        farmId: 11,
        allocPoint: 25000000,
        token0: USDC,
        token1: DAI,
      },
      "0x78D6c73A1a6ED79554f921cfD9138Ec8B4863ED6": {
        farmId: 12,
        allocPoint: 25000000,
        token0: USDC,
        token1: new Token(ChainId.DOGECHAIN, '0xfA9343C3897324496A05fC75abeD6bAC29f8A40f', 8, 'WBTC', 'Wrapped BTC'),
      },
      "0x62Ad058Feb31cc6C896bD71c49eF3A98cb800EC5": {
        farmId: 13,
        allocPoint: 25000000,
        token0: USDC,
        token1: new Token(ChainId.DOGECHAIN, '0xB44a9B6905aF7c801311e8F4E76932ee959c663C', 18, 'ETH', 'Ethereum'),
      },

      // dogmoney pairs
      /*
      "0x2Cb4771d7fe5A387476e68765e8883B6933AD0a4": {
        farmId: 14,
        allocPoint: 300000000,
        token0: MIST[ChainId.DOGECHAIN],
        token1: WBCH[ChainId.DOGECHAIN],
      },
      "0x2Cb4771d7fe5A387476e68765e8883B6933AD0a4": {
        farmId: 15,
        allocPoint: 50000000,
        token0: MIST[ChainId.DOGECHAIN],
        token1: USDC,
      },
      "0x2Cb4771d7fe5A387476e68765e8883B6933AD0a4": {
        farmId: 16,
        allocPoint: 50000000,
        token0: MIST[ChainId.DOGECHAIN],
        token1: USDT,
      },
      "0x2Cb4771d7fe5A387476e68765e8883B6933AD0a4": {
        farmId: 17,
        allocPoint: 50000000,
        token0: MIST[ChainId.DOGECHAIN],
        token1: DAI,
      },
      */
    },
  };

  const kashiPairs = [] // unused
  const swapPairs = []
  let farms = []

  for (const [pairAddress, pair] of Object.entries(hardcodedPairs[chainId])) {
    const p: any = pair;
    swapPairs.push({
      id: pairAddress,
      reserveUSD: "100000",
      totalSupply: "1000",
      timestamp: "1599830986",
      token0: {
        id: p.token0.address,
        name: p.token0.name,
        symbol: p.token0.symbol,
        decimals: p.token0.decimals
      },
      token1: {
        id: p.token1.address,
        name: p.token1.name,
        symbol: p.token1.symbol,
        decimals: p.token1.decimals
      },
    })

    const f = {
      pair: pairAddress,
      symbol: `${hardcodedPairs[chainId][pairAddress].token0.symbol}-${hardcodedPairs[chainId][pairAddress].token1.symbol}`,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      pool: usePool(pairAddress),
      allocPoint: p.allocPoint,
      balance: "1000000000000000000",
      chef: 0,
      id: p.farmId,
      pendingSushi: undefined,
      pending: 0,
      owner: {
        id: MASTERCHEF_ADDRESS[chainId],
        sushiPerBlock: "10000000000000000000",
        totalAllocPoint: "1000000000"
      },
      userCount: 1,
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    f.pendingSushi = usePendingSushi(f)
    f.pending = Number.parseFloat(f.pendingSushi?.toFixed())

    farms.push(f);
  }

  farms = farms.sort((a, b) => b.allocPoint - a.allocPoint);

  let bchPriceUSD = 0.08;
  let mistPriceUSD = 0.1;
  if (chainId === 10000) {
    let bchPriceFlexUSD = 100;
    const mistflexusdPool = farms.find((v) => v.pair === '0x437E444365aD9ed788e8f255c908bceAd5AEA645').pool;
    const bchusdtPool = farms.find((v) => v.pair === '0x27580618797a2CE02FDFBbee948388a50a823611').pool;
    const bchflexusdPool = farms.find((v) => v.pair === '0x24f011f12Ea45AfaDb1D4245bA15dCAB38B43D13').pool;
    if (bchusdtPool.reserves) {
      bchPriceUSD = Number.parseFloat(bchusdtPool.reserves[1].toFixed()) / Number.parseFloat(bchusdtPool.reserves[0].toFixed());
    }
    if (bchflexusdPool.reserves) {
      bchPriceFlexUSD = Number.parseFloat(bchflexusdPool.reserves[1].toFixed()) / Number.parseFloat(bchflexusdPool.reserves[0].toFixed());
    }
    if (mistflexusdPool.reserves && bchusdtPool.reserves && bchflexusdPool.reserves) {
      mistPriceUSD = 1. / ( Number.parseFloat(mistflexusdPool.reserves[0].toFixed()) / Number.parseFloat(mistflexusdPool.reserves[1].toFixed()))
      mistPriceUSD /= (bchPriceFlexUSD / bchPriceUSD);
    }
  }

  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    MASTERCHEF_ADDRESS[chainId],
    farms.map((farm) => new Token(chainId, farm.pair, 18, 'LP', 'LP Token')),
  )

  if (! fetchingV2PairBalances) {
    console.log('v2PairsBalances', v2PairsBalances)
    for (let i=0; i<farms.length; ++i) {
      if (v2PairsBalances.hasOwnProperty(farms[i].pair) && farms[i].pool.totalSupply) {
        const totalSupply = Number.parseFloat(farms[i].pool.totalSupply.toFixed());
        const chefBalance = Number.parseFloat(v2PairsBalances[farms[i].pair].toFixed());

        let tvl = 0;
        if (farms[i].pool.token0 === MIST[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * mistPriceUSD * 2;
        }
        else if (farms[i].pool.token1 === MIST[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * mistPriceUSD * 2;
        }
        else if (farms[i].pool.token0 === USDC.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token1 === USDC.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token0 === USDT.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token1 === USDT.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token0 === DAI.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token1 === DAI.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * 2;
        }
        else if (farms[i].pool.token0 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed());
          tvl = reserve / totalSupply * chefBalance * bchPriceUSD * 2;
        }
        else if (farms[i].pool.token1 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed());
          tvl = reserve / totalSupply * chefBalance * bchPriceUSD * 2;
        }
        farms[i].tvl = tvl;
        farms[i].totalSupply = totalSupply;
        farms[i].chefBalance = chefBalance;

        console.log(farms[i].pair, farms[i].tvl, farms[i].totalSupply, farms[i].chefBalance)
      } else {
        farms[i].tvl = "0";
        farms[i].totalSupply = 0;
        farms[i].chefBalance = 0;
      }
    }
  }

  const positions = usePositions(chainId)

  // const averageBlockTime = useAverageBlockTime()
  const averageBlockTime = 2;

  // const masterChefV1TotalAllocPoint = useMasterChefV1TotalAllocPoint()

  const masterChefV1SushiPerBlock = useMasterChefV1SushiPerBlock()

  const blocksPerDay = 86400 / Number(averageBlockTime)

  const map = (pool) => {
    // TODO: Account for fees generated in case of swap pairs, and use standard compounding
    // algorithm with the same intervals acrosss chains to account for consistency.
    // For lending pairs, what should the equivilent for fees generated? Interest gained?
    // How can we include this?

    // TODO: Deal with inconsistencies between properties on subgraph
    pool.owner = pool?.owner || pool?.masterChef
    pool.balance = pool?.balance || pool?.slpBalance

    const swapPair = swapPairs?.find((pair) => pair.id === pool.pair)
    const kashiPair = kashiPairs?.find((pair) => pair.id === pool.pair)

    const type = swapPair ? PairType.SWAP : PairType.KASHI

    const pair = swapPair || kashiPair

    function getRewards() {
      // TODO: Some subgraphs give sushiPerBlock & sushiPerSecond, and mcv2 gives nothing
      const sushiPerBlock =
        pool?.owner?.sushiPerBlock / 1e18 ||
        (pool?.owner?.sushiPerSecond / 1e18) * averageBlockTime ||
        masterChefV1SushiPerBlock

      const rewardPerBlock = (pool.allocPoint / pool.owner.totalAllocPoint) * sushiPerBlock

      const defaultReward = {
        token: 'DOGMONEY',
        icon: 'https://assets.dogmoney.money/blockchains/dogechain/assets/0x93C8a00416dD8AB9701fa15CA120160172039851/logo.png',
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: +mistPriceUSD,
      }

      const defaultRewards = [defaultReward]

      return defaultRewards
    }

    const rewards = getRewards()

    const balance = Number(pool.balance / 1e18);

    const roiPerBlock = rewards.reduce((previousValue, currentValue) => {
      return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
    }, 0) / pool.tvl

    const roiPerDay = roiPerBlock * blocksPerDay

    const roiPerYear = roiPerDay * 365

    const position = positions.find((position) => position.id === pool.id && position.chef === pool.chef)

    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: pair.type === PairType.KASHI ? Number(pair.asset.tokenInfo.decimals) : 18,
        type,
      },
      balance,
      roiPerYear,
      rewards,
    }
  }

  const FILTER = {
    all: (farm) => farm.allocPoint !== 0,
    portfolio: (farm) => farm.pending !== 0,
    past: (farm) => farm.allocPoint === 0,
    // sushi: (farm) => farm.pair.type === PairType.SWAP && farm.allocPoint !== '0',
    // kashi: (farm) => farm.pair.type === PairType.KASHI && farm.allocPoint !== '0',
    // '2x': (farm) => (farm.chef === Chef.MASTERCHEF_V2) && farm.allocPoint !== '0',
  }

  const data = farms
    .filter((farm) => {
      return (
        (swapPairs && swapPairs.find((pair) => pair.id === farm.pair)) ||
        (kashiPairs && kashiPairs.find((pair) => pair.id === farm.pair))
      )
    })
    .map(map)
    .filter((farm) => {
      return type in FILTER ? FILTER[type](farm) : true
    })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol'],
    threshold: 0.4,
  }

  const { result, term, search } = useFuse({
    data,
    options,
  })

  return (
    <Container id="farm-page" className="h-full py-4 mx-auto lg:grid lg:grid-cols-4 md:py-8 lg:py-12 gap-9" maxWidth="7xl">
      <Head>
        <title>Farm | DOGMONEY</title>
        <meta key="description" name="description" content="Farm DOGMONEY" />
      </Head>
      <div className={classNames('px-3 md:px-0 lg:block md:col-span-1')}>
        <Menu positionsLength={positions.length} />
        <div className="relative hidden h-80 lg:block">
          <Image layout="fill" objectFit="contain" objectPosition="bottom" src="/mist-machine.png" alt="" />
        </div>
      </div>
      <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>
        <Search
          search={search}
          placeholder={i18n._(t`Search by name, symbol, address`)}
          term={term}
          className={classNames('px-3 md:px-0 ')}
          inputProps={{
            className:
              'relative w-full bg-transparent border border-transparent focus:border-gradient-r-blue-pink-dark-900 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-6 py-3.5',
          }}
        />

        <div className="flex items-center hidden text-lg font-bold md:block text-high-emphesis whitespace-nowrap">
          Farms{' '}
          <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
        </div>

        <FarmList farms={result} term={term} />
      </div>
    </Container>
  )
}
