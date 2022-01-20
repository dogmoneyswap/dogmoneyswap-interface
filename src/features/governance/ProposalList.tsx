import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteScroll } from './hooks'
import Dots from '../../components/Dots'
import ProposalListItem from './ProposalListItem'
import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import useSortableData from '../../hooks/useSortableData'

const ProposalList = ({ proposals, term }) => {
  const { items, requestSort, sortConfig } = useSortableData(proposals)
  const { i18n } = useLingui()
  const [numDisplayed, setNumDisplayed] = useInfiniteScroll(items)

  return items ? (
    <>
      <div className="grid grid-cols-3 text-base font-bold text-primary">
        <div
          className="flex items-center col-span-1 px-4 cursor-pointer"
          onClick={() => requestSort('title')}
        >
          <div className="hover:text-high-emphesis">{i18n._(t`Title`)}</div>
          {sortConfig &&
            sortConfig.key === 'title' &&
            ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
              (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
        </div>
        <div
          className="flex items-center justify-center px-4 cursor-pointer hover:text-high-emphesis"
          onClick={() => requestSort('status')}
        >
          {i18n._(t`Status`)}
          {sortConfig &&
            sortConfig.key === 'status' &&
            ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
              (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
        </div>
        <div className="flex items-center justify-center px-4 cursor-pointer hover:text-high-emphesis"
          onClick={() => requestSort('endBlock')}
        >
          {i18n._(t`End Block`)}
          {sortConfig &&
            sortConfig.key === 'endBlock' &&
            ((sortConfig.direction === 'ascending' && <ChevronUpIcon width={12} height={12} />) ||
              (sortConfig.direction === 'descending' && <ChevronDownIcon width={12} height={12} />))}
        </div>
      </div>
      <InfiniteScroll
        dataLength={numDisplayed}
        next={() => setNumDisplayed(numDisplayed + 5)}
        hasMore={true}
        loader={null}
      >
        <div className="space-y-4">
          {items.slice(0, numDisplayed).map((proposal, index) => (
            <ProposalListItem key={index} proposal={proposal} />
          ))}
        </div>
      </InfiniteScroll>
    </>
  ) : (
    <div className="w-full py-6 text-center">{term ? <span>No Results.</span> : <Dots>Loading</Dots>}</div>
  )
}

export default ProposalList
