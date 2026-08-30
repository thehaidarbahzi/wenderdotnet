"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: "up" | "left" | "right" | "scale";
  delay?: number;
}

/*
 * ScrollReveal — purpose: guide eye to content as it enters viewport.
 * Uses IntersectionObserver for performant scroll-triggered animations.
 * Respects prefers-reduced-motion via CSS override in globals.css.
 */
export function ScrollReveal({
  children,
  className = "",
  animation = "up",
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(`animate-reveal${animation !== "up" ? `-${animation}` : ""}`);
          if (delay > 0) {
            el.style.animationDelay = `${delay}ms`;
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animation, delay]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
