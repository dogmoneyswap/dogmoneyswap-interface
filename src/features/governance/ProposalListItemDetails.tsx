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
  /*
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')

  const addTransaction = useTransactionAdder()

  const liquidityToken = new Token(
    chainId,
    getAddress(farm.pair.id),
    farm.pair.type === PairType.KASHI ? Number(farm.pair.asset.decimals) : 18,
    farm.pair.symbol,
    farm.pair.name
  )

  // User liquidity token balance
  const balance = useTokenBalance(account, liquidityToken)

  // TODO: Replace these
  const amount = useUserInfo(farm, liquidityToken)

  const pendingSushi = usePendingSushi(farm)

  const reward = usePendingReward(farm)

  const APPROVAL_ADDRESSES = {
    [Chef.MASTERCHEF]: {
      [ChainId.SMARTBCH]: MASTERCHEF_ADDRESS[ChainId.SMARTBCH],
      [ChainId.SMARTBCH_AMBER]: MASTERCHEF_ADDRESS[ChainId.SMARTBCH_AMBER],
    },
  }

  const typedDepositValue = tryParseAmount(depositValue, liquidityToken)
  const typedWithdrawValue = tryParseAmount(withdrawValue, liquidityToken)

  const [approvalState, approve] = useApproveCallback(typedDepositValue, APPROVAL_ADDRESSES[farm.chef][chainId])

  const { deposit, withdraw, harvest } = useMasterChef(farm.chef)

  const poolFraction = (Number.parseFloat(amount?.toFixed()) / farm.chefBalance) || 0
  const token0Reserve = farm.pool.reserves ? (farm.pool.reserves.reserve0 as BigNumber).toString() : 0
  const token0Amount = CurrencyAmount.fromRawAmount(farm.pair.token0, JSBI.BigInt(token0Reserve)).multiply(Math.round(poolFraction * 1e8)).divide(1e8)
  const token1Reserve = farm.pool.reserves ? (farm.pool.reserves.reserve1 as BigNumber).toString() : 0
  const token1Amount = CurrencyAmount.fromRawAmount(farm.pair.token1, JSBI.BigInt(token1Reserve)).multiply(Math.round(poolFraction * 1e8)).divide(1e8)
  const token0Name = farm.pool.token0 === farm.pair.token0.id ? farm.pair.token0.symbol : farm.pair.token1.symbol
  const token1Name = farm.pool.token1 === farm.pair.token1.id ? farm.pair.token1.symbol : farm.pair.token0.symbol
  */

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
