import { i18n } from "@lingui/core";
import { t } from "@lingui/macro";
import React,{useCallback, useEffect, useState} from "react";
import { CheckCircle } from "react-feather";
import Modal from "../../components/Modal";
import ModalHeader from "../../components/ModalHeader";
import Typography from "../../components/Typography";
import { formatNumber } from "../../functions";
import { BridgeChains } from "../../pages/bridge";

import QRCode from "qrcode.react";
import { HopDirection, HopInProcess, HopOutProcess, HopStage } from "../../services/hop.cash";
import { useActiveWeb3React } from "../../hooks";
import { ShiftInProcess, ShiftOutProcess, ShiftStage } from "../../services/sideshift.ai";
import Dots from "../../components/Dots";
import Copy from "../../components/AccountDetails/Copy";
import { useTransactionGetter, useTransactionUpdater } from "../../state/bridgeTransactions/hooks";
import { TransactionDetails } from "../../state/bridgeTransactions/reducer";
import { ExternalLinkIcon } from "@heroicons/react/outline";
import { useWeb3React } from "@web3-react/core";
import { NetworkContextName } from "../../constants";

const shorten = (text: string, size = 5) => {
  if (!text)
    return "";

  if (text.length > 20) {
    return `${text.slice(0, size)}...${text.slice(-size)}`
  }
  return text
}

const needsDots = (message: string) => {
  if (message.includes(i18n._(t`Bridge process cancelled due to error:`)) || message.includes(i18n._(t`Funds arrived to destination`))) {
    return false
  }
  return true
}

interface BridgeModalProps {
  isOpen: boolean
  hash: string
  onDismiss: () => void
}

