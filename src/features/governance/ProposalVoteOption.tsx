import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { formatXmist, VOTING_API_URL } from './util';

const ProposalVoteOption = ({ proposal, index }) => {
  const { i18n } = useLingui()

  const router = useRouter()

  const { account, chainId, library } = useActiveWeb3React()

  const shorten = (text, max) => {
    if (text.length > max) {
      return `${text.substring(0, max)}...`
    }
    return text;
  }

  const { cache, mutate } = useSWRConfig()

  const mutateAll = (key) => {
    const mutations = [...cache.keys()].filter(val => val.indexOf(key) !== -1).map((key) => mutate(key))
    return Promise.all(mutations)
  }

  const vote = useCallback(async () => {
    if (proposal.userVotingPower == "0") {
      alert(`You already have voted or do not have voting power at block height ${proposal.snapshotBlock}`);
      return;
    }

    const signature = await library.getSigner().signMessage(`I am casting vote for ${proposal.proposalId} with choice ${index}`);

    const body = JSON.stringify({
      sig: signature,
      proposalId: proposal.proposalId,
      choiceId: index,
      address: account
    });

    const response = await fetch(`${VOTING_API_URL}/vote`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json()
    if (json.error) alert(json.error);

    mutateAll(VOTING_API_URL);
  }, [account, proposal]);

  return (
    <>
      <div className="pt-2 cursor-pointer" onClick={vote}>
        <div>
          <span>{shorten(proposal?.options[index], 45)}</span>
          <span className="ml-3">{formatXmist(proposal?.histogram[index])} xMIST</span>
          <span className="float-right">{proposal?.weightedHistogram[index]}%</span>
        </div>
        <div className="relative flex h-2 mb-3 overflow-hidden rounded-full">
          <div className="absolute w-full h-full bg-black z-5"></div>
          <div className="z-10 h-full bg-primary" style={{width: `${proposal?.weightedHistogram[index]}%`}}></div>
        </div>
      </div>
    </>
  )
};

export default ProposalVoteOption;
