import { supabaseClient } from "./supabase.ts";
import { decrypt } from "./encryption.ts";

export type PlatformCredential = {
  accessToken: string;
  refreshToken?: string | null;
  accountId?: string | null;
  accountName?: string | null;
};

/**
 * Hybrid credential router
 * - Pro/Elite/Agency: MUST use their own OAuth credentials
 * - Quick-Start/Free: Use system master account
 */
export async function getCredentials(
  userId: string,
  platform: "meta" | "google" | "tiktok" | "linkedin" | "x",
  tier: string
): Promise<PlatformCredential> {
  console.log(`getCredentials: userId=${userId}, platform=${platform}, tier=${tier}`);

  const supabase = supabaseClient();

  // Pro/Elite/Agency MUST use their own credentials
  if (["pro", "elite", "agency"].includes(tier)) {
    const { data: cred, error } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("owner_id", userId)
      .eq("owner_type", "user")
      .eq("platform", platform)
      .eq("status", "connected")
      .maybeSingle();

    if (error) {
      console.error("getCredentials user cred error", error);
    }

    if (!cred) {
      throw new Error(
        `OAUTH_REQUIRED: Connect your ${platform.toUpperCase()} account in Settings → Connected Accounts`
      );
    }

    console.log(`Using user credential for ${platform}`);
    return {
      accessToken: await decrypt(cred.access_token),
      refreshToken: cred.refresh_token ? await decrypt(cred.refresh_token) : null,
      accountId: cred.platform_account_id ?? null,
      accountName: cred.account_name ?? null,
    };
  }

  // Quick-Start / Free → system master account
  console.log(`Using system credential for ${platform}`);
  const { data: systemCred, error: sysErr } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("owner_type", "system")
    .eq("platform", platform)
    .maybeSingle();

  if (sysErr) console.error("getCredentials system error", sysErr);
  if (!systemCred) {
    throw new Error(`System ${platform.toUpperCase()} credentials not configured`);
  }

  return {
    accessToken: await decrypt(systemCred.access_token),
    refreshToken: systemCred.refresh_token
      ? await decrypt(systemCred.refresh_token)
      : null,
    accountId: systemCred.platform_account_id ?? null,
    accountName: "xiXoi Master Account",
  };
}

// Legacy function for backward compatibility
export async function getSystemCredentials(platform: string) {
  return getCredentials("system", platform as any, "quickstart");
}
