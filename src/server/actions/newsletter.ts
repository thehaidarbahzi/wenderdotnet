"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function subscribeNewsletter(email: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("newsletters")
    .insert({ email });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Email sudah terdaftar");
    }
    throw error;
  }
}
