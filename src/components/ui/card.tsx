import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
  glow,
}: {
  className?: string;
  children: ReactNode;
  glow?: "red" | "gold" | null;
}) {
  return (
    <div
      className={cn(
        "group rmr-hover-pop pixel-3d rounded-lg border-2 border-border bg-surface/80 backdrop-blur-sm",
        glow === "red" && "border-red/40 shadow-[3px_3px_0_0_rgba(13,9,32,0.7),6px_6px_0_0_rgba(13,9,32,0.35),0_0_40px_-16px_rgba(255,85,102,0.7)]",
        glow === "gold" && "border-gold/40 shadow-[3px_3px_0_0_rgba(13,9,32,0.7),6px_6px_0_0_rgba(13,9,32,0.35),0_0_40px_-16px_rgba(255,197,49,0.75)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-pixel inline-block text-[10px] uppercase tracking-[0.25em] text-gold",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-3d text-3xl font-extrabold leading-tight tracking-tight text-paper sm:text-4xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}
