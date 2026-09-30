"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check, Coins, ShieldCheck, Users, Vote } from "lucide-react";
import { Brand } from "@/components/Brand";
import { ConnectButton } from "@/components/ConnectButton";
import { useAccount } from "wagmi";

const features = [
  { icon: Coins, title: "Shared treasury", copy: "Pool BOT in one transparent wallet everyone can verify." },
  { icon: Vote, title: "Simple voting", copy: "One member, one vote. An absolute majority approves spending." },
  { icon: ShieldCheck, title: "Safe execution", copy: "Funds move only after the fixed voting window closes." },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="landing">
      <nav className="nav container">
        <Brand />
        <div className="navActions">
          <a className="navLink" href="https://botchain.ai" target="_blank" rel="noreferrer">BOT Chain <ArrowUpRight size={14} /></a>
          <ConnectButton />
        </div>
      </nav>

      <section className="hero container">
        <div className="heroCopy">
          <div className="eyebrow"><span className="statusDot" /> Treasury governance on BOT Chain</div>
          <h1>Your group wallet,<br /><span>without the spreadsheet.</span></h1>
          <p>Create a transparent community treasury, invite your people, vote on spending, and move BOT only when the group agrees.</p>
          <div className="heroCtas">
            {isConnected ? <Link className="button buttonPrimary buttonLarge" href="/dashboard">Open app <ArrowUpRight size={18} /></Link> : <ConnectButton large label="Connect to open app" />}
            <a className="button buttonGhost buttonLarge" href="#how-it-works">See how it works</a>
          </div>
          <div className="trustLine"><Check size={16} /> No multisig complexity <Check size={16} /> No offchain tallying</div>
        </div>

        <div className="heroVisual" aria-label="How PocketDAO works">
          <div className="glowOrb" />
          <div className="protocolCard">
            <Image className="heroLogo" src="/pocketdao-logo.png" alt="PocketDAO community treasury logo" width={210} height={210} priority />
            <div className="protocolSteps">
              <div><span><Users size={17} /></span><p><b>Create the group</b><small>Add the wallets that can propose and vote.</small></p></div>
              <ArrowRight className="stepArrow" size={16} />
              <div><span><Coins size={17} /></span><p><b>Fund the treasury</b><small>Deposit native BOT directly onchain.</small></p></div>
              <ArrowRight className="stepArrow" size={16} />
              <div><span><Vote size={17} /></span><p><b>Approve spending</b><small>Majority vote first. Execution follows.</small></p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="featureSection container" id="how-it-works">
        <p className="sectionKicker">GOVERNANCE, POCKET-SIZED</p>
        <div className="featureHeading"><h2>Shared money should feel simple.</h2><p>PocketDAO keeps the rules obvious, the activity public, and your group in control.</p></div>
        <div className="featureGrid">
          {features.map(({ icon: Icon, title, copy }, index) => (
            <article className="featureCard" key={title}>
              <span className="featureNumber">0{index + 1}</span><div className="featureIcon"><Icon /></div><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer container"><Brand compact /><p>Transparent group treasuries on BOT Chain.</p><div className="footerLinks"><a href="https://botchain.ai" target="_blank" rel="noreferrer">BOT Chain <ArrowUpRight size={12} /></a><a href="https://scan.botchain.ai" target="_blank" rel="noreferrer">Explorer <ArrowUpRight size={12} /></a></div><span>© 2026 PocketDAO</span></footer>
    </main>
  );
}
