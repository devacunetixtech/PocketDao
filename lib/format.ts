import { formatEther } from "viem";

export function shortenAddress(value: string, lead = 6) {
  return `${value.slice(0, lead)}…${value.slice(-4)}`;
}

export function formatBot(value?: bigint, maximumFractionDigits = 2) {
  if (value === undefined) return "0.00";
  return Number(formatEther(value)).toLocaleString(undefined, { maximumFractionDigits, minimumFractionDigits: 2 });
}

export function timeLeft(deadline: bigint, currentTime: number) {
  const difference = Number(deadline) * 1000 - currentTime;
  if (difference <= 0) return "Voting closed";
  const hours = Math.ceil(difference / 3_600_000);
  return hours > 24 ? `${Math.ceil(hours / 24)}d left` : `${hours}h left`;
}
