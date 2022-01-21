import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'
import millify from 'millify'
import { useCallback } from 'react';

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

  const vote = useCallback(async () => {
    const signature = await library.getSigner().signMessage(`I am casting vote for ${proposal.proposalId} with choice ${index}`);
    console.log(signature);

    const body = JSON.stringify({
      sig: signature,
      proposalId: proposal.proposalId,
      choiceId: index,
      address: account
    });

    const response = await fetch("http://116.203.218.213:3000/vote", {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json()
    if (json.error) alert(json.error);
  }, [account]);

  return (
    <>
      <div className="pt-2 cursor-pointer" onClick={vote}>
        <div>
          <span>{shorten(proposal?.options[index], 45)}</span>
          <span className="ml-3">{millify(proposal?.histogram[index].slice(0, -18) || "0")} xMIST</span>
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
