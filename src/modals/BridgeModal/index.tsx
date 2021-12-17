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
import Image from 'next/image'

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

  // const [swapInfo, setSwapInfo] = useState<string | null>("kek")
  // setSwapInfo("asdf")

  // useEffect(() =>{
  //   new QRious({element: document.getElementById("cashAddrQR"), value: swapInfo});
  // }, [swapInfo])

  const [swapInfo, setSwapInfo] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !swapInfo) {
      Wallet.newRandom().then(wallet => setSwapInfo(wallet.getDepositQr().src))
    }
  }, [isOpen, swapInfo]);

  return (
  <>
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <div className="space-y-4">
        <ModalHeader title={i18n._(t`Bridge Kek ${currency0?.symbol}`)} onClose={onDismiss} />
        <canvas id="cashAddrQR"></canvas>
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
        {/* {swapInfo && (<Image src={swapInfo} alt={"asdf"} width={200} height={200} />)} */}
      </div>
    </Modal>
  </>
  );
}
