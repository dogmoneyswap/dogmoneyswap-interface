import { i18n } from "@lingui/core";
import { t } from "@lingui/macro";
import React,{useEffect, useState} from "react";
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

const shorten = (text: string, size = 5) => {
  if (text.length > 20) {
    return `${text.slice(0, size)}...${text.slice(-size)}`
  }
  return text
}

const needsDots = (message: string) => {
  if (message.includes("cancelled") || message.includes("arrived to destination")) {
    return false
  }
  return true
}

export interface DepositAddress {
  address: string
  destinationTag?: number
  memo?: string
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
  const { library: provider } = useActiveWeb3React()

  const transactionGetter = useTransactionGetter;
  const transactionUpdater = useTransactionUpdater();
  let bridgeTransaction = transactionGetter(hash) || {} as TransactionDetails;
  const { methodId, srcChainId, symbol, initialAmount } = bridgeTransaction
  const chainFrom = BridgeChains[srcChainId]
  const address = (bridgeTransaction.shiftStatus || {}).depositAddress || (bridgeTransaction.hopStatus || {}).depositAddress || null
  const shiftNeeded = methodId !== "bch"

  const [statusText, setStatusText] = useState<string | null>("Initializing")
  const [depositAddress, setDepositAddress] = useState<string | null>(address)
  const [memo, setMemo] = useState<string | null>(bridgeTransaction.shiftStatus?.memo)
  const [destinationTag, setDestinationTag] = useState<number | null>(bridgeTransaction.shiftStatus.destinationTag)
  const [sideShiftOrderId, setSideShiftOrderId] = useState<string | null>(bridgeTransaction.shiftStatus?.orderId)
  const [bchTransactionId, setBchTransactionId] = useState<string | null>(bridgeTransaction.hopStatus?.bchTxId)
  const [sbchTransactionId, setSbchTransactionId] = useState<string | null>(bridgeTransaction.hopStatus?.sbchTxId)

  const hopProcess = bridgeTransaction.hopStatus.direction === HopDirection.in ?
    HopInProcess.fromObject({...bridgeTransaction.hopStatus}, provider) :
    HopOutProcess.fromObject({...bridgeTransaction.hopStatus}, provider)

  const shiftProcess = bridgeTransaction.hopStatus.direction === HopDirection.in ?
    ShiftInProcess.fromObject({...bridgeTransaction.shiftStatus}) :
    ShiftOutProcess.fromObject({...bridgeTransaction.shiftStatus})

  useEffect(() => {
    const stateMachine = async () => {
      if (isOpen) {
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
                setStatusText(i18n._(t`Bridge process cancelled`))
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
                setStatusText(i18n._(t`Bridge process cancelled`))
                break;
            }
          }
//#endregion hop.cash state machine
        } catch (error) {
          shiftProcess.cancel(error.message)
          hopProcess.cancel(error.message)
          // process ui updates
          await stateMachine()
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
          transactionUpdater(bridgeTransaction)
        }
      }
    };
    stateMachine();
  }, [isOpen]);

  const onClose = () => {
    clearTimeout(window.smTimeout)
    isOpen = false
    onDismiss()
  }

  return (
  <>
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Bridge ${symbol}`)} onClose={onClose} />
        <Typography variant="sm" className="font-medium">
          {i18n._(t`Sending ${formatNumber(initialAmount)} ${symbol} from ${chainFrom?.name} network`)}
        </Typography>

        {depositAddress && (<div>
          <div className="flex items-center justify-center">
            <QRCode size={200}  value={depositAddress} includeMargin={true} />
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
              {i18n._(t`BCH cross-chain tx ${shorten(bchTransactionId)}`)} <ExternalLinkIcon width={20} height={20} />
            </a>
          </div>
        </div>)}

        {sbchTransactionId && (<div>
          <div className="flex items-center justify-center">
            <a href={`https://www.smartscan.cash/transaction/${sbchTransactionId}`} target="_blank"
              className="flex flex-row items-center gap-1 font-bold text-baseline text-primary"
            >
              {i18n._(t`SmartBCH cross-chain tx ${shorten(sbchTransactionId)}`)} <ExternalLinkIcon width={20} height={20} />
            </a>
          </div>
        </div>)}

        {statusText && (
          <div className="flex items-center justify-center gap-2">
            {needsDots(statusText) && (<Dots>
              {statusText}
            </Dots>)}
            {!needsDots(statusText) && (<div>{statusText}</div>)}
            {hopProcess.stage === HopStage.settled &&
              (!shiftNeeded || (shiftNeeded && shiftProcess.stage === ShiftStage.settled))
              && (<CheckCircle className="text-2xl text-green" />)}
          </div>
        )}
        {hopProcess.errorMessage && (
          <div className="flex items-center justify-center text-sm text-blue">
            {hopProcess.errorMessage}
          </div>
        )}
      </div>
    </Modal>
  </>
  );
}
