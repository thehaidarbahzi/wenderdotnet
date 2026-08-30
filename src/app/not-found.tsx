"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.replace(user ? "/devices" : "/");
    });
  }, [router]);

  // Minimal placeholder while redirecting — no 404 UI per spec
  return null;
}
