import { LoaderCircle } from "lucide-react";

export function TransactionButton({ children, pending, disabled = false, className = "" }: { children: React.ReactNode; pending: boolean; disabled?: boolean; className?: string }) {
  return <button className={`button buttonPrimary transactionButton ${className}`} type="submit" disabled={pending || disabled}>{pending ? <><LoaderCircle className="spin" size={17} />Confirming…</> : children}</button>;
}
