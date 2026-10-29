import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white print:bg-white print:text-black">
      <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-sunset-500/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 left-10 size-72 rounded-full bg-lagoon-600/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-sunset-500">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl lg:text-5xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-navy-100">{children}</div>}
      </div>
    </section>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 ${className}`}>{children}</section>;
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-sunset-500/40 bg-sunset-100 px-4 py-3 text-sm text-navy-900">
      <strong className="font-semibold">Demo data:</strong> {children}
    </p>
  );
}
