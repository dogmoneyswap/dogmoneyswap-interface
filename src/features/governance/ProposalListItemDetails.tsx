import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { ChainId, CurrencyAmount, JSBI, MASTERCHEF_ADDRESS, MASTERCHEF_V2_ADDRESS, Token, ZERO } from '@mistswapdex/sdk'
import { Disclosure, Transition } from '@headlessui/react'
import ProposalVoteOption from './ProposalVoteOption'
import React, { useState } from 'react'

import Button from '../../components/Button'
import Dots from '../../components/Dots'
import Input from '../../components/Input'
import { formatCurrencyAmount, formatNumber, formatPercent, shortenString } from '../../functions'
import { getAddress } from '@ethersproject/address'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions/parse'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { isMobile } from 'react-device-detect'
import { useRouter } from 'next/router'
import { formatXmist } from './util'

const ProposalListItemDetails = ({ proposal }) => {
  const { i18n } = useLingui()

  const router = useRouter()

  const { account, chainId } = useActiveWeb3React()

  return (
    <Transition
      show={true}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Disclosure.Panel className="flex flex-col w-full border-t-0 rounded rounded-t-none bg-dark-800" static>
        <div className="grid grid-cols-2 gap-4 p-4 pt-4">
          {shortenString(proposal?.content, 100)}
        </div>
        <div className="gap-4 p-4 pt-0">
          {proposal?.options.map((option, index) => (
            <ProposalVoteOption proposal={proposal} index={index} />
          ))}
          <span className="float-left mt-2">Your voting power: {formatXmist(proposal.userVotingPower)} xMIST</span>
          <span className="float-right mt-2">Total votes: {proposal.voteCount}</span>
          <Button
            className="w-full mt-2"
            color="gradient"
            variant="outlined"
            onClick={async () => {
              router.push(`/vote/${proposal.proposalId}`)
            }}
          >
            {i18n._(t`View proposal details`)}
          </Button>
        </div>
      </Disclosure.Panel>
    </Transition>
  )
}

export default ProposalListItemDetails
