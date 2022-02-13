import { BigNumber } from "@ethersproject/bignumber"
import { arrayify, hexlify, hexZeroPad } from "@ethersproject/bytes";
import { id } from "@ethersproject/hash";
import { Web3Provider } from "@ethersproject/providers";
import { toUtf8Bytes } from "@ethersproject/strings";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { randomBytes } from "crypto";
import { sha256 } from "ethers/utils/sha2";
import bchaddr from "bchaddrjs";
import hex2wif from "./hex2wif";
import { Wallet, WatchWallet } from "mainnet-js";

// The smart contract CrossChainTransfer's deployed address
const CCTransAddress = "0xBAe8Af26E08D3332C7163462538B82F0CBe45f2a"
// The incoming account's address on BCH main chain
const IncomeAddrOnBCH = "bitcoincash:qqa0dj5rwaw2s4tz88m3xmcpjyzry356gglq7zvu80"
// The outgoing account's address on BCH main chain
const PoolAddrOnBCH = "bitcoincash:qzteyuny2hdvvcd4tu6dktwx9f04jarzkyt57qel0y"
// The incoming account's address on smartBCH side chain
const IncomeAddrOnSmartBCH = "0x3207d65b4D45CF617253467625AF6C1b687F720b"
// The outgoing account's address on smartBCH side chain
const PoolAddrOnSmartBCH = "0xa659c0434399a8D0e15b8286b39f8d97830F8F91"

const literal = <L extends string>(l: L): L => l;

// 'in' to sbch; 'out' from sbch
export const HopDirection = {
  in: literal("in"),
  out: literal("out")
};
export type HopDirection = typeof HopDirection[keyof typeof HopDirection];

export const HopStage = {
  init: literal("init"),
  deposit: literal("deposit"),
  sent: literal("sent"),
  settled: literal("settled"),
	cancelled: literal("cancelled")
}
export type HopStage = typeof HopStage[keyof typeof HopStage];

export interface HopStatus {
  direction: HopDirection
  stage: HopStage
  bchTxId: string
  sbchTxId: string
  bchAmount: string
  sbchAmount: string
  fromBlock: number
  depositAddress: string
  destinationAddress: string
  errorMessage: string
}

export class HopProcess implements HopStatus {
  direction: HopDirection
  stage: HopStage
  bchTxId: string
  sbchTxId: string
  bchAmount: string
  sbchAmount: string
  fromBlock: number
  depositAddress: string
  destinationAddress: string
  errorMessage: string

  provider: Web3Provider // provider with signer
  networkProvider: Web3Provider // provider without signer capabilities

  static fromObject(object: HopStatus, provider: Web3Provider, networkProvider?: Web3Provider): HopProcess {
    const process = new this();

    process.direction = object.direction;
    process.stage = object.stage;
    process.bchTxId = object.bchTxId;
    process.sbchTxId = object.sbchTxId;
    process.bchAmount = object.bchAmount;
    process.sbchAmount = object.sbchAmount;
    process.fromBlock = object.fromBlock;
    process.depositAddress = object.depositAddress;
    process.destinationAddress = object.destinationAddress;
    process.errorMessage = object.errorMessage;
    process.provider = provider;
    process.networkProvider = networkProvider || provider

    return process;
  }

  toObject(): HopProcess {
    const copy = {...this};
    delete copy.provider;
    delete copy.networkProvider;
    return copy;
  }

  cancel(message: string) {
		this.stage = HopStage.cancelled;
    this.errorMessage = message;
  }

  async init() {
    this.stage = HopStage.deposit;
  }

  async checkDeposit() {
    this.stage = HopStage.sent
  }

  async checkArrival() {
    this.stage = HopStage.settled
  }

	async work() {
    switch (this.stage) {
      case undefined:
      case HopStage.init:
        await this.init();
        break;
      case HopStage.deposit:
        await this.checkDeposit();
        break;
      case HopStage.sent:
        await this.checkArrival();
        break;
    }
  }
}

export class HopInProcess extends HopProcess {
  hopwallet: any;

  constructor() {
    super();
    this.direction = HopDirection.in;
  }

