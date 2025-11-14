// AES-256-GCM encryption using Deno WebCrypto

const rawKey = Deno.env.get("ENCRYPTION_KEY")!; // 32 chars (256 bits)

if (!rawKey || rawKey.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
}

const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(rawKey),
  "AES-GCM",
  false,
  ["encrypt", "decrypt"]
);

export async function encrypt(text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(cipher)))}`;
}

export async function decrypt(ciphertext: string): Promise<string> {
  const [ivStr, ctStr] = ciphertext.split(".");
  const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(ctStr), (c) => c.charCodeAt(0));

  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
}
