import { chromium } from "playwright";

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const baseUrl = process.env.KINTONE_BASE_URL || "";
    const username = process.env.KINTONE_USERNAME || "";
    const password = process.env.KINTONE_PASSWORD || "";

    await page.goto(`${baseUrl}/login`);
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("#login_button");

    await page.goto("https://xxx.cybozu.com/k/admin/customize/");
    await page.setInputFiles('input[type="file"]', "./dist/desktop.js");
    await page.click('button[type="submit"]');

    await browser.close();
})();
