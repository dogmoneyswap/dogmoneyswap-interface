import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { castVote, formatXmist } from './util';

const ProposalVoteOption = ({ proposal, index }) => {
  const { account, library } = useActiveWeb3React()

  const shorten = (text, max) => {
    if (text.length > max) {
      return `${text.substring(0, max)}...`
    }
    return text;
  }

  const { cache, mutate } = useSWRConfig()

  const vote = useCallback(async () => {
    castVote({proposal, index, cache, mutate, library, account});
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
