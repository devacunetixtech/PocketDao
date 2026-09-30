import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  const size = compact ? 26 : 32;
  return <div className={`brand ${compact ? "brandCompact" : ""}`}><Image className="brandImage" src="/pocketdao-logo.png" alt="" width={size} height={size} priority /><span>Pocket<b>DAO</b></span></div>;
}
