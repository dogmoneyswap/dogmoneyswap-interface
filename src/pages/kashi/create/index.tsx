import { TWAP_0_ORACLE_ADDRESS, TWAP_1_ORACLE_ADDRESS, CHAINLINK_ORACLE_ADDRESS, Currency, KASHI_ADDRESS } from '@mistswapdex/sdk'
import React, { useCallback, useState } from 'react'
import { useCreateActionHandlers, useCreateState, useDerivedCreateInfo } from '../../../state/create/hook'

import { AddressZero } from '@ethersproject/constants'
import Button from '../../../components/Button'
import { CHAINLINK_PRICE_FEED_MAP } from '../../../config/oracles/chainlink'
import Card from '../../../components/Card'
import Container from '../../../components/Container'
import CurrencyInputPanel from '../../../components/CurrencyInputPanel'
import { Field } from '../../../state/create/actions'
import Head from 'next/head'
import Layout from '../../../layouts/Kashi'
import { defaultAbiCoder } from '@ethersproject/abi'
import { e10 } from '../../../functions/math'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks/useActiveWeb3React'
import { useBentoBoxContract, useFactoryContract } from '../../../hooks/useContract'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import { useTransactionAdder } from '../../../state/transactions/hooks'
import { PairState, useV2Pair } from '../../../hooks/useV2Pairs'
import { Pair } from '@mistswapdex/sdk'
import NeonSelect, { NeonSelectItem } from '../../../components/Select'

export type ChainlinkToken = {
  symbol: string
  name: string
  address: string
  decimals: number
}

enum OracleType {
  ChainLink,
  TWAP0,
  TWAP1,
}

