const includesAny = (value: string, phrases: string[]) => phrases.some((phrase) => value.includes(phrase));

export function friendlyWalletError(error: unknown) {
  const raw = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  const message = raw.toLowerCase();

  if (includesAny(message, ["user rejected", "user denied", "rejected the request", "request rejected"])) return "You cancelled the request in your wallet.";
  if (includesAny(message, ["insufficient funds", "exceeds the balance"])) return "Your wallet does not have enough BOT for this transaction and its network fee.";
  if (includesAny(message, ["alreadyvoted", "already voted"])) return "This wallet has already voted on this proposal.";
  if (includesAny(message, ["votingclosed", "voting closed"])) return "Voting for this proposal has already closed.";
  if (includesAny(message, ["votingstillopen", "voting still open"])) return "This proposal cannot be executed until voting closes.";
  if (includesAny(message, ["alreadyexecuted", "already executed"])) return "This proposal has already been executed.";
  if (includesAny(message, ["proposalrejected", "proposal rejected"])) return "This proposal did not receive enough YES votes.";
  if (includesAny(message, ["insufficienttreasury", "insufficient treasury"])) return "The treasury does not have enough BOT for this payment.";
  if (includesAny(message, ["creatoronly", "creator only"])) return "Only the DAO creator can add a member.";
  if (includesAny(message, ["memberonly", "member only"])) return "Only DAO members can perform this action.";
  if (includesAny(message, ["alreadymember", "already member"])) return "That wallet is already a member of this DAO.";
  if (includesAny(message, ["invalidmember", "invalid member", "invalidrecipient", "invalid recipient"])) return "Please enter a valid wallet address.";
  if (includesAny(message, ["connector not connected", "provider not found", "no provider"])) return "Your wallet is not available. Unlock it and try again.";
  if (includesAny(message, ["chain mismatch", "switch chain", "unsupported chain"])) return "Switch your wallet to BOT Chain and try again.";
  if (includesAny(message, ["timeout", "timed out"])) return "The network is taking too long to respond. Please try again.";
  if (includesAny(message, ["network", "failed to fetch", "rpc request"])) return "BOT Chain could not be reached. Check your connection and try again.";
  if (includesAny(message, ["execution reverted", "contract function execution error", "transaction execution error"])) return "The transaction could not be completed with the current DAO state.";

  return "Something went wrong while talking to your wallet. Please try again.";
}
