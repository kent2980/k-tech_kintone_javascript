(function () {
    "use strict";

    // -----------------------------------------
    // 🗑️ アプリのトップページに全レコード削除ボタンを設置
    // -----------------------------------------

    kintone.events.on("app.record.index.show", function (event) {
        console.log("📋 一覧画面表示イベント開始");

        // ボタンが既に追加されている場合はスキップ
        if (document.getElementById("delete-all-records-button")) {
            console.log("⚠️ ボタンは既に追加されています");
            return event;
        }

        // ヘッダーのメニュースペースを取得
        const headerMenuSpace = kintone.app.getHeaderMenuSpaceElement();
        if (!headerMenuSpace) {
            console.warn("⚠️ ヘッダーメニュースペースが見つかりません");
            return event;
        }

        // 削除ボタンを作成
        const deleteButton = document.createElement("button");
        deleteButton.id = "delete-all-records-button";
        deleteButton.innerText = "🗑️ 全レコード削除";
        deleteButton.className = "kintoneplugin-button-dialog-cancel";
        deleteButton.style.marginLeft = "10px";
        deleteButton.style.padding = "8px 16px";
        deleteButton.style.cursor = "pointer";

        // ボタンクリック時の処理
        deleteButton.addEventListener("click", async function () {
            console.log("🔍 削除ボタンがクリックされました");

            // 確認ダイアログを表示
            const confirmDelete = confirm(
                "⚠️ 警告: このアプリの全てのレコードを削除します。\n\nこの操作は取り消せません。本当に削除しますか？"
            );

            if (!confirmDelete) {
                console.log("❌ 削除がキャンセルされました");
                return;
            }

            // 二重確認
            const doubleConfirm = confirm(
                "🚨 最終確認: 本当に全てのレコードを削除しますか？\n\nこの操作は元に戻せません！"
            );

            if (!doubleConfirm) {
                console.log("❌ 削除がキャンセルされました（二重確認）");
                return;
            }

            try {
                // ボタンを無効化
                deleteButton.disabled = true;
                deleteButton.innerText = "削除中...";
                console.log("🔄 削除処理を開始します");

                // 現在のアプリIDを取得
                const appId = kintone.app.getId();
                console.log("📱 アプリID:", appId);

                // 全レコードのIDを取得（最大500件ずつ）
                let allRecordIds = [];
                let offset = 0;
                const limit = 500;

                while (true) {
                    console.log(`🔍 レコード取得中... (offset: ${offset})`);

                    const response = await kintone.api(
                        kintone.api.url("/k/v1/records", true),
                        "GET",
                        {
                            app: appId,
                            fields: ["$id"],
                            query: `limit ${limit} offset ${offset}`,
                        }
                    );

                    if (response.records.length === 0) {
                        break; // これ以上レコードがない
                    }

                    const ids = response.records.map((record) => record.$id.value);
                    allRecordIds = allRecordIds.concat(ids);
                    console.log(`✅ ${ids.length}件のレコードIDを取得しました`);

                    offset += limit;
                }

                console.log(`📊 削除対象レコード数: ${allRecordIds.length}件`);

                if (allRecordIds.length === 0) {
                    alert("削除するレコードがありません");
                    deleteButton.disabled = false;
                    deleteButton.innerText = "🗑️ 全レコード削除";
                    return;
                }

                // 100件ずつ削除（kintone APIの制限）
                const deleteLimit = 100;
                let deletedCount = 0;

                for (let i = 0; i < allRecordIds.length; i += deleteLimit) {
                    const idsToDelete = allRecordIds.slice(i, i + deleteLimit);
                    console.log(
                        `🗑️ 削除中: ${i + 1}〜${Math.min(i + deleteLimit, allRecordIds.length)}件目`
                    );

                    await kintone.api(kintone.api.url("/k/v1/records", true), "DELETE", {
                        app: appId,
                        ids: idsToDelete,
                    });

                    deletedCount += idsToDelete.length;
                    deleteButton.innerText = `削除中... (${deletedCount}/${allRecordIds.length})`;
                }

                console.log(`✅ 全${deletedCount}件のレコードを削除しました`);
                alert(`✅ 全${deletedCount}件のレコードを削除しました`);

                // ページをリロードして一覧を更新
                location.reload();
            } catch (error) {
                console.error("❌ エラーが発生しました:", error);
                alert(
                    `❌ エラーが発生しました: ${error.message}\n\n詳細はコンソールを確認してください`
                );

                // ボタンを再度有効化
                deleteButton.disabled = false;
                deleteButton.innerText = "🗑️ 全レコード削除";
            }
        });

        // ファイル読み込みボタンを作成（リンクボタン）
        const appId = kintone.app.getId(); // アプリIDを動的に取得
        const domain = location.hostname; // ドメインを動的に取得
        const importButton = document.createElement("button");
        importButton.id = "import-from-file-button";
        importButton.innerText = "📁 ファイルから読み込む";
        importButton.onclick = function () {
            window.location.href = `https://${domain}/k/${appId}/importRecord`;
        };
        importButton.className = "kintoneplugin-button-dialog-cancel"; // 削除ボタンと同じスタイル
        importButton.style.marginLeft = "10px";
        importButton.style.padding = "8px 16px";
        importButton.style.cursor = "pointer";
        importButton.style.textDecoration = "none"; // 下線を消す
        importButton.style.display = "inline-block"; // ボタンのような表示

        console.log("✅ インポートリンクボタンを作成しました");

        // ヘッダーメニュースペースにボタンを追加
        headerMenuSpace.appendChild(deleteButton);
        headerMenuSpace.appendChild(importButton);
        console.log("✅ 削除ボタンと読み込みボタンを追加しました");

        return event;
    });
})();
