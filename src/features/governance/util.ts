import millify from "millify"

export const VOTING_API_URL = "https://vote.mistswap.fi"
// export const VOTING_API_URL = "http://localhost:3001"

export const formatXmist = (amount: string) => {
  return millify(parseInt(amount.slice(0, -18) || "0"))
}

export const castVote = async ({proposal, index, cache, mutate, library, account}) => {
  if (index == undefined) {
    alert(`Select an option to vote for`);
    return;
  }

  if (proposal.userVotingPower == "0") {
    alert(`You already have voted or do not have voting power at block height ${proposal.snapshotBlock}`);
    return;
  }

  const signature = await library.getSigner().signMessage(`I am casting vote for ${proposal.proposalId} with choice ${index}`);

  const body = JSON.stringify({
    sig: signature,
    proposalId: proposal.proposalId,
    choiceId: index,
    address: account
  });

  const response = await fetch(`${VOTING_API_URL}/vote`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const json = await response.json()
  if (json.error) alert(json.error);

  const mutateAll = (key) => {
    const mutations = [...cache.keys()].filter(val => val.indexOf(key) !== -1).map((key) => mutate(key))
    return Promise.all(mutations)
  }
  mutateAll(VOTING_API_URL);
}