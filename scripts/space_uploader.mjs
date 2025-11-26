import { chromium } from "playwright";

(async () => {
    const browser = await chromium.launch({ headless: true }); // ブラウザを非表示で実行
    const page = await browser.newPage();

    const baseUrl = process.env.KINTONE_BASE_URL || "";
    const username = process.env.KINTONE_USERNAME || "";
    const password = process.env.KINTONE_PASSWORD || "";

    // 環境変数の確認
    if (!baseUrl || !username || !password) {
        console.error("環境変数が設定されていません。");
        console.error("KINTONE_BASE_URL:", baseUrl || "未設定");
        console.error("KINTONE_USERNAME:", username || "未設定");
        console.error("KINTONE_PASSWORD:", password ? "***" : "未設定");
        await browser.close();
        process.exit(1);
    }

    console.log(`ログインページにアクセス: ${baseUrl}/login`);
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });

    // ページのHTMLを確認（デバッグ用）
    const pageContent = await page.content();
    console.log("ページタイトル:", await page.title());

    // 複数のセレクタを試す（実際のIDを最初に試す）
    const usernameSelectors = [
        '[id="username-:0-text"]', // 実際のID
    ];

    const passwordSelectors = [
        '[id="password-:1-text"]', // 実際のID
    ];

    const loginButtonSelectors = [
        "#login_button",
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("ログイン")',
        'button:has-text("Login")',
    ];

    // ユーザー名フィールドを探す
    let usernameFound = false;
    for (const selector of usernameSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            console.log(`ユーザー名フィールドが見つかりました: ${selector}`);
            await page.fill(selector, username);
            usernameFound = true;
            break;
        } catch (e) {
            // 次のセレクタを試す
        }
    }

    if (!usernameFound) {
        console.error(
            "ユーザー名フィールドが見つかりませんでした。ページのHTMLを確認してください。"
        );
        await page.screenshot({ path: "login-page-debug.png" });
        console.log("スクリーンショットを保存しました: login-page-debug.png");
        await browser.close();
        process.exit(1);
    }

    // パスワードフィールドを探す
    let passwordFound = false;
    for (const selector of passwordSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            console.log(`パスワードフィールドが見つかりました: ${selector}`);
            await page.fill(selector, password);
            passwordFound = true;
            break;
        } catch (e) {
            // 次のセレクタを試す
        }
    }

    if (!passwordFound) {
        console.error("パスワードフィールドが見つかりませんでした。");
        await browser.close();
        process.exit(1);
    }

    // ログインボタンを探す
    let loginButtonFound = false;
    for (const selector of loginButtonSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            console.log(`ログインボタンが見つかりました: ${selector}`);
            await page.click(selector);
            loginButtonFound = true;
            break;
        } catch (e) {
            // 次のセレクタを試す
        }
    }

    if (!loginButtonFound) {
        console.error("ログインボタンが見つかりませんでした。");
        await browser.close();
        process.exit(1);
    }

    // ログイン後の遷移を待機（ルートURLに遷移する）
    await page.waitForURL(
        (url) => {
            // ルートURLまたは/k/で始まるURLに遷移したら成功
            const normalizedBaseUrl = baseUrl.replace(/\/$/, ""); // 末尾のスラッシュを削除
            return (
                url.href === `${normalizedBaseUrl}/` ||
                url.href === normalizedBaseUrl ||
                url.href.includes("/k/")
            );
        },
        { timeout: 10000 }
    );
    console.log("ログイン成功");

    console.log("カスタマイズ管理画面にアクセス");
    await page.goto(`${baseUrl}/k/admin/system/customize/`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
    });
    // ページが読み込まれるまで少し待機
    await page.waitForTimeout(2000);

    // 既存のファイルを削除
    // class="sc-hkNuZK eCOLDh_deleteButton"属性のボタン全てを探してクリックする
    const deleteButtons = await page.$$('button[class="sc-hkNuZK eCOLDh_deleteButton"]');
    for (const deleteButton of deleteButtons) {
        await deleteButton.click();
        await page.waitForTimeout(2000); // 削除完了を待機
    }

    // space_desktop.js をアップロード
    console.log("space_desktop.js をアップロード中...");
    // data-testid属性がAddFileItem-DESKTOPのdivを探す
    await page.waitForSelector('div[data-testid="AddFileItem-DESKTOP"]', { timeout: 10000 });
    // div[data-testid="AddFileItem-DESKTOP"]の中のinput[type="file"]を探す
    await page.waitForSelector('div[data-testid="AddFileItem-DESKTOP"] input[type="file"]', {
        timeout: 10000,
    });
    await page.setInputFiles(
        'div[data-testid="AddFileItem-DESKTOP"] input[type="file"]',
        "./dist/space_desktop.js"
    );
    await page.waitForTimeout(2000); // アップロード完了を待機

    // space_mobile.js をアップロード
    console.log("space_mobile.js をアップロード中...");
    await page.waitForSelector('div[data-testid="AddFileItem-MOBILE"]', { timeout: 10000 });
    await page.waitForSelector('div[data-testid="AddFileItem-MOBILE"] input[type="file"]', {
        timeout: 10000,
    });
    await page.setInputFiles(
        'div[data-testid="AddFileItem-MOBILE"] input[type="file"]',
        "./dist/space_mobile.js"
    );
    await page.waitForTimeout(2000); // アップロード完了を待機

    console.log("アップロード完了");

    console.log("保存ボタンを押します");
    await page.waitForSelector('form[data-testid="ActionMenu_form"]', { timeout: 10000 });
    await page.waitForSelector('form[data-testid="ActionMenu_form"] input[type="submit"]', {
        timeout: 10000,
    });
    await page.click('form[data-testid="ActionMenu_form"] input[type="submit"]');
    await page.waitForTimeout(2000); // 保存完了を待機

    // 保存ボタンを押す
    // data-testid="ActionMenu_form"属性のformを探して,formの中のinput[type="submit"]を探してクリックする
    // アップロードが完了したらブラウザを閉じる
    await browser.close();
})().catch((error) => {
    console.error("エラーが発生しました:", error);
    process.exit(1);
});
