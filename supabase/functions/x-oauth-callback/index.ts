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
      console.error("X OAuth error:", error);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=x`
      );
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const { userId, codeVerifier } = JSON.parse(atob(state));
    const redirectUri = Deno.env.get("X_REDIRECT_URI")!;

    const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: Deno.env.get("X_CLIENT_ID")!,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (tokenJson.error) {
      console.error("X token error:", tokenJson);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=x_token`
      );
    }

    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;

    const encryptedAccess = await encrypt(accessToken);
    const encryptedRefresh = refreshToken ? await encrypt(refreshToken) : null;
    const supabase = supabaseClient();

    await supabase.from("platform_credentials").upsert({
      owner_type: "user",
      owner_id: userId,
      platform: "x",
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      platform_account_id: "x-ads",
      status: "connected",
    });

    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?success=x`
    );
  } catch (e) {
    console.error("x-oauth-callback error", e);
    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=x_internal`
    );
  }
});
