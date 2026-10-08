import { isAddress, type Address } from "viem";
import { mainnetFactoryAddress } from "./deployments";

const optionalAddress = (value?: string) => value && isAddress(value) ? value : undefined;

export const factoryAddresses: Partial<Record<number, Address>> = {
  677: optionalAddress(process.env.NEXT_PUBLIC_FACTORY_MAINNET_ADDRESS) ?? mainnetFactoryAddress,
};

export const getFactoryAddress = (chainId: number) => factoryAddresses[chainId];
export const defaultDaoAddress = optionalAddress(process.env.NEXT_PUBLIC_DEFAULT_DAO_MAINNET_ADDRESS);

export const factoryAbi = [
  { type: "function", name: "createDAO", stateMutability: "payable", inputs: [{ name: "name", type: "string" }, { name: "initialMembers", type: "address[]" }, { name: "votingPeriod", type: "uint64" }], outputs: [{ name: "dao", type: "address" }] },
  { type: "function", name: "getDAOsByCreator", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "address[]" }] },
  { type: "event", name: "DAOCreated", anonymous: false, inputs: [{ indexed: true, name: "dao", type: "address" }, { indexed: true, name: "creator", type: "address" }, { indexed: false, name: "name", type: "string" }, { indexed: false, name: "votingPeriod", type: "uint64" }] },
] as const;

export const pocketDaoAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "creator", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "memberCount", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "proposalCount", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approvalThreshold", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "treasuryBalance", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "getMembers", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { type: "function", name: "isMember", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "hasVoted", stateMutability: "view", inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "getProposal", stateMutability: "view", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }, { name: "deadline", type: "uint64" }, { name: "yesVotes", type: "uint32" }, { name: "noVotes", type: "uint32" }, { name: "requiredYesVotes", type: "uint256" }, { name: "executed", type: "bool" }, { name: "description", type: "string" }] }] },
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "addMember", stateMutability: "nonpayable", inputs: [{ name: "account", type: "address" }], outputs: [] },
  { type: "function", name: "createProposal", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }, { name: "description", type: "string" }], outputs: [{ name: "proposalId", type: "uint256" }] },
  { type: "function", name: "vote", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "bool" }], outputs: [] },
  { type: "function", name: "execute", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [] },
] as const;

export type Proposal = readonly [Address, bigint, bigint, number, number, bigint, boolean, string];
