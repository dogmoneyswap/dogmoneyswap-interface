export async function xaiQuote(from: string = "bch") {
  const response = await fetch(`https://sideshift.ai/api/pairs/${from}/bch`, {
    method: 'GET',
    redirect: 'follow'
  });
  return await response.json();
}

export async function xaiOrder(from = "bch", hopDepositAddress: string) {
	const body = {
			"type": "variable",
			"depositMethodId": from,
			"settleMethodId": "bch",
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
	return await response.json();
}

export async function xaiStatus(orderId: string) {
	const response = await fetch(`https://sideshift.ai/api/orders/${orderId}`, {
		method: 'GET',
		redirect: 'follow'
	});
	return await response.json();
}