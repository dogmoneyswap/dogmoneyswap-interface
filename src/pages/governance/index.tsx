import React, {  } from 'react'

import Container from '../../components/Container'
import ProposalList from '../../features/governance/ProposalList'
import Head from 'next/head'
import Image from 'next/image'
import Search from '../../components/Search'
import { classNames } from '../../functions'
import { t } from '@lingui/macro'
import { useActiveWeb3React, useFuse } from '../../hooks'
import { useLingui } from '@lingui/react'
import useSWR, { SWRResponse } from 'swr'
import { useBlockNumber } from '../../state/application/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { VOTING_API_URL } from '../../features/governance/util'
import { useWeb3React } from '@web3-react/core'
import moment from 'moment'

export default function Vote() {
  const { i18n } = useLingui()
  const { account, chainId } = useWeb3React()

  const parsedQs = useParsedQueryString();
  const currentBlock = useBlockNumber();

  const { data, error }: SWRResponse<any[], Error> = useSWR(
    `${VOTING_API_URL}/proposal/all${account ? `?address=${account}` : ""}`,
    (url) => fetch(url).then((r) => r.json())
  )

  const zero = BigNumber.from(0);
  data?.forEach(proposal => {
    const blockDelta = proposal.endBlock - currentBlock;
    const secondsLeft = blockDelta * 5.5;
    const expireTime = moment().add(secondsLeft, "seconds").fromNow(true);

    proposal.status = currentBlock > proposal.endBlock ?
      i18n._(t`closed`) :
      i18n._(t`active`);
    proposal.statusText = currentBlock > proposal.endBlock ?
      i18n._(t`${expireTime} ago`) :
      i18n._(t`${expireTime} left`);

    const weightedHistogram = proposal.histogram.map(val => BigNumber.from(val));
    const sum = weightedHistogram.reduce((a, b) => a.add(b), zero);
    if (sum.eq(zero)) {
      proposal.weightedHistogram = proposal.histogram.map(() => 0);
    } else {
      proposal.weightedHistogram = weightedHistogram.map(val => val.mul(1e4).div(sum).toNumber() / 1e2);
    }
  });

  const options = {
    keys: ['title', 'proposalId'],
    threshold: 0.4,
    default: parsedQs.proposalId
  }
  const { result, term, search } = useFuse({
    data,
    options,
  })
  return (
    <Container id="vote-page" className="py-4 md:py-8 lg:py-12" maxWidth="full">
      <Head>
        <title key="title">Vote | DOGMONEY</title>
        <meta
          key="description"
          name="description"
          content="Vote using xDOGMONEY on community created proposals."
        />
        <meta key="twitter:url" name="twitter:url" content="https://app.dogmoney.money/vote" />
        <meta key="twitter:title" name="twitter:title" content="VOTE WITH xDOGMONEY" />
        <meta
          key="twitter:description"
          name="twitter:description"
          content="Vote using xDOGMONEY on community created proposals."
        />
        <meta key="twitter:image" name="twitter:image" content="https://app.dogmoney.money/xdogmoney-governance.png" />
        <meta key="og:title" property="og:title" content="VOTE WITH xDOGMONEY" />
        <meta key="og:url" property="og:url" content="https://app.dogmoney.money/vote" />
        <meta key="og:image" property="og:image" content="https://app.dogmoney.money/xdogmoney-governance.png" />
        <meta
          key="og:description"
          property="og:description"
          content="Vote using xDOGMONEY on community created proposals."
        />
      </Head>
      <div className="flex flex-col w-full min-h-full">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col w-full max-w-xl mt-auto mb-2">
            <div className="flex max-w-lg">
              <div className="self-end mb-3 text-lg font-bold md:text-2xl text-high-emphesis md:mb-7">
                {i18n._(t`Vote using xDOGMONEY on community created proposals.`)}
              </div>
            </div>
            <div className="max-w-lg pr-3 mb-2 text-sm leading-5 text-gray-500 md:text-base md:mb-4 md:pr-0">
              {i18n._(t`View proposals and vote on them using your xDOGMONEY. The amount of xDOGMONEY you hold at the snapshot block determines your vote weight. You may only vote once per proposal.`)}
            </div>
          </div>
          <div className="hidden px-8 ml-6 md:block w-72">
            <Image src="/xmist-governance.png" alt="xDOGMONEY Governance" width="100%" height="100%" layout="responsive" />
          </div>
        </div>
        <div className="flex justify-center mb-6">
          <div className="flex flex-col w-full mt-auto mb-4 max-w-7xl">
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

              <div className="flex items-center hidden text-lg font-bold md:block text-high-emphesis whitespace-nowrap">
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
