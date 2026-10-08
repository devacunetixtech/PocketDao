"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { useAccount, useChainId, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from "wagmi";
import { Address, Hash, isAddress, parseEther, parseEventLogs } from "viem";
import { ArrowDownToLine, ArrowUpRight, Check, ChevronDown, CircleDollarSign, Clock3, Copy, ExternalLink, Plus, Users, Vote, Wallet } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { ConnectButton } from "./ConnectButton";
import { Modal } from "./Modal";
import { Toast } from "./Toast";
import { TransactionButton } from "./TransactionButton";
import { botchainMainnet } from "@/lib/chains";
import { defaultDaoAddress, factoryAbi, getFactoryAddress, pocketDaoAbi, Proposal } from "@/lib/contracts";
import { formatBot, shortenAddress, timeLeft } from "@/lib/format";
import { friendlyWalletError } from "@/lib/errors";

type ModalName = "create" | "deposit" | "proposal" | "member" | null;

const subscribeToClock = (callback: () => void) => {
  const timer = window.setInterval(callback, 30_000);
  return () => window.clearInterval(timer);
};
const getClockSnapshot = () => Date.now();
const getServerClockSnapshot = () => 0;

function contractConfig(address: Address, functionName: string, args?: readonly unknown[]) {
  return { address, abi: pocketDaoAbi, functionName, ...(args ? { args } : {}) } as const;
}

