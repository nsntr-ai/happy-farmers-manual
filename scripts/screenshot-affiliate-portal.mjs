/**
 * Capture affiliate portal screenshots using API tokens (avoids login rate limit).
 */
import puppeteer from "puppeteer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API = process.env.API_URL ?? "http://localhost:3000/api";
const BASE = process.argv[2] ?? "http://localhost:3004";
const OUT_DIR = path.join(
  fileURLToPath(new URL("../pages/modules/assets", import.meta.url)),
);

const AFFILIATE_EMAIL = "manual.affiliate@example.com";
const AFFILIATE_PASSWORD = "Pass123$$";

const portalShots = [
  { name: "affiliate-portal-dashboard.png", path: "/affiliate" },
  { name: "affiliate-portal-referrals.png", path: "/affiliate/referrals" },
  { name: "affiliate-portal-commissions.png", path: "/affiliate/commissions" },
  { name: "affiliate-portal-settlements.png", path: "/affiliate/settlements" },
  { name: "affiliate-portal-profile.png", path: "/affiliate/profile" },
];

async function apiLogin() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: AFFILIATE_EMAIL,
      password: AFFILIATE_PASSWORD,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Login failed");
  return { tokens: json.data.tokens, user: json.data.user };
}

async function compress(buffer) {
  return sharp(buffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();
}

async function main() {
  const { tokens, user } = await apiLogin();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  await page.evaluateOnNewDocument(
    (tokensJson, userJson) => {
      localStorage.setItem("tokens", tokensJson);
      localStorage.setItem("user", userJson);
      document.cookie = "hf_auth=1; Path=/; Max-Age=604800; SameSite=Lax";
      document.cookie = "hf_is_admin=0; Path=/; Max-Age=604800; SameSite=Lax";
      document.cookie = "hf_is_affiliate=1; Path=/; Max-Age=604800; SameSite=Lax";
    },
    JSON.stringify(tokens),
    JSON.stringify(user),
  );

  for (const shot of portalShots) {
    console.log(`Capturing ${shot.name}...`);
    await page.goto(`${BASE}${shot.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 2500));
    const raw = await page.screenshot({ fullPage: false, type: "png" });
    const compressed = await compress(raw);
    fs.writeFileSync(path.join(OUT_DIR, shot.name), compressed);
    console.log(`  -> ${(compressed.length / 1024).toFixed(1)} KB`);
  }

  // Tenant create with referral code (admin - one more shot)
  const adminRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@happyfarmer.com",
      password: AFFILIATE_PASSWORD,
    }),
  });
  const adminJson = await adminRes.json();
  if (adminJson.success) {
    await page.evaluateOnNewDocument(
      (tokensJson, userJson) => {
        localStorage.setItem("tokens", tokensJson);
        localStorage.setItem("user", userJson);
        document.cookie = "hf_auth=1; Path=/; Max-Age=604800; SameSite=Lax";
        document.cookie = "hf_is_admin=1; Path=/; Max-Age=604800; SameSite=Lax";
        document.cookie = "hf_is_affiliate=0; Path=/; Max-Age=604800; SameSite=Lax";
      },
      JSON.stringify(adminJson.data.tokens),
      JSON.stringify(adminJson.data.user),
    );
    await page.goto(`${BASE}/admin/tenants/create`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="NAMA-MITRA"]');
      if (input) {
        input.scrollIntoView({ block: "center" });
        input.value = "DENDI-HF-DEMO";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 1500));
    const raw = await page.screenshot({ fullPage: false, type: "png" });
    const compressed = await compress(raw);
    fs.writeFileSync(
      path.join(OUT_DIR, "affiliate-admin-tenant-referral.png"),
      compressed,
    );
    console.log(
      `affiliate-admin-tenant-referral.png -> ${(compressed.length / 1024).toFixed(1)} KB`,
    );
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
