"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";
import { ConnectButton } from "./ConnectButton";

export function DashboardHeader() {
  const [open, setOpen] = useState(false);
  return <header className="dashboardHeader"><div className="dashboardHeaderInner"><Link href="/" aria-label="PocketDAO home"><Brand /></Link><button className="mobileMenu" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button><nav className={open ? "dashboardNav dashboardNavOpen" : "dashboardNav"}><Link className="navActive" href="/dashboard">Overview</Link><a href="#proposals">Proposals</a><a href="#members">Members</a><ConnectButton small /></nav></div></header>;
}
