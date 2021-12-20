import { i18n } from "@lingui/core";
import { t } from "@lingui/macro";
import { Currency } from "@mistswapdex/sdk";
import React,{Component, useEffect, useState} from "react";
import ReactDOM from "react-dom";
import { Loader } from "react-feather";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import ModalHeader from "../../components/ModalHeader";
import { AutoRow } from "../../components/Row";
import Typography from "../../components/Typography";
import { formatNumber } from "../../functions";
import { Chain, DEFAULT_CHAIN_FROM, DEFAULT_CHAIN_TO } from "../../pages/bridge";

import QRCode from "qrcode.react";
import { HopDirection, hopInRefresh, HopStage, HopStatus, initHopWallet, showCCTransLogs } from "../../services/hop.cash";
import { useActiveWeb3React } from "../../hooks";
import { ShiftStage, ShiftStatus, xaiOrder, xaiStatus } from "../../services/sideshift.ai";
import Dots from "../../components/Dots";
import Copy from "../../components/AccountDetails/Copy";

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
  isOpen: boolean;
  onDismiss: () => void;
  currency0?: Currency;
  currencyAmount?: string;
  chainFrom?: Chain;
  chainTo?: Chain;
  methodId?: string;
}

export default function BridgeModal({
  isOpen,
  onDismiss,
  currency0,
  currencyAmount,
  chainFrom,
  chainTo,
  methodId
}: BridgeModalProps) {
  const [statusText, setStatusText] = useState<string | null>("Initializing")

  const address = (window.shiftStatus || {}).depositAddress || (window.hopStatus || {}).depositAddress || null
  const [depositAddress, setDepositAddress] = useState<string | null>(address)
  const [memo, setMemo] = useState<string | null>(null)
  const [destinationTag, setDestinationTag] = useState<number | null>(null)
  const [sideShiftOrderId, setSideShiftOrderId] = useState<string | null>(null)

  const [bchTransactionId, setBchTransactionId] = useState<string | null>(null)
  const [sbchTransactionId, setSbchTransactionId] = useState<string | null>(null)

  const bridgeDirectionIn = chainFrom === DEFAULT_CHAIN_FROM && chainTo === DEFAULT_CHAIN_TO
  const bridgeDirectionOut = chainFrom === DEFAULT_CHAIN_TO && chainTo === DEFAULT_CHAIN_FROM

  const shiftNeeded = !(chainFrom === DEFAULT_CHAIN_FROM && chainTo === DEFAULT_CHAIN_TO)
  const hopDirection = (chainTo === DEFAULT_CHAIN_TO) ? HopDirection.in : HopDirection.out

  const { library: provider } = useActiveWeb3React()

  useEffect(() => {
    const stateMachine = async () => {
      if (isOpen) {
        // hop.cash state machine
        const hopStatus: HopStatus = {...(window.hopStatus || {})} as HopStatus
        const shiftStatus: ShiftStatus = {...(window.shiftStatus || {})} as ShiftStatus
        switch (hopStatus.stage) {
          case undefined:
          case HopStage.init:
            const {cashAddr, fromBlock} = await initHopWallet(provider)
            // sideshift.ai state machine
            if (!shiftNeeded) {
              setDepositAddress(cashAddr)
            }
            break;
          case HopStage.deposit:
            // sideshift.ai state machine
            if (shiftNeeded) {
              switch (shiftStatus.stage) {
                case undefined:
                case ShiftStage.init:
                  const cashAddr = hopStatus.depositAddress;
                  const order = await xaiOrder(methodId, "bch", cashAddr);
                  setDepositAddress(order.depositAddress.address)
                  if (order.depositAddress.memo) setMemo(order.depositAddress.memo);
                  if (order.depositAddress.destinationTag )setDestinationTag(order.depositAddress.destinationTag)
                  setSideShiftOrderId(order.orderId)
                  break;
                case ShiftStage.deposit:
                  setStatusText("Waiting for deposit");
                  break;
                case ShiftStage.confirmation:
                  setStatusText(`Waiting for ${currency0?.symbol} confirmations`);
                  setDepositAddress(null)
                  break;
                case ShiftStage.settled:
                  // transition to hop cash is automatic
                  break;
              }
              if (shiftStatus.stage == ShiftStage.deposit || shiftStatus.stage == ShiftStage.confirmation) {
                // update order status and advance the state
                await xaiStatus(shiftStatus.orderId);
              }
            } else {
              setStatusText("Waiting for deposit");
            }

            await hopInRefresh(provider)
            break;
          case HopStage.sent:
            const signer = provider.getSigner();
            const ccTargetAddr = await signer.getAddress();
            await showCCTransLogs("", provider, ccTargetAddr, hopStatus.fromBlock)
            setDepositAddress(null)
            setBchTransactionId(hopStatus.bchTxId);
            setStatusText("Funds sent to the cross-chain bridge");
            break;
          case HopStage.settled:
            setSbchTransactionId(hopStatus.sbchTxId);
            setStatusText("Funds arrived to destination");
            break;
          case HopStage.cancelled:
            setStatusText("Bridge process cancelled");
            window.hopStatus = undefined
            break;
        }

        if (hopStatus.stage != HopStage.settled && hopStatus.stage != HopStage.cancelled) {
          setTimeout(stateMachine, 1000);
        }
      }
    };
    stateMachine();
  }, [isOpen]);

  return (
  <>
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Bridge ${currency0?.symbol}`)} onClose={onDismiss} />
        <Typography variant="sm" className="font-medium">
          {i18n._(t`Sending ${formatNumber(currencyAmount)} ${currency0?.symbol} from ${chainFrom?.name} network`)}
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
              Your XLM deposit must contain the memo: "{memo}", otherwise the deposit might be lost
            </Typography>
          </div>
        )}
        {destinationTag && (
          <div className="flex items-center justify-center">
            <Typography className="font-medium" variant="sm">
              Your XRP deposit must contain the Destination Tag: "{destinationTag}", otherwise the deposit will be rejected by the network
            </Typography>
          </div>
        )}

        {sideShiftOrderId && (<div>
          <div className="flex items-center justify-center">
            <a href={`https://sideshift.ai/orders/${sideShiftOrderId}`} target="_blank"
              className="font-bold text-baseline text-primary"
            >
              sideshift.ai order {sideShiftOrderId} 🔗
            </a>
          </div>
        </div>)}

        {bchTransactionId && (<div>
          <div className="flex items-center justify-center">
            <a href={`https://blockchair.com/bitcoin-cash/transaction/${bchTransactionId}`} target="_blank"
              className="font-bold text-baseline text-primary"
            >
              BCH cross-chain tx {shorten(bchTransactionId)} 🔗
            </a>
          </div>
        </div>)}

        {sbchTransactionId && (<div>
          <div className="flex items-center justify-center">
            <a href={`https://www.smartscan.cash/transaction/${sbchTransactionId}`} target="_blank"
              className="font-bold text-baseline text-primary"
            >
              SmartBCH cross-chain tx {shorten(sbchTransactionId)} 🔗
            </a>
          </div>
        </div>)}

        {statusText && (
          <div className="flex items-center justify-center">
            {needsDots(statusText) && (<Dots>
              {statusText}
            </Dots>)}
            {!needsDots(statusText) && (<div>{statusText}</div>)}
          </div>
        )}
      </div>
    </Modal>
  </>
  );
}