  toObject() {
    const copy = super.toObject() as HopInProcess;
    delete copy.hopwallet;
    return copy;
  }

  private async getHopWallet(provider: Web3Provider) {
    const signer = provider.getSigner();
    const myAddr = await signer.getAddress();

    if (!window.hopwallet || (window.hopwallet && window.hopwallet.myAddr !== myAddr)) {
      // throws upon cancellation
      const signature = await signer.signMessage(`[Grant-Hop-Wallet]【授权Hop钱包】\n${myAddr}\nI hereby grant this website the permission to access my Hop-Wallet for above address.\n我郑重授权此网站访问以上地址的Hop钱包。`);
      let privKey = BigNumber.from(sha256(signature));
      const prime = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140");
      privKey = privKey.mod(prime);
      const wif = hex2wif(privKey.toHexString().substr(2));
      window.hopwallet = await Wallet.fromWIF(wif);
      window.hopwallet.myAddr = myAddr;
    }

    return window.hopwallet;
  }

  async init() {
    this.stage = HopStage.init;

    if (!this.provider) {
      this.cancel("Web3 provider not initialized");
      return;
    }

    if (!this.destinationAddress) {
      this.cancel("Destination address not set");
      return;
    }

    try {
      this.hopwallet = await this.getHopWallet(this.provider);
    } catch {
      this.cancel("Rejected by user");
      return;
    }

    // show hop-wallet's address in text and QRCode
    this.depositAddress = this.hopwallet.getDepositAddress();

    // hop-wallet will watch the incoming coins inside the hopInRefresh function
    this.fromBlock = await this.provider.getBlockNumber();
    this.stage = HopStage.deposit;
  }

  async checkDeposit() {
    if (!this.hopwallet) {
      try {
        this.hopwallet = await this.getHopWallet(this.provider);
      } catch {
        this.cancel("Rejected by user");
        return;
      }
    }

    // Check Main Chain
    const maxAmount = await this.hopwallet.getMaxAmountToSend(2);
    const balance = await this.hopwallet.getBalance('sat');
    if(balance >= 1000000/*0.01BCH*/) {
      const amt = maxAmount.sat - 400 // 400 sats margin, for getMaxAmountToSend is not accurate
      const txData = await this.hopwallet.send([
        {dataString: this.destinationAddress}, //first output is just OP_RETURN
        {cashaddr: IncomeAddrOnBCH, value: amt, unit: "sat"}, //second output has BCH
      ]);
      const a = amt/100000000.0;

      this.stage = HopStage.sent
      this.bchTxId = txData.txId
      this.bchAmount = String(a)
    }
  }

  // show the cross-chain transfer logs in a "divId" div
  async checkArrival() {
    // Check Side Chain's Transfer event, because coins are send through SEP206 calls
    const Bridged = id("Bridged(bytes32,address,address,uint256)");
    const myAddrPad32 = hexZeroPad(this.destinationAddress, 32);
    const senderAddrPad32 = hexZeroPad(PoolAddrOnSmartBCH, 32);
    const hopAddr = CCTransAddress;
    const filter = {address: hopAddr, topics: [Bridged, null, senderAddrPad32, myAddrPad32], toBlock: 0, fromBlock: 0};
    filter.toBlock = 10000*10000 // a very large value
    filter.fromBlock = this.fromBlock;
    const logs = await this.networkProvider.getLogs(filter);

    const end = Math.max(0, logs.length-20) // at most 20 entries
    let amount;
    for(let i=logs.length-1; i>=end; i--) {
      const h = logs[i].blockNumber
      amount = formatUnits(logs[i].data);

      this.stage = HopStage.settled
      this.sbchTxId = logs[i].transactionHash
      this.sbchAmount = amount
      this.fromBlock = h + 1;
      break;
    }
  }
}

export class HopOutProcess extends HopProcess {
  recipientWallet: any;
  lastSeenBalance: any;

  constructor() {
    super();
    this.direction = HopDirection.out;
  }

  toObject() {
    const copy = super.toObject() as HopOutProcess;
    delete copy.recipientWallet;
    return copy;
  }