export default function BridgeModal({
  isOpen,
  hash,
  onDismiss,
}: BridgeModalProps) {
  const { library: provider } = useWeb3React() // provider with signer
  const { library: networkProvider } = useWeb3React(NetworkContextName) // provider without signer capabilities

  const transactionGetter = useTransactionGetter;
  const transactionUpdater = useTransactionUpdater();
  let bridgeTransaction = transactionGetter(hash) || {} as TransactionDetails;
  const transactionFound = Object.keys(bridgeTransaction).length
  const { methodId, srcChainId, symbol, initialAmount } = bridgeTransaction
  const chainFrom = BridgeChains[srcChainId]
  const address = (bridgeTransaction.shiftStatus || {}).depositAddress || (bridgeTransaction.hopStatus || {}).depositAddress || null
  const shiftNeeded = methodId !== "bch"

  const [statusText, setStatusText] = useState<string | null>("Initializing")
  const [depositAddress, setDepositAddress] = useState<string | null>(bridgeTransaction.hopStatus?.direction === HopDirection.in ? address : null)
  const [memo, setMemo] = useState<string | null>(bridgeTransaction.shiftStatus?.memo)
  const [destinationTag, setDestinationTag] = useState<number | null>(bridgeTransaction.shiftStatus?.destinationTag)
  const [sideShiftOrderId, setSideShiftOrderId] = useState<string | null>(bridgeTransaction.shiftStatus?.orderId)
  const [bchTransactionId, setBchTransactionId] = useState<string | null>(bridgeTransaction.hopStatus?.bchTxId)
  const [sbchTransactionId, setSbchTransactionId] = useState<string | null>(bridgeTransaction.hopStatus?.sbchTxId)

  const [retryAttempt, setRetryAttempt] = useState<number>(0)
  const [errorTrace, setErrorTrace] = useState<string>("")

  const depositAddressWithAmount = shiftNeeded ? depositAddress : `${depositAddress}?amount=${bridgeTransaction.initialAmount}`

  useEffect(() => {
    const stateMachine = async () => {
      if (isOpen && transactionFound) {
        const hopProcess = bridgeTransaction.hopStatus?.direction === HopDirection.in ?
          HopInProcess.fromObject({...bridgeTransaction.hopStatus}, provider, networkProvider) :
          HopOutProcess.fromObject({...bridgeTransaction.hopStatus}, provider, networkProvider)

        const shiftProcess = bridgeTransaction.hopStatus?.direction === HopDirection.in ?
          ShiftInProcess.fromObject({...bridgeTransaction.shiftStatus}) :
          ShiftOutProcess.fromObject({...bridgeTransaction.shiftStatus})

        const previousStep = {...bridgeTransaction}
        try {
          if (hopProcess.direction === HopDirection.in) {
            // hop in
//#region hop.cash state machine
            await hopProcess.work()

            switch (hopProcess.stage) {
              case undefined:
              case HopStage.init:
                setStatusText(i18n._(t`Initializing`))
                break;
              case HopStage.deposit:
                //#region sideshift.ai state machine
                if (shiftNeeded) {
                  shiftProcess.destinationAddress = hopProcess.depositAddress
                  await shiftProcess.work()

                  switch (shiftProcess.stage) {
                    case undefined:
                    case ShiftStage.init:
                      setStatusText(i18n._(t`Initializing`))
                      break;
                    case ShiftStage.deposit:
                      setSideShiftOrderId(shiftProcess.orderId)
                      setDepositAddress(shiftProcess.depositAddress)
                      if (shiftProcess.memo) setMemo(shiftProcess.memo)
                      if (shiftProcess.destinationTag) setDestinationTag(shiftProcess.destinationTag)
                      setStatusText(i18n._(t`Waiting for deposit`))
                      break;
                    case ShiftStage.confirmation:
                      setStatusText(i18n._(t`Waiting for ${symbol} confirmations`))
                      setDepositAddress(null)
                      break;
                    case ShiftStage.settled:
                      // transition to hop cash is automatic when shifting in
                      break;
                  }
                //#endregion sideshift.ai state machine
                } else {
                  setDepositAddress(hopProcess.depositAddress)
                  setStatusText(i18n._(t`Waiting for deposit`))
                }
                break;
              case HopStage.sent:
                setDepositAddress(null)
                setBchTransactionId(hopProcess.bchTxId)
                setSbchTransactionId(hopProcess.sbchTxId)
                setStatusText(i18n._(t`Funds sent to the cross-chain bridge`))
                break;
              case HopStage.settled:
                setDepositAddress(null)
                setBchTransactionId(hopProcess.bchTxId)
                setSbchTransactionId(hopProcess.sbchTxId)
                setStatusText(i18n._(t`Funds arrived to destination`))
                break;
              case HopStage.cancelled:
                setStatusText(i18n._(t`Bridge process cancelled due to error:`))
                break;
            }
          } else {
            // hop out
            if (shiftNeeded) {
              shiftProcess.destinationAddress = bridgeTransaction.destinationAddress
              await shiftProcess.work()

              switch (shiftProcess.stage) {
                case undefined:
                case ShiftStage.init:
                  setStatusText(i18n._(t`Initializing`))
                  break;
                case ShiftStage.deposit:
                  hopProcess.destinationAddress = shiftProcess.depositAddress
                  setSideShiftOrderId(shiftProcess.orderId)
                  if (shiftProcess.memo) setMemo(shiftProcess.memo)
                  if (shiftProcess.destinationTag) setDestinationTag(shiftProcess.destinationTag)
                  break;
                case ShiftStage.confirmation:
                  setStatusText(i18n._(t`Waiting for ${symbol} confirmations`))
                  break;
                case ShiftStage.settled:
                  setStatusText(i18n._(t`Funds arrived to destination`))
                  break;
              }
            }

            await hopProcess.work()
            switch (hopProcess.stage) {
              case undefined:
              case HopStage.init:
                setStatusText(i18n._(t`Initializing`))
                break;
              case HopStage.deposit:
                setStatusText(i18n._(t`Waiting for cross-chain transfer`))
                break;
              case HopStage.sent:
                setBchTransactionId(hopProcess.bchTxId)
                setSbchTransactionId(hopProcess.sbchTxId)
                setStatusText(i18n._(t`Funds sent to the cross-chain bridge`))
                break;
              case HopStage.settled:
                setBchTransactionId(hopProcess.bchTxId)
                setSbchTransactionId(hopProcess.sbchTxId)
                if (shiftNeeded) {
                  // setStatusText(i18n._(t`Funds sent to SideShift`))
                } else {
                  setStatusText(i18n._(t`Funds arrived to destination`))
                }
                break;
              case HopStage.cancelled:
                setStatusText(i18n._(t`Bridge process cancelled due to error:`))
                break;
            }
          }
//#endregion hop.cash state machine
        } catch (error) {
          console.log("Error bridging assets", bridgeTransaction)
          console.error(error)
          if (error.message?.includes("dust (code 64)")) {
            // ignore
          } else {
            bridgeTransaction = {...bridgeTransaction, ...{
              beforeError: previousStep,
              errorTrace: error.stack
            }}
            shiftProcess.cancel(error.message)
            hopProcess.cancel(error.message)
            setErrorTrace(error.stack)
            setErrorTrace("")
          }
        }

        if (hopProcess.stage != HopStage.settled && hopProcess.stage != HopStage.cancelled ||
           (shiftNeeded && shiftProcess.stage != ShiftStage.settled && shiftProcess.stage != ShiftStage.cancelled))
        {
          window.smTimeout = setTimeout(stateMachine, 1000)
        }

        const copy = {...bridgeTransaction}

        bridgeTransaction = {...bridgeTransaction, ...{
          hopStatus: hopProcess.toObject(),
          shiftStatus: shiftProcess.toObject(),
        }}

        // todo: need a better take on this
        if (bridgeTransaction.hash && JSON.stringify(copy) !== JSON.stringify(bridgeTransaction)) {
          // store transaction in the browser
          transactionUpdater(bridgeTransaction)

          // send the transaction to the support server
          const myHeaders = new Headers()
          myHeaders.append("Content-Type", "application/json")
          fetch("https://bridgelogger.mistswap.fi/log", {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(bridgeTransaction),
            redirect: 'follow'
          })
        }
      }
    };
    stateMachine();
  }, [isOpen, retryAttempt]);

  const retry = useCallback(() => {
    transactionUpdater(bridgeTransaction?.beforeError || bridgeTransaction)
    setRetryAttempt(retryAttempt+1)
    setStatusText('')
  }, [errorTrace])

  const onClose = () => {
    clearTimeout(window.smTimeout)
    isOpen = false
    onDismiss()
  }

  return (
  <>
    {transactionFound && <Modal isOpen={isOpen} onDismiss={onClose}>
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Bridge ${symbol}`)} onClose={onClose} />
        <Typography variant="sm" className="font-medium">
          {i18n._(t`Sending ${formatNumber(initialAmount)} ${symbol} from ${chainFrom?.name} network`)}
        </Typography>

        <div className="items-center justify-center gap-2 sm:flex">
          <span>{i18n._(t`Bridge Tx Lookup Id:`)}</span>
          <Copy toCopy={hash}>
            {shorten(hash,8)}
          </Copy>
        </div>

        {depositAddress && (<div>
          <div className="flex items-center justify-center">
            <QRCode size={200}  value={depositAddressWithAmount} includeMargin={true} />
          </div>
          <div className="flex items-center justify-center">
            <Copy toCopy={depositAddress}>
              <Typography variant="sm">{shorten(depositAddress, 10)}</Typography>
            </Copy>
          </div>
        </div>)}
        {memo && (
          <div className="flex items-center justify-center">
            <Typography className="font-medium" variant="sm">
              {i18n._(t`Your XLM deposit must contain the memo: "${memo}", otherwise the deposit might be lost`)}
            </Typography>
          </div>
        )}
        {destinationTag && (
          <div className="flex items-center justify-center">
            <Typography className="font-medium" variant="sm">
              {i18n._(t`Your XRP deposit must contain the Destination Tag: "${destinationTag}", otherwise the deposit will be rejected by the network`)}
            </Typography>
          </div>
        )}

        <div className="gap-y-1"
          style={{ display: "flex",
            "flex-direction": bridgeTransaction.hopStatus.direction === HopDirection.in ? "column" : "column-reverse" } as any}
        >
          {sideShiftOrderId && (<div>
            <div className="flex items-center justify-center">
              <a href={`https://sideshift.ai/orders/${sideShiftOrderId}`} target="_blank"
                className="flex flex-row items-center gap-1 font-bold text-baseline text-primary"
              >
                {i18n._(t`sideshift.ai order ${sideShiftOrderId}`)} <ExternalLinkIcon width={20} height={20} />
              </a>
            </div>
          </div>)}

          {bchTransactionId && (<div>
            <div className="flex items-center justify-center">
              <a href={`https://blockchair.com/bitcoin-cash/transaction/${bchTransactionId}`} target="_blank"
                className="flex flex-row items-center gap-1 font-bold text-baseline text-primary"
              >
                {i18n._(t`Doge cross-chain tx ${shorten(bchTransactionId)}`)} <ExternalLinkIcon width={20} height={20} />
              </a>
            </div>
          </div>)}

          {sbchTransactionId && (<div>
            <div className="flex items-center justify-center">
              <a href={`https://www.sonar.cash/tx/${sbchTransactionId}`} target="_blank"
                className="flex flex-row items-center gap-1 font-bold text-baseline text-primary"
              >
                {i18n._(t`DogeChain cross-chain tx ${shorten(sbchTransactionId)}`)} <ExternalLinkIcon width={20} height={20} />
              </a>
            </div>
          </div>)}
        </div>

        {statusText && (
          <div className="flex items-center justify-center gap-2">
            {needsDots(statusText) && (<Dots>
              {statusText}
            </Dots>)}
            {!needsDots(statusText) && (<div>{statusText}</div>)}
            {bridgeTransaction.hopStatus.stage === HopStage.settled &&
              (!shiftNeeded || (shiftNeeded && bridgeTransaction.shiftStatus.stage === ShiftStage.settled))
              && (<CheckCircle className="text-2xl text-green" />)}
          </div>
        )}
        {bridgeTransaction.hopStatus.errorMessage && (
          <div className="flex items-center justify-center text-sm text-blue">
            {bridgeTransaction.hopStatus.errorMessage}
          </div>
        )}
        {bridgeTransaction.errorTrace && bridgeTransaction.beforeError && (
          <div className="flex items-center justify-center text-sm cursor-pointer text-blue" onClick={retry}>
            {i18n._(t`Retry from previous step`)}
          </div>
        )}
      </div>
    </Modal>}
    {!transactionFound && <Modal isOpen={isOpen} onDismiss={onClose}>
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Bridge assets`)} onClose={onClose} />
        <div className="flex items-center justify-center font-bold text-blue">
          {i18n._(t`Bridge transaction not found`)}
        </div>
      </div>
    </Modal>}
  </>
  );
}
