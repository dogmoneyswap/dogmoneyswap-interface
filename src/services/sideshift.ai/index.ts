const literal = <L extends string>(l: L): L => l;

// 'in' to sbch; 'out' from sbch
export const ShiftDirection = {
  in: literal("in"),
  out: literal("out")
};
export type ShiftDirection = typeof ShiftDirection[keyof typeof ShiftDirection];

export const ShiftStage = {
  init: literal("init"),
  deposit: literal("deposit"),
  confirmation: literal("confirmation"),
  settled: literal("settled"),
  cancelled: literal("cancelled"),
}
export type ShiftStage = typeof ShiftStage[keyof typeof ShiftStage];

export interface ShiftStatus {
  methodId: string
  memo: string
  destinationTag: number
  direction: ShiftDirection
  stage: ShiftStage
  depositAddress: string
  orderId: string
  createdAt: string
  errorMessage: string
  destinationAddress: string
}

export class ShiftProcess implements ShiftStatus {
  methodId: string
  memo: string
  destinationTag: number
  direction: ShiftDirection
  stage: ShiftStage
  depositAddress: string
  orderId: string
  createdAt: string
  errorMessage: string
  destinationAddress: string

  static fromObject(object: ShiftStatus): ShiftProcess {
    const process = new this();

    process.methodId = object.methodId;
    process.memo = object.memo;
    process.destinationTag = object.destinationTag;
    process.direction = object.direction;
    process.stage = object.stage;
    process.depositAddress = object.depositAddress;
    process.orderId = object.orderId;
    process.createdAt = object.createdAt;
    process.errorMessage = object.errorMessage;
    process.destinationAddress = object.destinationAddress;

    return process;
  }

  toObject(): ShiftProcess {
    const copy = {...this};
    return copy;
  }

  cancel(message: string) {
		this.stage = ShiftStage.cancelled;
    this.errorMessage = message;
  }

  async init() {
    this.stage = ShiftStage.deposit;
  }

  async checkDeposit() {
    this.stage = ShiftStage.confirmation;
  }

  async checkArrival() {
    this.stage = ShiftStage.settled;
  }

	async work() {
    switch (this.stage) {
      case undefined:
      case ShiftStage.init:
        await this.init();
        break;
      case ShiftStage.deposit:
        await this.checkDeposit();
        break;
      case ShiftStage.confirmation:
        await this.checkArrival();
        break;
    }
  }
}

export class ShiftInProcess extends ShiftProcess {
  async init(): Promise<void> {
    const order = await xaiOrder(this.methodId, "bch", this.destinationAddress);

    this.depositAddress = order.depositAddress.address;
    if (order.depositAddress.memo) this.memo = order.depositAddress.memo;
    if (order.depositAddress.destinationTag) this.destinationTag = order.depositAddress.destinationTag;
    this.orderId = order.orderId;

    this.stage = ShiftStage.deposit;
  }

  async checkDeposit() {
    const status = await xaiStatus(this.orderId);

    if (status.deposits.length) {
      if (status.deposits.some(val => val.status == "pending")) {
        this.stage = ShiftStage.confirmation;
      }
    }
  }

  async checkArrival() {
    const status = await xaiStatus(this.orderId);

    if (status.deposits.length) {
      if (status.deposits.every(val => val.status == "settled")) {
        this.stage = ShiftStage.settled;
      }
    }
  }
}

export class ShiftOutProcess extends ShiftInProcess {
  async init(): Promise<void> {
    const order = await xaiOrder("bch", this.methodId, this.destinationAddress);

    this.depositAddress = order.depositAddress.address;
    if (order.depositAddress.memo) this.memo = order.depositAddress.memo;
    if (order.depositAddress.destinationTag) this.destinationTag = order.depositAddress.destinationTag;
    this.orderId = order.orderId;

    this.stage = ShiftStage.deposit;
  }
}

async function checkResponse(response) {
  if (response.ok === false) {
    const json = await response.json();
    throw Error(json.error.message);
  }

  return response;
}

// checks if the user has the permissions to create orders
// most notable, US is blocked
// see https://help.sideshift.ai/en/articles/2874595-why-am-i-blocked-from-using-sideshift-ai
export async function xaiGetPermissions(): Promise<boolean> {
  const response = await fetch("https://sideshift.ai/api/v1/permissions", {
    method: 'GET',
    redirect: 'follow'
  });

  const json = await response.json();
  if (json.createOrder && json.createQuote) {
    return true;
  }

  return false;
}

// get sideshift.ai quote for a conversion
// returned are min and max amounts, conversion rate and fee in USD
export async function xaiQuote(from: string = "bch", to: string = "bch") {
  const response = await fetch(`https://sideshift.ai/api/pairs/${from}/${to}`, {
    method: 'GET',
    redirect: 'follow'
  });
  return await (await checkResponse(response)).json();
}

// create a sideshift.ai order
export async function xaiOrder(from = "bch", to = "bch", destinationAddress: string) {
	const body = {
			"type": "variable",
			"depositMethodId": from,
			"settleMethodId": to,
			"settleAddress": destinationAddress,
			// "memo": "12345654565", // only for bch to XLM shifts
			// "destinationTag": "3454354", // only for bch to XRP shifts
			"affiliateId": "7DfBJo3oC", // change this
			// "refundAddress": "we omit it here, user will be able to set it on sideshift"
	}

	const myHeaders = new Headers();
	myHeaders.append("Content-Type", "application/json");

	const requestOptions: RequestInit = {
		method: 'POST',
		headers: myHeaders,
		body: JSON.stringify(body),
		redirect: 'follow'
	};

	const response = await fetch("https://sideshift.ai/api/orders", requestOptions);
	return await (await checkResponse(response)).json();
}

// get order status and advance the order state machine
export async function xaiStatus(orderId: string) {
	const response = await fetch(`https://sideshift.ai/api/orders/${orderId}`, {
		method: 'GET',
		redirect: 'follow'
	});
	return await (await checkResponse(response)).json();
}
