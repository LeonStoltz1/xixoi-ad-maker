export async function callEdgeFunction(name: string, body: any) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
