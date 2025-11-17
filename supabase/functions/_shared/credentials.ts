import { supabaseClient } from "./supabase.ts";
import { decrypt } from "./encryption.ts";

export async function getSystemCredentials(platform: string) {
  const supabase = supabaseClient();

  const { data, error } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("platform", platform)
    .eq("owner_type", "system")
    .maybeSingle();

  if (error || !data) {
    console.error(`System credentials not found for platform: ${platform}`, error);
    throw new Error(`Platform credentials unavailable for ${platform}`);
  }

  // Decrypt tokens
  const accessToken = await decrypt(data.access_token);
  const refreshToken = data.refresh_token ? await decrypt(data.refresh_token) : null;

  return {
    ...data,
    accessToken,
    refreshToken,
  };
}
