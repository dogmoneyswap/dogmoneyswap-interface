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
import { Chain } from "../../pages/bridge";

import QRCode from "qrcode.react";
import { hopInRefresh, HopStage, HopStatus, initHopWallet, showCCTransLogs } from "../../services/hop.cash";
import { useActiveWeb3React } from "../../hooks";

interface BridgeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  currency0?: Currency;
  currencyAmount?: string;
  chainFrom?: Chain;
  chainTo?: Chain;
}

export default function BridgeModal({
  isOpen,
  onDismiss,
  currency0,
  currencyAmount,
  chainFrom,
  chainTo,
}: BridgeModalProps) {

  const [depositAddress, setDepositAddress] = useState<string | null>(null)

  const { library: provider } = useActiveWeb3React()

  const [hopStage, setHopStage] = useState((window.hopStatus || {}).stage);

  useEffect(() => {
    const stateMachine = async () => {
      if (isOpen) {
        // const {cashAddr, fromBlock} = await initHopWallet(provider)
        // setDepositAddress(cashAddr)

        // hop cash state machine
        const hopStatus: HopStatus = window.hopStatus || {}
        switch (hopStatus.stage) {
          case undefined:
          case "unknown":
          case "init":
            // transition to deposit
            const {cashAddr, fromBlock} = await initHopWallet(provider)
            setDepositAddress(cashAddr)
            // window.hopStatus.stage = HopStage.deposit
            break;
          case "deposit":
            // waiting for deposit
            await hopInRefresh(provider)
            break;
          case "sent":
            const signer = provider.getSigner();
            const ccTargetAddr = await signer.getAddress();
            await showCCTransLogs("", provider, ccTargetAddr, hopStatus.fromBlock)
            break;
          case "settled":
            // update ui
            break;
        }

        setHopStage(hopStatus.stage)

        if (hopStatus.stage != HopStage.settled) {
          setTimeout(stateMachine, 1000);
        }

      } else {
        setDepositAddress(null)
      }
    };
    stateMachine();
  }, [isOpen]);

  useEffect(() => {
    console.log(hopStage, window.hopStatus)
  }, [hopStage])

  return (
  <>
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Bridge Kek ${currency0?.symbol}`)} onClose={onDismiss} />
        <Typography variant="sm" className="font-medium">
          {i18n._(t`You are sending ${formatNumber(currencyAmount)} ${currency0?.symbol} from ${chainFrom?.name}`)}
        </Typography>
        <Typography variant="sm" className="font-medium">
          {i18n._(t`You will receive ${/*formatNumber(getAmountToReceive())*/0} ${currency0?.symbol} on ${chainTo?.name}`)}
        </Typography>

        <Button color="gradient" size="lg" disabled={false /*pendingTx*/} onClick={() => {} /*bridgeToken()*/}>
          <Typography variant="lg">
            {/* {pendingTx ? (
              <div className={'p-2'}>
                <AutoRow gap="6px" justify="center">
                  {buttonText} <Loader stroke="white" />
                </AutoRow>
              </div>
            ) : (
              i18n._(t`Bridge ${currency0?.symbol}`)
            )} */}
          </Typography>
        </Button>
        <div className="flex items-center justify-center">
          <Typography className="font-medium" variant="sm">
            {hopStage}
          </Typography>
        </div>
        {/* {swapInfo && (<Image src={swapInfo} alt={"asdf"} width={200} height={200} />)} */}
        {depositAddress && (<div>
          <div className="flex items-center justify-center">
            <QRCode size={200}  value={depositAddress} includeMargin={true} />
          </div>
          <div className="flex items-center justify-center">
            <Typography className="font-medium" variant="sm">
              {depositAddress}
            </Typography>
          </div>
        </div>)}
      </div>
    </Modal>
  </>
  );
}
