import millify from "millify"

// export const VOTING_API_URL = "https://vote.mistswap.fi"
export const VOTING_API_URL = "http://localhost:3001"

export const formatXmist = (amount: string) => {
  return millify(parseInt(amount.slice(0, -18) || "0"))
}