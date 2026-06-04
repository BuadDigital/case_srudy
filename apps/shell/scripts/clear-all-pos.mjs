/**
 * Deletes all work orders from the API (dev/maintenance).
 * Usage: node apps/shell/scripts/clear-all-pos.mjs
 * Env: API_URL (default http://localhost:5160)
 */
const API = (process.env.API_URL ?? "http://localhost:5160").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@local.dev";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";

async function main() {
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }
  const { token } = await loginRes.json();
  if (!token) {
    console.error("No token in login response");
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };
  const listRes = await fetch(`${API}/api/work-orders`, { headers });
  if (!listRes.ok) {
    console.error("List failed:", listRes.status, await listRes.text());
    process.exit(1);
  }
  const items = await listRes.json();
  if (!Array.isArray(items)) {
    console.error("Unexpected list response");
    process.exit(1);
  }

  let deleted = 0;
  for (const item of items) {
    const po = item.poNumber?.trim();
    if (!po) continue;
    const delRes = await fetch(
      `${API}/api/work-orders/${encodeURIComponent(po)}`,
      { method: "DELETE", headers },
    );
    if (delRes.ok || delRes.status === 204) {
      deleted += 1;
      console.log(`Deleted ${po}`);
    } else {
      console.warn(`Failed ${po}:`, delRes.status, await delRes.text());
    }
  }
  console.log(`Done. Deleted ${deleted}/${items.length} work orders.`);
  console.log(
    "In the browser: open System Tools as CDO and click «حذف جميع أوامر العمل» to clear localStorage, or run localStorage.clear() for PO keys only.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
