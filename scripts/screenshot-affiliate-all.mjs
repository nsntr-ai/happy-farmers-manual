/**
 * Re-capture all affiliate manual screenshots at consistent 1024px width.
 * Uses API token injection (no login rate limit) and hides Next.js dev overlay.
 *
 * Usage: node scripts/screenshot-affiliate-all.mjs [frontendUrl]
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

const PASSWORD = "Pass123$$";

const HIDE_DEV_UI_CSS = `
  nextjs-portal,
  [data-nextjs-toast],
  [data-next-badge],
  [data-issues-open],
  [data-issues-collapse],
  #__next-route-announcer__,
  button[aria-label="Open Next.js Dev Tools"],
  button[aria-label="Open issues overlay"],
  button[aria-label="Collapse issues badge"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

async function apiLogin(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`${email}: ${json.message ?? "login failed"}`);
  return { tokens: json.data.tokens, user: json.data.user };
}

async function getAffiliateId(adminToken) {
  const res = await fetch(`${API}/admin/affiliates?limit=1&search=manual.affiliate`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const json = await res.json();
  const id = json.data?.items?.[0]?.id;
  if (!id) throw new Error("Demo affiliate not found — run manual setup first");
  return id;
}

async function getAffiliateTermsLegalDoc(adminToken) {
  const res = await fetch(
    `${API}/admin/legal-documents?type=AFFILIATE_TERMS&limit=5`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  const json = await res.json();
  const items = json.data?.items ?? [];
  const published = items.find((d) => d.status === "PUBLISHED");
  const draft = items.find((d) => d.status === "DRAFT");
  return published ?? draft ?? items[0] ?? null;
}

const MIN_SIGNATURE_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFklEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

async function getAffiliateTermsStatus(affiliateToken) {
  const res = await fetch(`${API}/affiliate/me/terms`, {
    headers: { Authorization: `Bearer ${affiliateToken}` },
  });
  const json = await res.json();
  return json.data ?? null;
}

async function acceptTermsViaApi(affiliateToken, termsStatus) {
  if (!termsStatus?.acceptanceRequired || !termsStatus.document) return;
  await fetch(`${API}/affiliate/me/terms/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${affiliateToken}`,
    },
    body: JSON.stringify({
      signerName: "Manual Screenshot",
      signatureData: MIN_SIGNATURE_PNG,
      documentVersion: termsStatus.document.version,
    }),
  });
}

async function savePng(buffer, filename) {
  const out = await sharp(buffer)
    .resize(1024, null, { withoutEnlargement: true })
    .png({ compressionLevel: 8 })
    .toBuffer();
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, out);
  const meta = await sharp(out).metadata();
  console.log(`  -> ${filename} (${meta.width}x${meta.height}, ${(out.length / 1024).toFixed(1)} KB)`);
}

async function injectSession(page, tokens, user, { isAdmin, isAffiliate }) {
  await page.evaluateOnNewDocument(
    (tokensJson, userJson, adminFlag, affiliateFlag) => {
      localStorage.setItem("tokens", tokensJson);
      localStorage.setItem("user", userJson);
      document.cookie = "hf_auth=1; Path=/; Max-Age=604800; SameSite=Lax";
      document.cookie = `hf_is_admin=${adminFlag}; Path=/; Max-Age=604800; SameSite=Lax`;
      document.cookie = `hf_is_affiliate=${affiliateFlag}; Path=/; Max-Age=604800; SameSite=Lax`;
      const style = document.createElement("style");
      style.textContent = `
        nextjs-portal,
        [data-nextjs-toast],
        [data-next-badge],
        [data-issues-open],
        [data-issues-collapse],
        #__next-route-announcer__,
        button[aria-label="Open Next.js Dev Tools"],
        button[aria-label="Open issues overlay"],
        button[aria-label="Collapse issues badge"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    },
    JSON.stringify(tokens),
    JSON.stringify(user),
    isAdmin ? "1" : "0",
    isAffiliate ? "1" : "0",
  );
}

async function hideDevUi(page) {
  await page.addStyleTag({ content: HIDE_DEV_UI_CSS });
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
}

async function gotoAndWait(page, url, waitMs = 2500) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, waitMs));
  await hideDevUi(page);
}

async function viewportShot(page, filename) {
  const raw = await page.screenshot({ type: "png", captureBeyondViewport: false });
  await savePng(raw, filename);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const admin = await apiLogin("superadmin@happyfarmer.com");
  const affiliate = await apiLogin("manual.affiliate@example.com");
  const affiliateId = await getAffiliateId(admin.tokens.accessToken);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  // ── Admin screenshots ─────────────────────────────────────────────────────
  await injectSession(page, admin.tokens, admin.user, {
    isAdmin: true,
    isAffiliate: false,
  });

  console.log("Admin — list");
  await gotoAndWait(page, "/admin/affiliates");
  await page.waitForFunction(
    () => document.body.innerText.includes("Daftar affiliator"),
    { timeout: 30000 },
  );
  await viewportShot(page, "affiliate-admin-list.png");

  console.log("Admin — create");
  await gotoAndWait(page, "/admin/affiliates/create");
  await page.waitForFunction(
    () => document.body.innerText.includes("Data affiliator"),
    { timeout: 30000 },
  );
  await viewportShot(page, "affiliate-admin-create.png");

  console.log("Admin — detail");
  await gotoAndWait(page, `/admin/affiliates/${affiliateId}`);
  await page.waitForFunction(
    () => document.body.innerText.includes("Ringkasan"),
    { timeout: 30000 },
  );
  await viewportShot(page, "affiliate-admin-detail.png");

  console.log("Admin — settlements list");
  await gotoAndWait(page, "/admin/affiliate-settlements");
  await page.waitForFunction(
    () => document.body.innerText.includes("Daftar batch"),
    { timeout: 30000 },
  );
  await viewportShot(page, "affiliate-admin-settlements.png");

  console.log("Admin — settlement batch modal");
  await gotoAndWait(page, "/admin/affiliate-settlements", 1500);
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent?.trim() ?? "", btn);
    if (text.includes("Buat Batch")) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));
  await hideDevUi(page);
  await viewportShot(page, "affiliate-admin-settlement-batch.png");
  // Close modal
  const closeButtons = await page.$$("button");
  for (const btn of closeButtons) {
    const text = await page.evaluate((el) => el.textContent?.trim() ?? "", btn);
    if (text === "Batal" || text === "Close") {
      await btn.click();
      break;
    }
  }

  console.log("Admin — tenant referral field");
  await gotoAndWait(page, "/admin/tenants/create");
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="NAMA-MITRA"]');
    if (input) {
      input.scrollIntoView({ block: "center" });
      input.focus();
      input.value = "DENDI-HF-DEMO";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 2000));
  await hideDevUi(page);
  await viewportShot(page, "affiliate-admin-tenant-referral.png");

  console.log("Admin — legal documents list");
  await gotoAndWait(page, "/admin/legal");
  await page.waitForFunction(
    () => document.body.innerText.includes("Dokumen Legal"),
    { timeout: 30000 },
  );
  await viewportShot(page, "affiliate-admin-legal-list.png");

  const legalDoc = await getAffiliateTermsLegalDoc(admin.tokens.accessToken);
  if (legalDoc?.id) {
    console.log("Admin — legal document detail");
    await gotoAndWait(page, `/admin/legal/${legalDoc.id}`);
    await page.waitForFunction(
      () =>
        document.body.innerText.includes("Metadata") ||
        document.body.innerText.includes("Konten"),
      { timeout: 30000 },
    );
    await viewportShot(page, "affiliate-admin-legal-detail.png");
  }

  console.log("Admin — affiliate terms acceptance history");
  await gotoAndWait(page, `/admin/affiliates/${affiliateId}`);
  await page.waitForFunction(
    () => document.body.innerText.includes("Riwayat persetujuan"),
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    const headings = [...document.querySelectorAll("h2, h3, p, span, div")];
    const target = headings.find((el) =>
      el.textContent?.includes("Riwayat persetujuan S&K"),
    );
    if (target) target.scrollIntoView({ block: "start" });
  });
  await new Promise((r) => setTimeout(r, 800));
  await hideDevUi(page);
  await viewportShot(page, "affiliate-admin-terms-history.png");

  console.log("Public — affiliate terms page");
  const publicPage = await browser.newPage();
  await publicPage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await gotoAndWait(publicPage, "/affiliate-terms");
  await publicPage.waitForFunction(
    () =>
      document.body.innerText.includes("Affiliator") ||
      document.body.innerText.includes("belum tersedia"),
    { timeout: 30000 },
  );
  const publicRaw = await publicPage.screenshot({
    type: "png",
    captureBeyondViewport: false,
  });
  await savePng(publicRaw, "affiliate-public-terms.png");
  await publicPage.close();

  // ── Portal screenshots (new browser context for clean cookies) ──────────
  const portalPage = await browser.newPage();
  await portalPage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await injectSession(portalPage, affiliate.tokens, affiliate.user, {
    isAdmin: false,
    isAffiliate: true,
  });

  const termsStatus = await getAffiliateTermsStatus(affiliate.tokens.accessToken);
  if (termsStatus?.acceptanceRequired) {
    console.log("Portal — accept terms (acceptance required)");
    await gotoAndWait(portalPage, "/affiliate/accept-terms");
    await portalPage.waitForFunction(
      () =>
        document.body.innerText.includes("Persetujuan Syarat") ||
        document.body.innerText.includes("Baca sampai selesai"),
      { timeout: 30000 },
    );
    const acceptRaw = await portalPage.screenshot({
      type: "png",
      captureBeyondViewport: false,
    });
    await savePng(acceptRaw, "affiliate-portal-accept-terms.png");
    await acceptTermsViaApi(affiliate.tokens.accessToken, termsStatus);
  } else {
    console.log(
      "Portal — skip accept-terms screenshot (already signed current version)",
    );
  }

  const portalShots = [
    {
      name: "affiliate-portal-dashboard.png",
      path: "/affiliate",
      waitFor: "Kode referral Anda",
    },
    {
      name: "affiliate-portal-referrals.png",
      path: "/affiliate/referrals",
      waitFor: "Daftar tenant",
    },
    {
      name: "affiliate-portal-commissions.png",
      path: "/affiliate/commissions",
      waitFor: "Rincian komisi",
    },
    {
      name: "affiliate-portal-settlements.png",
      path: "/affiliate/settlements",
      waitFor: "Riwayat pembayaran",
    },
    {
      name: "affiliate-portal-profile.png",
      path: "/affiliate/profile",
      waitFor: "Rekening pembayaran",
    },
  ];

  for (const shot of portalShots) {
    console.log(`Portal — ${shot.name}`);
    await gotoAndWait(portalPage, shot.path);
    await portalPage.waitForFunction(
      (text) => document.body.innerText.includes(text),
      { timeout: 30000 },
      shot.waitFor,
    );
    const raw = await portalPage.screenshot({ type: "png", captureBeyondViewport: false });
    await savePng(raw, shot.name);
  }

  await browser.close();
  console.log("\nAll affiliate screenshots updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
