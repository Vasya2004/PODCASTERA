import { redirect } from "next/navigation";
import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const getUserContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    redirect("/login");
  }

  return { supabase, user: session.user };
});

export async function requireUser() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  return getUserContext();
}