export function Dashboard() {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [selectedDao, setSelectedDao] = useState<Address | undefined>(defaultDaoAddress || undefined);
  const [manualDao, setManualDao] = useState("");
  const [modal, setModal] = useState<ModalName>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const currentTime = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot);
  const supportedChain = chainId === botchainMainnet.id;
  const factoryAddress = getFactoryAddress(chainId);

  const chooseDao = (value: Address) => {
    setSelectedDao(value);
    window.localStorage.setItem("pocketdao:selected", value);
  };

  const { data: ownedDaos, refetch: refetchOwnedDaos } = useReadContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "getDAOsByCreator",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(factoryAddress && walletAddress && supportedChain), refetchInterval: 12_000, refetchOnWindowFocus: true },
  });

  const overviewContracts = selectedDao ? [
    contractConfig(selectedDao, "name"),
    contractConfig(selectedDao, "creator"),
    contractConfig(selectedDao, "memberCount"),
    contractConfig(selectedDao, "proposalCount"),
    contractConfig(selectedDao, "approvalThreshold"),
    contractConfig(selectedDao, "treasuryBalance"),
    contractConfig(selectedDao, "getMembers"),
    ...(walletAddress ? [contractConfig(selectedDao, "isMember", [walletAddress])] : []),
  ] : [];

  const { data: overview, refetch: refetchOverview, isLoading: overviewLoading } = useReadContracts({
    contracts: overviewContracts,
    query: { enabled: Boolean(selectedDao && supportedChain), refetchInterval: 12_000, refetchOnWindowFocus: true },
  });

  const daoName = overview?.[0]?.result as string | undefined;
  const creator = overview?.[1]?.result as Address | undefined;
  const memberCount = overview?.[2]?.result as bigint | undefined;
  const proposalCount = overview?.[3]?.result as bigint | undefined;
  const threshold = overview?.[4]?.result as bigint | undefined;
  const balance = overview?.[5]?.result as bigint | undefined;
  const members = (overview?.[6]?.result as readonly Address[] | undefined) ?? [];
  const userIsMember = (overview?.[7]?.result as boolean | undefined) ?? false;
  const userIsCreator = creator?.toLowerCase() === walletAddress?.toLowerCase();
  const invalidDao = Boolean(selectedDao && !overviewLoading && overview?.some((result) => result.status === "failure"));

  const proposalContracts = useMemo(() => {
    if (!selectedDao || !proposalCount) return [];
    return Array.from({ length: Number(proposalCount) }, (_, id) => contractConfig(selectedDao, "getProposal", [BigInt(id)]));
  }, [selectedDao, proposalCount]);

  const { data: proposalResults, refetch: refetchProposals } = useReadContracts({
    contracts: proposalContracts,
    query: { enabled: proposalContracts.length > 0, refetchInterval: 12_000, refetchOnWindowFocus: true },
  });

  const voteStatusContracts = useMemo(() => {
    if (!selectedDao || !proposalCount || !walletAddress) return [];
    return Array.from({ length: Number(proposalCount) }, (_, id) => contractConfig(selectedDao, "hasVoted", [BigInt(id), walletAddress]));
  }, [selectedDao, proposalCount, walletAddress]);

  const { data: voteStatusResults, refetch: refetchVoteStatuses } = useReadContracts({
    contracts: voteStatusContracts,
    query: { enabled: voteStatusContracts.length > 0, refetchInterval: 12_000, refetchOnWindowFocus: true },
  });

  const proposals = (proposalResults ?? []).map((result, id) => ({ id, data: result.result as Proposal | undefined })).filter((item): item is { id: number; data: Proposal } => Boolean(item.data)).reverse();

  const transact = async (send: () => Promise<Hash>, successMessage: string) => {
    if (!publicClient) return;
    setPending(true);
    try {
      const hash = await send();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted");
      await Promise.all([refetchOverview(), refetchProposals(), refetchVoteStatuses(), refetchOwnedDaos()]);
      setModal(null);
      setToast(successMessage);
      return receipt;
    } catch (error) {
      setToast(friendlyWalletError(error));
    } finally {
      setPending(false);
    }
  };

  const createDao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const membersInput = String(form.get("members") || "");
    const initialMembers = membersInput.split(/[\s,]+/).filter(Boolean);
    if (!initialMembers.every((member) => isAddress(member))) return setToast("One or more member addresses are invalid.");
    if (!factoryAddress) return setToast("New DAO creation is not active on this network yet.");
    const initialDeposit = String(form.get("initialDeposit") || "").trim();
    const receipt = await transact(() => writeContractAsync({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "createDAO",
      args: [String(form.get("name")), initialMembers as Address[], BigInt(Number(form.get("days")) * 86_400)],
      ...(initialDeposit ? { value: parseEther(initialDeposit) } : {}),
    }), initialDeposit ? "Your funded PocketDAO is live." : "Your PocketDAO is live and ready to fund.");
    if (receipt) {
      const events = parseEventLogs({ abi: factoryAbi, logs: receipt.logs, eventName: "DAOCreated", strict: false });
      const createdDao = events[0]?.args.dao;
      if (createdDao) chooseDao(createdDao);
    }
  };

  const submitAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDao || !modal) return;
    const form = new FormData(event.currentTarget);
    if (modal === "deposit") return transact(() => writeContractAsync({ address: selectedDao, abi: pocketDaoAbi, functionName: "deposit", value: parseEther(String(form.get("amount"))) }), "BOT deposited into the treasury.");
    if (modal === "member") {
      const account = String(form.get("address"));
      if (!isAddress(account)) return setToast("Enter a valid wallet address.");
      return transact(() => writeContractAsync({ address: selectedDao, abi: pocketDaoAbi, functionName: "addMember", args: [account] }), "New member added.");
    }
    const recipient = String(form.get("recipient"));
    if (!isAddress(recipient)) return setToast("Enter a valid recipient address.");
    return transact(() => writeContractAsync({ address: selectedDao, abi: pocketDaoAbi, functionName: "createProposal", args: [recipient, parseEther(String(form.get("amount"))), String(form.get("description"))] }), "Spending proposal created.");
  };

  const voteOnProposal = (id: number, support: boolean) => selectedDao && transact(() => writeContractAsync({ address: selectedDao, abi: pocketDaoAbi, functionName: "vote", args: [BigInt(id), support] }), `Your ${support ? "YES" : "NO"} vote is recorded.`);
  const executeProposal = (id: number) => selectedDao && transact(() => writeContractAsync({ address: selectedDao, abi: pocketDaoAbi, functionName: "execute", args: [BigInt(id)] }), "Approved payment executed.");
  const explorer = botchainMainnet.blockExplorers.default.url;

  return <div className="dashboardPage">
    <DashboardHeader />
    {!isConnected ? <DisconnectedState /> : !supportedChain ? <NetworkState onSwitch={() => switchChain({ chainId: botchainMainnet.id }, { onError: (error) => setToast(friendlyWalletError(error)) })} /> : (
      <main className="dashboardMain">
        <div className="dashboardTitleRow">
          <div><span className="overline">COMMUNITY TREASURY</span><h1>{daoName || (overviewLoading ? "Loading treasury…" : "Choose your PocketDAO")}</h1><p>{selectedDao ? <>Treasury <button className="addressCopy" onClick={() => navigator.clipboard.writeText(selectedDao)}>{shortenAddress(selectedDao, 8)} <Copy size={13} /></button></> : "Create a treasury or open one with its contract address."}</p></div>
          <div className="daoControls">
            {(ownedDaos?.length || selectedDao) ? <label className="daoSelectWrap"><span className="srOnly">Select DAO</span><select value={selectedDao || ""} onChange={(event) => chooseDao(event.target.value as Address)}><option value="">Select DAO</option>{selectedDao && !ownedDaos?.includes(selectedDao) ? <option value={selectedDao}>{daoName || shortenAddress(selectedDao)}</option> : null}{ownedDaos?.map((dao) => <option value={dao} key={dao}>{shortenAddress(dao, 8)}</option>)}</select><ChevronDown size={16} /></label> : null}
            {factoryAddress ? <button className="button buttonPrimary" onClick={() => setModal("create")}><Plus size={17} />Create DAO</button> : null}
          </div>
        </div>

        {!factoryAddress ? <div className="setupBanner"><span><b>DAO creation is not active yet.</b> You can still open an existing PocketDAO contract. New treasury creation will become available after the factory contract is deployed.</span></div> : null}
        {invalidDao ? <InvalidDaoState clear={() => setSelectedDao(undefined)} /> : !selectedDao ? <OpenDaoState manualDao={manualDao} setManualDao={setManualDao} open={() => isAddress(manualDao) ? chooseDao(manualDao) : setToast("Enter a valid PocketDAO contract address.")} create={() => setModal("create")} canCreate={Boolean(factoryAddress)} /> : <>
          <section className="metricGrid">
            <article className="metricCard metricPrimary"><div className="metricIcon"><Wallet /></div><span>Treasury balance</span><strong>{formatBot(balance)} <small>BOT</small></strong><p>Available for approved proposals</p><button className="button buttonLight" onClick={() => setModal("deposit")}><ArrowDownToLine size={16} />Deposit BOT</button></article>
            <article className="metricCard"><div className="metricHead"><span>Members</span><div className="metricIconSmall"><Users /></div></div><strong>{memberCount?.toString() || "0"}</strong><p>{threshold?.toString() || "0"} YES votes needed to approve</p>{userIsCreator ? <button className="textButton" onClick={() => setModal("member")}><Plus size={15} />Add member</button> : <span className="roleLabel">{userIsMember ? "You are a member" : "View only"}</span>}</article>
            <article className="metricCard"><div className="metricHead"><span>Proposals</span><div className="metricIconSmall gold"><Vote /></div></div><strong>{proposalCount?.toString() || "0"}</strong><p>{proposals.filter(({ data }) => !data[6] && Number(data[2]) * 1000 > currentTime).length} currently open for voting</p>{userIsMember ? <button className="textButton" onClick={() => setModal("proposal")}><Plus size={15} />New proposal</button> : <span className="roleLabel">Members can propose</span>}</article>
          </section>

          <div className="contentGrid">
            <section className="panel proposalsPanel" id="proposals">
              <div className="panelHead"><div><span className="overline">DECISIONS</span><h2>Spending proposals</h2></div>{userIsMember ? <button className="button buttonSecondary buttonSmall" onClick={() => setModal("proposal")}><Plus size={16} />New proposal</button> : null}</div>
              {proposals.length ? <div className="proposalList">{proposals.map(({ id, data }) => <ProposalItem key={id} id={id} proposal={data} currentTime={currentTime} pending={pending} explorer={explorer} canVote={userIsMember} hasVoted={Boolean(voteStatusResults?.[id]?.result)} onVote={voteOnProposal} onExecute={executeProposal} />)}</div> : <div className="emptyInline"><span><Vote /></span><h3>No proposals yet</h3><p>The group&apos;s spending decisions will appear here.</p></div>}
            </section>

            <aside className="panel membersPanel" id="members">
              <div className="panelHead"><div><span className="overline">YOUR PEOPLE</span><h2>Members</h2></div>{userIsCreator ? <button className="iconButton" onClick={() => setModal("member")} aria-label="Add member"><Plus /></button> : null}</div>
              <div className="memberList">{members.map((member, index) => <div className="memberRow" key={member}><span className={`memberAvatar avatar${index % 4}`}>{member.slice(2, 4).toUpperCase()}</span><div><b>{member.toLowerCase() === creator?.toLowerCase() ? "Treasury creator" : `Member ${index + 1}`}</b><small>{shortenAddress(member, 7)}</small></div>{member.toLowerCase() === walletAddress?.toLowerCase() ? <span className="youPill">You</span> : null}</div>)}</div>
              <div className="ruleCard"><span><Check /></span><div><b>Simple majority</b><p>{threshold?.toString() || "0"} of {memberCount?.toString() || "0"} members must vote YES before a proposal can execute.</p></div></div>
            </aside>
          </div>
        </>}
        <footer className="dashboardFooter"><span>PocketDAO runs on BOT Chain</span><a href="https://botchain.ai" target="_blank" rel="noreferrer">botchain.ai <ExternalLink size={12} /></a><a href="https://scan.botchain.ai" target="_blank" rel="noreferrer">scan.botchain.ai <ExternalLink size={12} /></a></footer>
      </main>
    )}
    {modal ? <Modal title={modal === "create" ? "Create a PocketDAO" : modal === "deposit" ? "Fund the treasury" : modal === "member" ? "Add a member" : "Create a proposal"} subtitle={modal === "create" ? "Start a transparent shared treasury on BOT Chain." : undefined} onClose={() => setModal(null)}>{modal === "create" ? <CreateDaoForm onSubmit={createDao} pending={pending} /> : <ActionForm type={modal} onSubmit={submitAction} pending={pending} />}</Modal> : null}
    {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
  </div>;
}

