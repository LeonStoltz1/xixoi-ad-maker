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
      console.error("Meta OAuth error:", error);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=meta`
      );
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const { userId } = JSON.parse(atob(state));

    const tokenRes = await fetch(
      "https://graph.facebook.com/v20.0/oauth/access_token?" +
        new URLSearchParams({
          client_id: Deno.env.get("META_APP_ID")!,
          client_secret: Deno.env.get("META_APP_SECRET")!,
          redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-oauth-callback`,
          code,
        })
    );

    if (!tokenRes.ok) {
      console.error("Meta token exchange failed", await tokenRes.text());
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=meta_token`
      );
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;

    // Fetch ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/adaccounts?fields=name,account_id&access_token=${accessToken}`
    );
    const accountsJson = await accountsRes.json();
    const primary = accountsJson?.data?.[0] ?? null;

    const encrypted = await encrypt(accessToken);
    const supabase = supabaseClient();

    await supabase.from("platform_credentials").upsert({
      owner_type: "user",
      owner_id: userId,
      platform: "meta",
      access_token: encrypted,
      platform_account_id: primary?.account_id ?? null,
      status: "connected",
    });

    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?success=meta`
    );
  } catch (e) {
    console.error("meta-oauth-callback error", e);
    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=meta_internal`
    );
  }
});
