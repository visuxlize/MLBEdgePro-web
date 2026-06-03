import { cache } from "react";
import { getAuthUser } from "@/lib/supabase/server";

export const createTRPCContext = cache(async () => {
  const { supabase, user, error } = await getAuthUser();
  return {
    supabase,
    user: error ? null : user,
  };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