  private async initRecipientWallet() {
    this.recipientWallet = await WatchWallet.fromCashaddr(this.destinationAddress);
    this.lastSeenBalance = await this.recipientWallet.getBalance("sat");
  }

  async init() {
    if (!this.provider) {
      this.cancel("Web3 provider not initialized");
      return;
    }

    if (!this.destinationAddress) {
      this.cancel("Deposit address on BCH main chain was not provided");
      return;
    }

    this.stage = HopStage.init;

    if (bchaddr.isLegacyAddress(this.destinationAddress)) {
      this.cancel(`Legacy bitcoin addresses are not supported. Please ensure you are sending to a bitcoincash address.`);
      return;
    }

    if(!bchaddr.isValidAddress(this.destinationAddress) || bchaddr.isBitpayAddress(this.destinationAddress)) {
      this.cancel(`Invalid address for BCH main chain: ${this.destinationAddress}`);
      return;
    }

    if(this.provider.network.chainId != 10000) {
      this.cancel("You are not in smartBCH network.");
      return;
    }

    const signer = this.provider.getSigner();
    const balance256 = await this.provider.getBalance(await signer.getAddress())
    const balance = parseFloat(formatUnits(balance256)) * 1.0
    var amount = parseFloat(this.sbchAmount) * 1.0
    if(amount <= 0) {
      this.cancel("Please enter valid transfer amount.");
      return;
    }
    var poolBalance: number = await getBchPoolBalance()
    if(poolBalance < amount) {
      this.cancel(`The coins in pool are not enough for this transfer. ${poolBalance} < ${amount}`);
      return;
    }
    if(balance < amount + 0.00005/*estimated gas fee*/) {
      this.cancel(`Your balance (${balance}) is not enough for this transfer.`);
      return;
    }
    if(amount < 0.01) {
      this.cancel(`The minimum amount for cross-chain transfer is 0.01`);
      return;
    }

    //record the recipient's balance before transfer cross-chain coins to it
    await this.initRecipientWallet();

    var fee = Math.max(amount * 0.001, 0.0001);
    amount = amount - fee;
    amount = parseFloat(amount.toFixed(8))*1.0;
    this.bchAmount = String(amount);

    this.stage = HopStage.deposit;
  }

  async checkDeposit() {
    try {
      var amount = parseFloat(this.sbchAmount) * 1.0
      const amount256 = parseUnits(amount.toString())
      const txReq = {
        to: IncomeAddrOnSmartBCH,
        value: amount256,
        data: hexlify(toUtf8Bytes(this.destinationAddress)),
        gasPrice: BigNumber.from("0x3e63fa64"), //1.05Gwei
      };

      const signer = this.provider.getSigner();
      const txResp = await signer.sendTransaction(txReq);

      this.sbchTxId = txResp.hash;
      this.stage = HopStage.sent;
    } catch {
      this.cancel("Rejected by user");
      return;
    }
  }

  // show the cross-chain transfer logs in a "divId" div
  async checkArrival() {
    if (!this.recipientWallet) {
      await this.initRecipientWallet();
    }

    const balance = await this.recipientWallet.getBalance("sat");
    if (balance == this.lastSeenBalance) return;
    const b = balance / 100000000.0;
    const lb = this.lastSeenBalance / 100000000.0;
    this.lastSeenBalance = balance;
    var diff = b-lb;
    diff = parseFloat(diff.toFixed(8))*1.0;

    const history = await this.recipientWallet.getHistory();
    this.bchTxId = history.slice(-1)[0].tx_hash;
    this.stage = HopStage.settled;
  }
}



export function randomId() {
	return hexlify(arrayify(randomBytes(10)));
}

export async function getBchPoolBalance(): Promise<number> {
  const bchPoolWallet = await WatchWallet.fromCashaddr(PoolAddrOnBCH);
	return await bchPoolWallet.getBalance("bch") as number;
}

export async function getSmartBchPoolBalance(provider): Promise<string> {
	const balance256 = await provider.getBalance(PoolAddrOnSmartBCH);
	return formatUnits(balance256);
}
