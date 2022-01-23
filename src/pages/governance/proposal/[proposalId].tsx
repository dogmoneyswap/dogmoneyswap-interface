import React, {  } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import Container from '../../../components/Container'
import Back from '../../../components/Back'
import Typography from '../../../components/Typography'
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
    `https://vote.mistswap.fi/proposal/${proposalId}`,
    (url) => fetch(url).then((r) => r.json().then((json) => {
      if (!r.ok)
        throw Error(json.error);
      return json;
    }))
  )

  const zero = BigNumber.from(0);
  if (data) {
    [data].forEach(proposal => {
      proposal.status = currentBlock > proposal.endBlock ?
        i18n._(t`closed`) :
        i18n._(t`active`)

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
    <Container id="vote-page" className="py-4 space-y-6 md:py-8 lg:py-12" maxWidth="2xl">
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
        <meta key="twitter:image" name="twitter:image" content="https://app.mistswap.fi/xmist-governance.png" />
        <meta key="og:title" property="og:title" content="VOTE WITH XMIST" />
        <meta key="og:url" property="og:url" content="https://app.mistswap.fi/vote" />
        <meta key="og:image" property="og:image" content="https://app.mistswap.fi/xmist-governance.png" />
        <meta
          key="og:description"
          property="og:description"
          content="Vote using xMIST on community created proposals."
        />
      </Head>


      <div className="p-4 mb-3 space-y-3">
        <Back />

        <Typography component="h1" variant="h2">
          {proposal && (
            <div>
              {proposal?.title}
            </div>
          )}

          {!proposal && (
            <div>
              Proposal {proposalId} not found
            </div>
          )}
        </Typography>
      </div>
      <div className="p-4 space-y-4 rounded bg-dark-900">
        <div className="grid grid-flow-row gap-3">
          {proposal && (
            <>
              <div className="flex flex-col w-full p-4 border-t-0 rounded bg-dark-800">
                <div>
                  <span className="float-right text-xs">
                    {i18n._(t`Voting proposal ${proposal?.proposalId}`)}
                  </span>
                </div>
                <div className="text-xl font-bold">
                </div>
                <div className="">
                  <span className={`pl-2 pr-2 text-white rounded border border-white ${proposal?.status === i18n._(t`active`) ? "bg-[#2edd7d]" : "bg-[#dd3a2e]"}`}>{proposal?.status}</span>
                  <span className="float-right">{i18n._(t`ends at block ${proposal?.endBlock}`)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-8 pb-8">
                  <div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {proposal?.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="gap-4">
                  {proposal?.options.map((option, index) => (
                    <ProposalVoteOption key={index} proposal={proposal} index={index} />
                  ))}
                  <span className="float-right mt-2">{i18n._(t`Total votes: ${proposal?.voteCount}`)}</span>
                </div>
              </div>

              <div className="flex flex-col w-full p-4 border-t-0 rounded bg-dark-800">
                {proposal?.votes.length === 0 && (
                  <div className="text-base font-bold">
                    {i18n._(t`No votes yet`)}
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
    </Container>
  )
}
