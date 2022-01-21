import React, {  } from 'react'

import Container from '../../../components/Container'
import Head from 'next/head'
import Image from 'next/image'
import { classNames, shortenAddress } from '../../../functions'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks'
import { useLingui } from '@lingui/react'
import useSWR, { SWRResponse } from 'swr'
import { useBlockNumber } from '../../../state/application/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { useRouter } from 'next/router'
import ProposalVoteOption from '../../../features/governance/ProposalVoteOption'
import millify from 'millify'
import Copy from '../../../components/AccountDetails/Copy'

export default function Proposal() {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()
  const router = useRouter()
  const { proposalId } = router.query
  const currentBlock = useBlockNumber();

  const { data }: SWRResponse<any, Error> = useSWR(
    `http://116.203.218.213:3000/proposal/${proposalId}`,
    (url) => fetch(url).then((r) => r.json().then((json) => {
      if (!r.ok)
        throw Error(json.error);
      return json;
    }))
  )

  const zero = BigNumber.from(0);
  if (data) {
    [data].forEach(proposal => {
      proposal.status = currentBlock > proposal.endBlock ? 'closed' : 'active'

      const weightedHistogram = proposal.histogram.map(val => BigNumber.from(val));
      const sum = weightedHistogram.reduce((a, b) => a.add(b), zero);
      if (sum.eq(zero)) {
        proposal.weightedHistogram = proposal.histogram.map(() => 0);
      } else {
        proposal.weightedHistogram = weightedHistogram.map(val => val.mul(1e4).div(sum).toNumber() / 1e2);
      }
    });
  }

  const proposal = data;

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

              {!proposal && (
                <div className="text-xl font-bold">
                  {`Proposal ${proposalId} not found`}
                </div>
              )}

              {proposal && (
                <>
                  <div className="flex flex-col w-full p-4 border-t-0 rounded bg-dark-800">
                    <div>
                      <span className="float-right text-xs">
                        Voting proposal {proposal?.proposalId}
                      </span>
                    </div>
                    <div className="text-xl font-bold">
                      {proposal?.title}
                    </div>
                    <div className="">
                      {proposal?.status}
                      <span className="float-right">ends at block {proposal?.endBlock}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-8 pb-8">
                      {proposal?.content}
                    </div>
                    <div className="gap-4">
                      {proposal?.options.map((option, index) => (
                        <ProposalVoteOption key={index} proposal={proposal} index={index} />
                      ))}
                      <span className="float-right mt-2">Total votes: {proposal?.voteCount}</span>
                    </div>
                  </div>

                  <div className="flex flex-col w-full p-4 border-t-0 rounded bg-dark-800">
                    {proposal?.votes.length === 0 && (
                      <div className="text-base font-bold">
                        {`No votes yet`}
                      </div>
                    )}
                    {proposal?.votes.map(vote => (
                      <div key={vote.address} className="grid grid-cols-10">
                        <div className="flex flex-col items-start col-span-3">
                          <Copy toCopy={vote.address}>
                            <span>{shortenAddress(vote.address)}</span>
                          </Copy>
                        </div>
                        <div className="flex flex-col items-center col-span-5">
                          <span>{proposal.options[vote.choiceId]}</span>
                        </div>
                        <div className="flex flex-col items-end col-span-2">
                          <span className='flex items-baseline flex-nowrap'>{millify(vote.amount.slice(0, -18) || "0")} <span className="hidden pl-1 text-xs md:flex">xMIST</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