function Create() {
  const { i18n } = useLingui()

  const { chainId } = useActiveWeb3React()

  const bentoBoxContract = useBentoBoxContract()

  const addTransaction = useTransactionAdder()

  const router = useRouter()
  const factory = useFactoryContract();

  // swap state
  const { independentField, typedValue } = useCreateState()
  const { onSwitchTokens, onCurrencySelection, onUserInput } = useCreateActionHandlers()

  const { currencies, inputError } = useDerivedCreateInfo()

  const [isChainlink, setIsChainlink] = useState<boolean>(false)
  const [pairState, pair] = useV2Pair(currencies[Field.ASSET], currencies[Field.COLLATERAL]) as [PairState, Pair]
  const twapType = pair?.token0.address === currencies[Field.ASSET].wrapped.address ? OracleType.TWAP0 : OracleType.TWAP1
  let error = pairState === PairState.EXISTS ? '' : 'Pair does not exist';

  const [oracleType, setOracleType] = useState<OracleType>(isChainlink ? OracleType.ChainLink : twapType)
  const items = {
    [OracleType.ChainLink]: i18n._(t`ChainLink price oracle`),
    [OracleType.TWAP0]: i18n._(t`Time-weighted average price`),
  }

  const selectHandler = useCallback(
    (e, item) => {
      setIsChainlink(item === OracleType.ChainLink)
      setOracleType(item)
    },
    [items]
  )

  const handleCollateralSelect = useCallback(
    (collateralCurrency) => {
      onCurrencySelection(Field.COLLATERAL, collateralCurrency)
    },
    [onCurrencySelection]
  )

  const handleAssetSelect = useCallback(
    (assetCurrency) => {
      onCurrencySelection(Field.ASSET, assetCurrency)
    },
    [onCurrencySelection]
  )

  const both = Boolean(currencies[Field.COLLATERAL] && currencies[Field.ASSET])

  const getChainlikOracleData = useCallback(
    async (asset: Currency, collateral: Currency) => {
      const oracleData = ''

      const mapping = CHAINLINK_PRICE_FEED_MAP[chainId]

      for (const address in mapping) {
        mapping[address].address = address
      }

      let multiply = AddressZero
      let divide = AddressZero

      const multiplyMatches = Object.values(mapping).filter(
        (m) => m.from === asset.wrapped.address && m.to === collateral.wrapped.address
      )

      let decimals = 0

      if (multiplyMatches.length) {
        const match = multiplyMatches[0]
        multiply = match.address!
        decimals = 18 + match.decimals - match.toDecimals + match.fromDecimals
      } else {
        const divideMatches = Object.values(mapping).filter(
          (m) => m.from === collateral.wrapped.address && m.to === asset.wrapped.address
        )
        if (divideMatches.length) {
          const match = divideMatches[0]
          divide = match.address!
          decimals = 36 - match.decimals - match.toDecimals + match.fromDecimals
        } else {
          const mapFrom = Object.values(mapping).filter((m) => m.from === asset.wrapped.address)
          const mapTo = Object.values(mapping).filter((m) => m.from === collateral.wrapped.address)
          const match = mapFrom
            .map((mfrom) => ({
              mfrom: mfrom,
              mto: mapTo.filter((mto) => mfrom.to === mto.to),
            }))
            .filter((path) => path.mto.length)
          if (match.length) {
            multiply = match[0].mfrom.address!
            divide = match[0].mto[0].address!
            decimals = 18 + match[0].mfrom.decimals - match[0].mto[0].decimals - collateral.decimals + asset.decimals
          } else {
            return ''
          }
        }
      }
      return defaultAbiCoder.encode(['address', 'address', 'uint256'], [multiply, divide, e10(decimals)])
    },
    [chainId]
  )

  const getTWAPOracleData = useCallback(
    async (asset: Currency, collateral: Currency) => {
      const pair = await factory.getPair(asset.wrapped.address, collateral.wrapped.address)
      return defaultAbiCoder.encode(['address'], [pair])
    },
    [chainId]
  )

  const handleCreate = async () => {
    try {
      if (!both) return

      let oracleData;
      let oracleAddress;
      switch (oracleType) {
        case OracleType.ChainLink:
          oracleData = await getChainlikOracleData(currencies[Field.ASSET], currencies[Field.COLLATERAL])
          oracleAddress = CHAINLINK_ORACLE_ADDRESS[chainId]
          break
        case OracleType.TWAP0:
          oracleData = await getTWAPOracleData(currencies[Field.ASSET], currencies[Field.COLLATERAL])
          oracleAddress = TWAP_0_ORACLE_ADDRESS[chainId]
          break
        case OracleType.TWAP1:
          oracleData = await getTWAPOracleData(currencies[Field.ASSET], currencies[Field.COLLATERAL])
          oracleAddress = TWAP_1_ORACLE_ADDRESS[chainId]
          break
      }

      if (!oracleData) {
        console.log('No path')
        return
      }

      const kashiData = defaultAbiCoder.encode(
        ['address', 'address', 'address', 'bytes'],
        [
          currencies[Field.COLLATERAL].wrapped.address,
          currencies[Field.ASSET].wrapped.address,
          oracleAddress,
          oracleData,
        ]
      )

      console.log([
        currencies[Field.COLLATERAL].wrapped.address,
        currencies[Field.ASSET].wrapped.address,
        oracleAddress,
        oracleData,
      ])

      const tx = await bentoBoxContract?.deploy(chainId && KASHI_ADDRESS[chainId], kashiData, true)

      addTransaction(tx, {
        summary: `Add Lend market ${currencies[Field.ASSET].symbol}/${currencies[Field.COLLATERAL].symbol} MistSwap TWAP0`,
      })

      router.push('/lend')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <Head>
        <title>Create Lending Pair | Lend by Mist</title>
        <meta key="description" name="description" content="Create Lending Pair on Lend by Mist" />
      </Head>
      <Card
        className="h-full bg-dark-900"
        header={
          <Card.Header className="bg-dark-800">
            <div className="text-3xl text-high-emphesis leading-48px">Create a Market</div>
          </Card.Header>
        }
      >
        <Container maxWidth="full" className="space-y-6">
          <div className="grid grid-cols-1 grid-rows-2 gap-4 md:grid-rows-1 md:grid-cols-2">
            <CurrencyInputPanel
              label="Collateral"
              showMaxButton={false}
              hideBalance={true}
              hideInput={true}
              currency={currencies[Field.COLLATERAL]}
              onCurrencySelect={handleCollateralSelect}
              otherCurrency={currencies[Field.ASSET]}
              showCommonBases={true}
              id="kashi-currency-collateral"
            />

            <CurrencyInputPanel
              label="Asset"
              showMaxButton={false}
              hideBalance={true}
              hideInput={true}
              currency={currencies[Field.ASSET]}
              onCurrencySelect={handleAssetSelect}
              otherCurrency={currencies[Field.COLLATERAL]}
              showCommonBases={true}
              id="kashi-currency-asset"
            />
          </div>

          {false && <div className="flex justify-between items-center">
            <span>
              {i18n._(t`Select price oracle`)}
            </span>
            <NeonSelect value={items[oracleType]}>
              {Object.entries(items).map(([k, v]) => (
                <NeonSelectItem key={k} value={k} onClick={selectHandler}>
                  {v}
                </NeonSelectItem>
              ))}
            </NeonSelect>
          </div>}

          <Button
            color="gradient"
            className="w-full px-4 py-3 text-base rounded text-high-emphesis"
            onClick={() => handleCreate()}
            disabled={!both || !!error}
          >
            {inputError || error || 'Create'}
          </Button>
        </Container>
      </Card>
    </>
  )
}

const CreateLayout = ({ children }) => {
  const { i18n } = useLingui()
  return (
    <Layout
      left={
        <Card
          className="h-full bg-dark-900"
          backgroundImage="/deposit-graphic.png"
          title={i18n._(t`Create a new Lend Market`)}
          description={i18n._(
            t`If you want to supply to a market that is not listed yet, you can use this tool to create a new pair.`
          )}
        />
      }
    >
      {children}
    </Layout>
  )
}

Create.Layout = CreateLayout

export default Create
