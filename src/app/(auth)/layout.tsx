import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <div className="gx-grid-bg gx-glow-teal pointer-events-none absolute inset-0 -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="GuardianX home">
            <Logo iconSize={30} />
          </Link>
        </div>
        <div className="gx-glass rounded-2xl border p-8 shadow-[0_20px_60px_-15px_hsl(var(--shadow-color)/0.4)]">
          {children}
        </div>
      </div>
    </div>
  );
}
