const literal = <L extends string>(l: L): L => l;

// 'in' to sbch; 'out' from sbch
export const ShiftDirection = {
  in: literal("in"),
  out: literal("out")
};
export type ShiftDirection = typeof ShiftDirection[keyof typeof ShiftDirection];

export const ShiftStage = {
  unknown: literal("unknown"),
  init: literal("init"),
  deposit: literal("deposit"),
  confirmation: literal("confirmation"),
  settled: literal("settled"),
}
export type ShiftStage = typeof ShiftStage[keyof typeof ShiftStage];

export interface ShiftStatus {
  depositAddress: string;
  direction: ShiftDirection
  orderId: string
  createdAt: string
  stage: ShiftStage
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
  return await response.json();
}

// create a sideshift.ai order
export async function xaiOrder(from = "bch", to = "bch", hopDepositAddress: string) {
  window.shiftStatus = { direction: ShiftDirection.in, stage: ShiftStage.init } as ShiftStatus
	const body = {
			"type": "variable",
			"depositMethodId": from,
			"settleMethodId": to,
			"settleAddress": hopDepositAddress,
			// "memo": "12345654565", // only for XLM
			// "destinationTag": "3454354", // only for XRP
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
	const json = await response.json();

  if (json.orderId) {
    window.shiftStatus.stage = ShiftStage.deposit;
    window.shiftStatus.orderId = json.orderId;
    window.shiftStatus.depositAddress = json.depositAddress.address;
  }

  return json;
}

// get order status and advance the order state machine
export async function xaiStatus(orderId: string) {
	const response = await fetch(`https://sideshift.ai/api/orders/${orderId}`, {
		method: 'GET',
		redirect: 'follow'
	});
	const json = await response.json();

  if (json.deposits.length) {
    if (json.deposits.some(val => val.status == "pending")) {
      window.shiftStatus.stage = ShiftStage.confirmation;
    } else if (json.deposits.every(val => val.status == "settled")) {
      window.shiftStatus.stage = ShiftStage.settled;
    }
  }
}
