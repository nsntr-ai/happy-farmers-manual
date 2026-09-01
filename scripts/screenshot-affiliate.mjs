/**
 * Capture affiliate manual screenshots from local Happy Farmers UI.
 * Usage: node scripts/screenshot-affiliate.mjs [baseUrl]
 */
import puppeteer from "puppeteer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = process.argv[2] ?? "http://localhost:3004";
const OUT_DIR = path.join(
  fileURLToPath(new URL("../pages/modules/assets", import.meta.url)),
);

const ADMIN = {
  email: "superadmin@happyfarmer.com",
  password: "Pass123$$",
};
const AFFILIATE = {
  email: "manual.affiliate@example.com",
  password: "Pass123$$",
};

const shots = [
  {
    name: "affiliate-admin-list.png",
    login: ADMIN,
    path: "/admin/affiliates",
    wait: 2000,
  },
  {
    name: "affiliate-admin-create.png",
    login: ADMIN,
    path: "/admin/affiliates/create",
    wait: 1500,
  },
  {
    name: "affiliate-admin-detail.png",
    login: ADMIN,
    path: "/admin/affiliates/cmti9ajm40001zkweizq30zaw",
    wait: 2000,
  },
  {
    name: "affiliate-admin-settlements.png",
    login: ADMIN,
    path: "/admin/affiliate-settlements",
    wait: 1500,
  },
  {
    name: "affiliate-admin-tenant-referral.png",
    login: ADMIN,
    path: "/admin/tenants/create",
    wait: 1500,
    beforeShot: async (page) => {
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder="NAMA-MITRA"]');
        if (input) {
          input.scrollIntoView({ block: "center" });
          input.value = "DENDI-HF-DEMO";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      await new Promise((r) => setTimeout(r, 1200));
    },
  },
  {
    name: "affiliate-portal-dashboard.png",
    login: AFFILIATE,
    path: "/affiliate",
    wait: 2000,
  },
  {
    name: "affiliate-portal-referrals.png",
    login: AFFILIATE,
    path: "/affiliate/referrals",
    wait: 1500,
  },
  {
    name: "affiliate-portal-commissions.png",
    login: AFFILIATE,
    path: "/affiliate/commissions",
    wait: 1500,
  },
  {
    name: "affiliate-portal-settlements.png",
    login: AFFILIATE,
    path: "/affiliate/settlements",
    wait: 1500,
  },
  {
    name: "affiliate-portal-profile.png",
    login: AFFILIATE,
    path: "/affiliate/profile",
    wait: 1500,
  },
];

async function compress(buffer) {
  return sharp(buffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();
}

async function login(page, creds) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('input[placeholder="email@anda.com"]', {
    timeout: 15000,
  });
  await page.click('input[placeholder="email@anda.com"]', { clickCount: 3 });
  await page.type('input[placeholder="email@anda.com"]', creds.email);
  await page.type('input[placeholder="••••••••"]', creds.password);
  const loginButtons = await page.$$("button");
  for (const btn of loginButtons) {
    const text = await page.evaluate((el) => el.textContent?.trim() ?? "", btn);
    if (text === "Masuk Sekarang") {
      await btn.click();
      break;
    }
  }
  await page.waitForFunction(
    () => !window.location.pathname.includes("/login"),
    { timeout: 60000 },
  );
  await new Promise((r) => setTimeout(r, 2000));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  for (const shot of shots) {
    console.log(`Capturing ${shot.name}...`);
    await login(page, shot.login);
    await page.goto(`${BASE}${shot.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, shot.wait));
    if (shot.beforeShot) await shot.beforeShot(page);
    const raw = await page.screenshot({ fullPage: false, type: "png" });
    const compressed = await compress(raw);
    const outPath = path.join(OUT_DIR, shot.name);
    fs.writeFileSync(outPath, compressed);
    console.log(`  -> ${outPath} (${(compressed.length / 1024).toFixed(1)} KB)`);

    // Clear session for next login role
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    const cookies = await page.cookies();
    if (cookies.length) await page.deleteCookie(...cookies);
  }

  // Settlement batch modal (admin)
  console.log("Capturing affiliate-admin-settlement-batch.png...");
  await login(page, ADMIN);
  await page.goto(`${BASE}/admin/affiliate-settlements`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  const batchBtn = await page.$("button");
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text?.includes("Buat Batch")) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  const rawModal = await page.screenshot({ fullPage: false, type: "png" });
  const compressedModal = await compress(rawModal);
  fs.writeFileSync(
    path.join(OUT_DIR, "affiliate-admin-settlement-batch.png"),
    compressedModal,
  );
  console.log(
    `  -> affiliate-admin-settlement-batch.png (${(compressedModal.length / 1024).toFixed(1)} KB)`,
  );

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
