import { ANALYTICS_URL } from '../../constants'
import { ChainId } from '@dogmoneyswap/sdk'
import ExternalLink from '../ExternalLink'
import Polling from '../Polling'
import { t } from '@lingui/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useLingui } from '@lingui/react'

const Footer = () => {
  const { chainId } = useActiveWeb3React()
  const { i18n } = useLingui()
  return (
    // <footer className="absolute bottom-0 flex items-center justify-between w-screen h-20 p-4 mx-auto text-center text-low-emphesis">
    <footer className="absolute left-0 bottom-16 lg:bottom-0">
      <div className="flex items-center justify-between h-20 px-4">
        <Polling />
      </div>
    </footer>
  )
}

export default Footer
