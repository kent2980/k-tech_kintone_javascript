(function () {
    "use strict";

    // -----------------------------------------
    // 📅 日付を指定してレコードを絞り込むボタン
    // -----------------------------------------

    kintone.events.on("app.record.index.show", function (event) {
        // ボタンが既に追加されている場合はスキップ
        if (document.getElementById("filter-by-date-button")) {
            return event;
        }

        // ヘッダーのメニュースペースを取得
        const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
        if (!headerMenuSpace) {
            return event;
        }

        // コンテナを作成
        const container = document.createElement("div");
        container.style.display = "inline-flex";
        container.style.alignItems = "center";
        container.style.marginLeft = "10px";
        container.style.gap = "8px";

        // 日付入力フィールドを作成
        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.id = "filter-date-input";
        dateInput.style.padding = "6px 12px";
        dateInput.style.border = "1px solid #ccc";
        dateInput.style.borderRadius = "3px";
        dateInput.style.fontSize = "14px";
        dateInput.style.cursor = "pointer";

        // URLパラメータから日付を抽出する関数
        function getDateFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const q = urlParams.get("q");

            if (q) {
                // qパラメータから日付を抽出（例: "f13457549 = \"2025-10-20\"" から "2025-10-20" を抽出）
                const dateMatch = q.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    return dateMatch[1];
                }
            }
            return null;
        }

        // URLパラメータから日付を取得、なければ今日の日付を設定
        const urlDate = getDateFromURL();
        if (urlDate) {
            dateInput.value = urlDate;
        } else {
            // 今日の日付をデフォルト値に設定
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            dateInput.value = `${year}-${month}-${day}`;
        }

        // 絞り込みボタンを作成
        const filterButton = document.createElement("button");

        filterButton.id = "filter-by-date-button";
        filterButton.innerText = "🔍 生産日で絞り込む";
        filterButton.className = "kintoneplugin-button-normal";
        filterButton.style.padding = "8px 16px";
        filterButton.style.cursor = "pointer";

        // クリアボタンを作成
        const clearButton = document.createElement("button");
        clearButton.id = "clear-filter-button";
        clearButton.innerText = "✖ クリア";
        clearButton.className = "kintoneplugin-button-dialog-cancel";
        clearButton.style.padding = "8px 16px";
        clearButton.style.cursor = "pointer";

        // 絞り込みボタンのクリックイベント
        filterButton.addEventListener("click", function () {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                alert("⚠️ 日付を選択してください");
                return;
            }

            // アプリID、ドメイン、プロトコルを動的に取得
            const appId = kintone.app.getId();
            const domain = location.hostname;
            const protocol = location.protocol;

            // 日付フィールドコード（例: f13457549）
            // ※実際のフィールドコードに変更してください
            const dateFieldCode = "f13457549";

            // URLパラメータを構築
            const params = new URLSearchParams();
            params.set("view", "20"); // ビューID
            params.set("q", `${dateFieldCode} = "${selectedDate}"`); // 日付クエリ

            // ハッシュパラメータを構築
            const hashParams = new URLSearchParams();
            hashParams.set("sort_0", "f13457512"); // ソートフィールド
            hashParams.set("order_0", "desc"); // 降順
            hashParams.set("size", "1000"); // 表示件数

            // 完全なURLを生成
            const newUrl = `${protocol}//${domain}/k/${appId}/?${params.toString()}#${hashParams.toString()}`;

            // ページを遷移
            window.location.href = newUrl;
        });

        // クリアボタンのクリックイベント
        clearButton.addEventListener("click", function () {
            // クエリなしでページをリロード
            const appId = kintone.app.getId();
            const domain = location.hostname;
            const protocol = location.protocol;
            const newUrl = `${protocol}//${domain}/k/${appId}/`;

            window.location.href = newUrl;
        });

        // コンテナにコントロールを追加
        container.appendChild(dateInput);
        container.appendChild(filterButton);
        container.appendChild(clearButton);

        // ヘッダーメニュースペースにコンテナを追加
        headerMenuSpace.appendChild(container);

        return event;
    });
})();
