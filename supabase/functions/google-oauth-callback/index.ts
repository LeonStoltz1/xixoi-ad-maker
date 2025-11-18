import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseClient } from "../_shared/supabase.ts";
import { encrypt } from "../_shared/encryption.ts";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=google`
      );
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const { userId } = JSON.parse(atob(state));
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed", await tokenRes.text());
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=google_token`
      );
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;

    const encryptedAccess = await encrypt(accessToken);
    const encryptedRefresh = refreshToken ? await encrypt(refreshToken) : null;
    const supabase = supabaseClient();

    await supabase.from("platform_credentials").upsert({
      owner_type: "user",
      owner_id: userId,
      platform: "google",
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      platform_account_id: "google-ads",
      status: "connected",
      expires_at: new Date(Date.now() + tokenJson.expires_in * 1000).toISOString(),
    });

    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?success=google`
    );
  } catch (e) {
    console.error("google-oauth-callback error", e);
    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=google_internal`
    );
  }
});
