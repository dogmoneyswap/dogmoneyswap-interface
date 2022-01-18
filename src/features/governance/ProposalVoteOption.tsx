import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useRouter } from 'next/router'

const ProposalVoteOption = ({ proposal, index }) => {
  const { i18n } = useLingui()

  const router = useRouter()

  const { account, chainId } = useActiveWeb3React()

  return (
    <>
      <div>
        {proposal?.options[index]}
      </div>
    </>
  )
};

export default ProposalVoteOption;
