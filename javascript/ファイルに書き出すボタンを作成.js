(function () {
    "use strict";

    // -----------------------------------------
    // 📤 ファイルに書き出すボタン（エクスポート画面へのリンク）
    // -----------------------------------------

    kintone.events.on("app.record.index.show", function (event) {
        console.log("📋 一覧画面表示イベント開始");

        // ボタンが既に追加されている場合はスキップ
        if (document.getElementById("export-to-file-button")) {
            console.log("⚠️ ボタンは既に追加されています");
            return event;
        }

        // ヘッダーのメニュースペースを取得
        const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
        if (!headerMenuSpace) {
            console.warn("⚠️ ヘッダーメニュースペースが見つかりません");
            return event;
        }

        // アプリIDとドメインを動的に取得
        const appId = kintone.app.getId();
        const domain = location.hostname;
        const protocol = location.protocol;

        // 現在のURLのクエリパラメータとハッシュを取得
        const currentSearch = window.location.search; // ?view=20&q=... の部分
        const currentHash = window.location.hash; // #sort_0=... の部分

        console.log("📱 アプリID:", appId);
        console.log("🌐 ドメイン:", domain);
        console.log("🔍 現在のクエリパラメータ:", currentSearch);
        console.log("� 現在のハッシュ:", currentHash);

        // エクスポートボタンを作成
        const exportButton = document.createElement("button");
        exportButton.id = "export-to-file-button";
        exportButton.innerText = "📤 ファイルに書き出す";
        exportButton.className = "kintoneplugin-button-normal";
        exportButton.style.marginLeft = "10px";
        exportButton.style.padding = "8px 16px";
        exportButton.style.cursor = "pointer";

        // ボタンクリック時の処理
        exportButton.addEventListener("click", function () {
            console.log("📤 ファイルに書き出すボタンがクリックされました");

            // URLパラメータを変換する関数
            function convertUrlParams(search, hash) {
                const urlParams = new URLSearchParams(search.substring(1)); // ? を除去
                const hashParams = new URLSearchParams(hash.substring(1)); // # を除去

                // viewパラメータを取得
                const view = urlParams.get("view") || "20";

                // qパラメータを取得して変換（+ を %20 に、小文字descを大文字DESCに）
                let q = urlParams.get("q") || "";
                if (q) {
                    q = q.replace(/\+/g, "%20"); // + を %20 に変換
                }

                // ハッシュパラメータからソート情報を取得
                const sort_0 = hashParams.get("sort_0") || "";
                const order_0 = (hashParams.get("order_0") || "").toUpperCase(); // 大文字に変換

                // 新しいURL形式を生成
                // ?view=20#q=...&sort_0=...&order_0=DESC
                let newSearch = `?view=${view}`;
                let newHash = "#";

                if (q) {
                    newHash += `q=${q}`;
                }
                if (sort_0) {
                    if (newHash !== "#") newHash += "&";
                    newHash += `sort_0=${sort_0}`;
                }
                if (order_0) {
                    if (newHash !== "#") newHash += "&";
                    newHash += `order_0=${order_0}`;
                }

                // ハッシュが空の場合は # を削除
                if (newHash === "#") newHash = "";

                console.log("🔄 変換前:", search + hash);
                console.log("🔄 変換後:", newSearch + newHash);

                return newSearch + newHash;
            }

            // パラメータを変換
            const convertedParams = convertUrlParams(currentSearch, currentHash);

            // エクスポート画面のURLを生成
            const exportUrl = `${protocol}//${domain}/k/${appId}/exportRecord${convertedParams}`;
            console.log("🔗 エクスポート画面URL:", exportUrl);

            // 現在のページで遷移
            window.location.href = exportUrl;
        });

        // ヘッダーメニュースペースにボタンを追加
        headerMenuSpace.appendChild(exportButton);
        console.log("✅ ファイルに書き出すボタンを追加しました");

        return event;
    });
})();
