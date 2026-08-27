export type SupabasePublicEnvironment = {
  url: string;
  publishableKey: string;
};

export function getOptionalSupabasePublicEnv(): SupabasePublicEnvironment | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function getSupabasePublicEnv(): SupabasePublicEnvironment {
  const environment = getOptionalSupabasePublicEnv();

  if (!environment) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return environment;
}