function DisconnectedState() {
  return <main className="centerState"><span className="stateIcon"><Wallet /></span><span className="overline">POCKETDAO DASHBOARD</span><h1>Connect your group wallet.</h1><p>Connect to create a treasury, vote with your community, or check your group&apos;s proposals.</p><ConnectButton /><small>BOT Chain Mainnet</small></main>;
}

function NetworkState({ onSwitch }: { onSwitch: () => void }) {
  return <main className="centerState"><span className="stateIcon"><ArrowUpRight /></span><span className="overline">WRONG NETWORK</span><h1>Switch to BOT Chain.</h1><p>PocketDAO runs on BOT Chain Mainnet.</p><button className="button buttonPrimary buttonLarge" onClick={onSwitch}>Switch to BOT Chain Mainnet</button></main>;
}

function OpenDaoState({ manualDao, setManualDao, open, create, canCreate }: { manualDao: string; setManualDao: (value: string) => void; open: () => void; create: () => void; canCreate: boolean }) {
  return <section className="openDaoState"><span className="stateIcon"><CircleDollarSign /></span><h2>Open a community treasury</h2><p>Paste a PocketDAO contract address, or create a fresh treasury for your group.</p><div className="addressOpen"><input value={manualDao} onChange={(event) => setManualDao(event.target.value)} placeholder="0x… PocketDAO address" /><button className="button buttonSecondary" onClick={open}>Open DAO</button></div>{canCreate ? <button className="button buttonPrimary" onClick={create}><Plus size={17} />Create a new DAO</button> : null}</section>;
}

