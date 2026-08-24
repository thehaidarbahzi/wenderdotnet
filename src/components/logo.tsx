import Link from "next/link";
import { cn } from "@/lib/cn";

/*
 * W mark traced from public/icon.svg. Uses currentColor so it inherits
 * the text color of the parent element. Set the color to #34D399 (the SVG's
 * native green) in navbar/footer to match the user's request.
 */
export function WMark({ className, color }: { className?: string; color?: string }) {
  const strokeColor = color ?? "currentColor";
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
      className={cn("h-5 w-5", className)}
      style={{ stroke: strokeColor }}
    >
      <path
        d="M4.5 10.125L10.125 25.875L15.1875 13.5L18 20.25L23.0625 13.5L28.125 25.875"
        strokeWidth={2.8125}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.125 25.875C30.75 25.875 32.0625 24.5625 32.0625 21.9375"
        strokeWidth={2.8125}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* LogoMark kotak berwarna — digunakan di hero preview & bagian tertentu */
export function LogoMark({ className, color }: { className?: string; color?: string }) {
  return (
    <span
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-white shadow-xs",
        className
      )}
      aria-hidden
    >
      <WMark color={color} />
    </span>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <LogoMark />{" "}
      <span className="text-base font-semibold tracking-tight text-text-primary">
        wenderdotnet
      </span>
    </Link>
  );
}