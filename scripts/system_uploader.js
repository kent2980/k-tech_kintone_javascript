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

    await page.goto(`${baseUrl}/k/admin/customize/`);
    // space3_desktop.js をアップロード
    await page.setInputFiles('input[type="file"]', "./dist/space3_desktop.js");
    await page.click('button[type="submit"]');
    // space3_mobile.js をアップロード
    await page.setInputFiles('input[type="file"]', "./dist/space3_mobile.js");
    await page.click('button[type="submit"]');
    // アップロードが完了したらブラウザを閉じる
    await browser.close();
})();