function InvalidDaoState({ clear }: { clear: () => void }) {
  return <section className="openDaoState"><span className="stateIcon"><CircleDollarSign /></span><h2>This treasury could not be opened</h2><p>The address is not a PocketDAO on the connected BOT Chain network. Check the address or switch to the network where it was deployed.</p><button className="button buttonPrimary" onClick={clear}>Choose another DAO</button></section>;
}

function ProposalItem({ id, proposal, currentTime, pending, explorer, canVote, hasVoted, onVote, onExecute }: { id: number; proposal: Proposal; currentTime: number; pending: boolean; explorer: string; canVote: boolean; hasVoted: boolean; onVote: (id: number, support: boolean) => void; onExecute: (id: number) => void }) {
  const [recipient, amount, deadline, yesVotes, noVotes, requiredYesVotes, executed, description] = proposal;
  const threshold = Number(requiredYesVotes);
  const closed = currentTime > 0 && Number(deadline) * 1000 <= currentTime;
  const passed = Number(yesVotes) >= threshold;
  const total = Math.max(Number(yesVotes) + Number(noVotes), threshold);
  const yesWidth = `${Math.min(100, (Number(yesVotes) / total) * 100)}%`;
  const status = executed ? "Executed" : closed ? (passed ? "Approved" : "Not approved") : "Voting";
  return <article className="proposalCard"><div className="proposalHeader"><div><span className={`proposalStatus status${status.replace(" ", "")}`}><i />{status}</span><h3>{description || `Proposal #${id + 1}`}</h3><a href={`${explorer}/address/${recipient}`} target="_blank" rel="noreferrer">To {shortenAddress(recipient)} <ExternalLink size={12} /></a></div><div className="proposalAmount"><strong>{formatBot(amount)}</strong><span>BOT</span></div></div><div className="proposalProgress"><div><span style={{ width: yesWidth }} /></div><div><span><b>{yesVotes}</b> YES</span><span>{currentTime ? timeLeft(deadline, currentTime) : "Voting period"}</span><span><b>{noVotes}</b> NO</span></div></div><div className="proposalFooter"><span><Clock3 size={14} />Needs {threshold} YES votes</span><div>{!closed && !executed && canVote && !hasVoted ? <><button disabled={pending} onClick={() => onVote(id, false)} className="button voteNo">Vote NO</button><button disabled={pending} onClick={() => onVote(id, true)} className="button voteYes">Vote YES</button></> : null}{!closed && hasVoted ? <span className="votedLabel"><Check size={13} />Your vote is recorded</span> : null}{closed && passed && !executed ? <button disabled={pending} onClick={() => onExecute(id)} className="button buttonPrimary">Execute payment</button> : null}</div></div></article>;
}

