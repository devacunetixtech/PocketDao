"use client";

import { LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "@/lib/format";
import { friendlyWalletError } from "@/lib/errors";

export function ConnectButton({ small = false, large = false, label = "Connect wallet" }: { small?: boolean; large?: boolean; label?: string }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [connectionError, setConnectionError] = useState("");
  const connector = connectors[0];

  if (isConnected && address) {
    return <button className={`button walletButton ${small ? "buttonSmall" : ""}`} onClick={() => disconnect()} title="Disconnect wallet"><span className="walletDot" />{shortenAddress(address)}<LogOut size={15} /></button>;
  }
  const handleConnect = () => {
    setConnectionError("");
    if (!connector) {
      setConnectionError("Install or open an EVM wallet to continue.");
      return;
    }
    connect({ connector }, { onError: (error) => setConnectionError(friendlyWalletError(error)) });
  };
  return <span className="connectControl"><button className={`button buttonPrimary ${small ? "buttonSmall" : ""} ${large ? "buttonLarge" : ""}`} onClick={handleConnect} disabled={isPending}><Wallet size={16} />{isPending ? "Waiting for wallet…" : label}</button>{connectionError ? <span className="connectError" role="alert">{connectionError}</span> : null}</span>;
}
