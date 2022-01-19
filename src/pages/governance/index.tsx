import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { BAR_ADDRESS, ZERO } from '@mistswapdex/sdk'
import PROPOSAL_LIST from '@mistswapdex/xmist-governance'
import React, { useEffect, useState } from 'react'
import { MIST, XMIST } from '../../config/tokens'

import Button from '../../components/Button'
import { ChainId } from '@mistswapdex/sdk'
import Container from '../../components/Container'
import ProposalList from '../../features/governance/ProposalList'
import Dots from '../../components/Dots'
import Head from 'next/head'
import Image from 'next/image'
import Input from '../../components/Input'
import TransactionFailedModal from '../../modals/TransactionFailedModal'
import { request } from 'graphql-request'
import Search from '../../components/Search'
import { classNames } from '../../functions'
import styled from 'styled-components'
import sushiData from '@sushiswap/sushi-data'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions/parse'
import { useActiveWeb3React, useFuse } from '../../hooks'
import { useLingui } from '@lingui/react'
import useSWR from 'swr'
import useSushiBar from '../../hooks/useSushiBar'
import { getDayData, useMistPrice } from '../../services/graph'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useWalletModalToggle } from '../../state/application/hooks'


const tabStyle = 'flex justify-center items-center h-full w-full rounded-lg cursor-pointer text-sm md:text-base'
const activeTabStyle = `${tabStyle} text-high-emphesis font-bold bg-dark-900`
const inactiveTabStyle = `${tabStyle} text-secondary`

const buttonStyle =
  'flex justify-center items-center w-full h-14 rounded font-bold md:font-medium md:text-lg mt-5 text-sm focus:outline-none focus:ring'
const buttonStyleEnabled = `${buttonStyle} text-high-emphesis bg-gradient-to-r from-pink-red to-light-brown hover:opacity-90`
const buttonStyleInsufficientFunds = `${buttonStyleEnabled} opacity-60`
const buttonStyleDisabled = `${buttonStyle} text-secondary bg-dark-700`
const buttonStyleConnectWallet = `${buttonStyle} text-high-emphesis bg-cyan-blue hover:bg-opacity-90`

export default function Vote() {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()

  const data = Object.entries(PROPOSAL_LIST.proposals).map(([id, v]) => ({
      id,
      ...v,
      status: 'ACTIVE',
  }));
  const options = {
    keys: ['title'],
    threshold: 0.4,
  }
  const { result, term, search } = useFuse({
    data,
    options,
  })
  return (
    <Container id="vote-page" className="py-4 md:py-8 lg:py-12" maxWidth="full">
      <Head>
        <title key="title">Vote | Mist</title>
        <meta
          key="description"
          name="description"
          content="Vote using xMIST on community created proposals."
        />
        <meta key="twitter:url" name="twitter:url" content="https://app.mistswap.fi/vote" />
        <meta key="twitter:title" name="twitter:title" content="VOTE WITH XMIST" />
        <meta
          key="twitter:description"
          name="twitter:description"
          content="Vote using xMIST on community created proposals."
        />
        <meta key="twitter:image" name="twitter:image" content="https://app.mistswap.fi/xmist-sign.png" />
        <meta key="og:title" property="og:title" content="VOTE WITH XMIST" />
        <meta key="og:url" property="og:url" content="https://app.mistswap.fi/vote" />
        <meta key="og:image" property="og:image" content="https://app.mistswap.fi/xmist-sign.png" />
        <meta
          key="og:description"
          property="og:description"
          content="Vote using xMIST on community created proposals."
        />
      </Head>
      <div className="flex flex-col w-full min-h-full">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col w-full max-w-xl mt-auto mb-2">
            <div className="flex max-w-lg">
              <div className="self-end mb-3 text-lg font-bold md:text-2xl text-high-emphesis md:mb-7">
                {i18n._(t`Vote using xMIST on community created proposals.`)}
              </div>
            </div>
            <div className="max-w-lg pr-3 mb-2 text-sm leading-5 text-gray-500 md:text-base md:mb-4 md:pr-0">
              {i18n._(t`View proposals and vote on them using your xMIST.`)}
            </div>
          </div>
          <div className="hidden px-8 ml-6 md:block w-72">
            <Image src="/xmist-sign.png" alt="xMIST sign" width="100%" height="100%" layout="responsive" />
          </div>
        </div>
        <div className="flex justify-center mb-6">
          <div className="flex flex-col w-full max-w-xl mt-auto mb-4">
            <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>
              <Search
                search={search}
                placeholder={i18n._(t`Search by proposal title`)}
                term={term}
                className={classNames('px-3 md:px-0 ')}
                inputProps={{
                  className:
                    'relative w-full bg-transparent border border-transparent focus:border-gradient-r-blue-pink-dark-900 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-6 py-3.5',
                }}
              />

              <div className="hidden md:block flex items-center text-lg font-bold text-high-emphesis whitespace-nowrap">
                Proposals{' '}
                <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
              </div>

              <ProposalList proposals={result} term={term} />
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