function CreateDaoForm({ onSubmit, pending }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  return <form className="form" onSubmit={onSubmit}><label>DAO name<input name="name" required minLength={2} maxLength={64} placeholder="e.g. Builders Guild" /></label><label>Initial members <span>(optional)</span><textarea name="members" rows={3} placeholder="Paste wallet addresses, separated by commas" /></label><label>Initial treasury deposit <span>(optional)</span><input name="initialDeposit" type="number" min="0.000001" step="any" placeholder="0.00" /><span className="inputSuffix">BOT</span></label><p className="formHelper">Funding during creation saves a separate deposit transaction and gas fee.</p><label>Voting period<select name="days" defaultValue="3"><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option></select></label><div className="formNote"><Check size={15} />Your connected wallet is added as creator and first member.</div><TransactionButton pending={pending}>Create PocketDAO <ArrowUpRight size={17} /></TransactionButton></form>;
}

function ActionForm({ type, onSubmit, pending }: { type: Exclude<ModalName, "create" | null>; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  return <form className="form" onSubmit={onSubmit}>{type === "deposit" ? <><label>Amount<input name="amount" type="number" min="0.000001" step="any" required placeholder="0.00" /><span className="inputSuffix">BOT</span></label><p className="formHelper">Deposits go directly to the DAO contract and can only leave through an approved proposal.</p></> : type === "member" ? <label>Wallet address<input name="address" required placeholder="0x…" /></label> : <><label>What is this payment for?<input name="description" required maxLength={160} placeholder="e.g. Sponsor community meetup venue" /></label><label>Recipient address<input name="recipient" required placeholder="0x…" /></label><label>Amount<input name="amount" type="number" min="0.000001" step="any" required placeholder="0.00" /><span className="inputSuffix">BOT</span></label></>}<TransactionButton pending={pending}>{type === "deposit" ? "Deposit BOT" : type === "member" ? "Add member" : "Publish proposal"}</TransactionButton></form>;
}
