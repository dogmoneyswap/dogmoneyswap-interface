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

export async function xaiQuote(from: string = "bch") {
  const response = await fetch(`https://sideshift.ai/api/pairs/${from}/bch`, {
    method: 'GET',
    redirect: 'follow'
  });
  return await response.json();
}

export async function xaiOrder(from = "bch", to = "bch", hopDepositAddress: string) {
  window.shiftStatus = { direction: ShiftDirection.in, stage: ShiftStage.init } as ShiftStatus
	const body = {
			"type": "variable",
			"depositMethodId": from,
			"settleMethodId": to,
			"settleAddress": hopDepositAddress,
			// "memo": "12345654565",
			// "destinationTag": "3454354"
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
