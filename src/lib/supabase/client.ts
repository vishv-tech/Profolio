import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, publishableKey } = getSupabasePublicEnv();

  // Add the generated Database generic after the Profolio schema is applied.
  return createBrowserClient(url, publishableKey);
}
