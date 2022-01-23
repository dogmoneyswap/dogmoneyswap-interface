import React, { useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import Container from '../../../components/Container'
import Back from '../../../components/Back'
import Typography from '../../../components/Typography'
import Head from 'next/head'
import Image from 'next/image'
import { classNames, shortenAddress, shortenString } from '../../../functions'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks'
import { useLingui } from '@lingui/react'
import useSWR, { SWRResponse, useSWRConfig } from 'swr'
import { useBlockNumber } from '../../../state/application/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { useRouter } from 'next/router'
import ProposalVoteOption from '../../../features/governance/ProposalVoteOption'
import Copy from '../../../components/AccountDetails/Copy'
import { castVote, formatXmist, VOTING_API_URL } from '../../../features/governance/util'
import Button from '../../../components/Button'
import Web3Connect from '../../../components/Web3Connect'
import moment from 'moment'

export default function Proposal() {
  const { i18n } = useLingui()
  const { account, library } = useActiveWeb3React()
  const router = useRouter()
  const { proposalId } = router.query
  const currentBlock = useBlockNumber();
  const [selectedIndex, setSelectedIndex] = useState<Number | null>(null);

  const { data }: SWRResponse<any, Error> = useSWR(
    `${VOTING_API_URL}/proposal/${proposalId}${account ? `?address=${account}` : ""}`,
    (url) => fetch(url).then((r) => r.json().then((json) => {
      if (!r.ok)
        throw Error(json.error);
      return json;
    }))
  )

  const zero = BigNumber.from(0);
  if (data) {
    [data].forEach(proposal => {
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
  }

  const proposal = data;

  const { cache, mutate } = useSWRConfig()

  const vote = useCallback(async () => {
    castVote({proposal, index: selectedIndex, cache, mutate, library, account});
  }, [account, proposal, selectedIndex]);

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
        </Typography>
      </div>
      <div className="p-4 space-y-4 rounded bg-dark-900">
        <div className="grid grid-flow-row gap-3">
          {!proposal && (
            <div>
              {i18n._(t`Proposal ${proposalId} not found`)}
            </div>
          )}
          {proposal && (
            <>
              <div className="flex flex-col w-full p-4 border-t-0 rounded bg-dark-800">
                <div>
                  <span className="flex items-baseline float-right text-xs flex-nowrap">
                    {i18n._(t`Voting proposal`)} <Copy className="ml-1 text-primary" toCopy={proposal?.proposalId}>{shortenString(proposal?.proposalId, 10)}</Copy>
                  </span>
                </div>
                <div className="text-xl font-bold">
                </div>
                <div className="">
                  <span className={`pl-2 pr-2 text-white rounded border border-white ${proposal?.status === i18n._(t`active`) ? "bg-[#2edd7d]" : "bg-[#dd3a2e]"}`}>{proposal?.status}</span>
                  <span className="float-right">{i18n._(t`ends at block ${proposal?.endBlock} (${proposal?.statusText})`)}</span>
                </div>

                <div className="grid gap-4 pt-8 pb-8">
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
                  <span className="float-left mt-2">Your voting power: {formatXmist(proposal.userVotingPower)} xMIST</span>
                  <span className="float-right mt-2">{i18n._(t`Total votes: ${proposal?.voteCount}`)}</span>
                </div>
              </div>

              <div className="flex flex-col w-full p-4 border-t-0 rounded bg-dark-800">
                Select a voting option and click on "Vote"
                {proposal?.options.map((option, index) => (
                  <div className="flex items-center justify-center mt-3">
                    <Button onClick={() => {setSelectedIndex(index)}} className="w-full"
                      color="blue"
                      variant={selectedIndex === index ? "filled" : "outlined"}
                    >
                      {option}
                    </Button>
                  </div>
                ))}
                <div className="flex self-center w-64 mt-4">
                  {!account ? (
                    <Web3Connect size="lg" color="gradient" className="w-full" />
                  ) : (
                    <Button onClick={vote}
                      color="gradient"
                      variant="filled"
                    >
                      {i18n._(t`Vote`)}
                    </Button>
                  )}
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
                    <span className="flex items-baseline flex-nowrap">{formatXmist(vote.amount)} <span className="hidden pl-1 text-xs md:flex">xMIST</span></span>
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
