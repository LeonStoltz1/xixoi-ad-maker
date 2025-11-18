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
      console.error("LinkedIn OAuth error:", error);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=linkedin`
      );
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const { userId } = JSON.parse(atob(state));
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/linkedin-oauth-callback`;

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
        client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
      }),
    });

    if (!tokenRes.ok) {
      console.error("LinkedIn token exchange failed", await tokenRes.text());
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=linkedin_token`
      );
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;
    const encryptedAccess = await encrypt(accessToken);
    const supabase = supabaseClient();

    await supabase.from("platform_credentials").upsert({
      owner_type: "user",
      owner_id: userId,
      platform: "linkedin",
      access_token: encryptedAccess,
      platform_account_id: "linkedin-ads",
      status: "connected",
      expires_at: new Date(Date.now() + tokenJson.expires_in * 1000).toISOString(),
    });

    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?success=linkedin`
    );
  } catch (e) {
    console.error("linkedin-oauth-callback error", e);
    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=linkedin_internal`
    );
  }
});
