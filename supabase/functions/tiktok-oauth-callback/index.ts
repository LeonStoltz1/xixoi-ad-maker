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
      console.error("TikTok OAuth error:", error);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=tiktok`
      );
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const { userId } = JSON.parse(atob(state));

    const tokenRes = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: Deno.env.get("TIKTOK_CLIENT_KEY")!,
          secret: Deno.env.get("TIKTOK_CLIENT_SECRET")!,
          auth_code: code,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenJson = await tokenRes.json();
    if (tokenJson.code !== 0) {
      console.error("TikTok token error:", tokenJson);
      return Response.redirect(
        `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=tiktok_token`
      );
    }

    const accessToken = tokenJson.data.access_token as string;
    const encryptedAccess = await encrypt(accessToken);
    const supabase = supabaseClient();

    await supabase.from("platform_credentials").upsert({
      owner_type: "user",
      owner_id: userId,
      platform: "tiktok",
      access_token: encryptedAccess,
      platform_account_id: "tiktok-ads",
      status: "connected",
      expires_at: new Date(
        Date.now() + (tokenJson.data.expires_in ?? 3600) * 1000
      ).toISOString(),
    });

    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?success=tiktok`
    );
  } catch (e) {
    console.error("tiktok-oauth-callback error", e);
    return Response.redirect(
      `${Deno.env.get("PUBLIC_SITE_URL")}/connect-platforms?error=tiktok_internal`
    );
  }
});
