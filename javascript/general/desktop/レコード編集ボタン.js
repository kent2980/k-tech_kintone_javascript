(function () {
    "use strict";

    // -----------------------------------------
    // 📝 レコード一覧に編集ボタンを追加
    // 各レコード行に「編集」ボタンを表示し、
    // クリックすると編集画面に遷移します
    // -----------------------------------------

    kintone.events.on("app.record.index.show", function (event) {
        // 現在のアプリIDとビューIDを取得
        const appId = kintone.app.getId();
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get("view") || "20";

        // 編集ボタンを追加する関数
        function addEditButtons() {
            // 既にボタンが追加されている場合はスキップ
            if (document.querySelector(".custom-edit-button")) {
                return;
            }

            // レコード行を取得
            const recordRows = document.querySelectorAll(".recordlist-row-gaia, tr.recordlist-row");

            if (recordRows.length === 0) {
                return false;
            }

            let buttonAddedCount = 0;

            recordRows.forEach(function (row) {
                // レコードIDを取得(.recordlist-record_id-gaiaクラスのテキストから)
                let recordId = row.querySelector(".recordlist-record_id-gaia")?.textContent;

                // data-record-id属性がない場合、他の方法で取得を試みる
                if (!recordId) {
                    // チェックボックスのvalue属性から取得
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    if (checkbox && checkbox instanceof HTMLInputElement) {
                        recordId = checkbox.value;
                    }
                }

                if (!recordId) {
                    return;
                }

                // 編集ボタンを作成
                const editButton = document.createElement("button");
                editButton.textContent = "編集";
                editButton.className = "custom-edit-button";
                editButton.style.padding = "4px 12px";
                editButton.style.marginLeft = "8px";
                editButton.style.backgroundColor = "#3498db";
                editButton.style.color = "#fff";
                editButton.style.border = "none";
                editButton.style.borderRadius = "3px";
                editButton.style.cursor = "pointer";
                editButton.style.fontSize = "12px";
                editButton.style.fontWeight = "bold";

                // ホバー効果
                editButton.addEventListener("mouseenter", function () {
                    this.style.backgroundColor = "#2980b9";
                });
                editButton.addEventListener("mouseleave", function () {
                    this.style.backgroundColor = "#3498db";
                });

                // クリックイベント：編集画面に遷移
                editButton.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // 編集画面のURLを生成
                    const editUrl = `${window.location.protocol}//${window.location.host}/k/${appId}/show#record=${recordId}&l.view=${viewId}&l.q&l.next=0&l.prev=0&mode=edit`;

                    // 編集画面に遷移
                    window.location.href = editUrl;
                });

                // ボタンを行の最初のセルに追加
                const firstCell = row.querySelector("td");
                if (firstCell) {
                    // セルの表示を調整
                    firstCell.style.display = "flex";
                    firstCell.style.alignItems = "center";

                    // ボタンを追加するためのコンテナを作成
                    const buttonContainer = document.createElement("div");
                    buttonContainer.style.display = "inline-flex";
                    buttonContainer.style.alignItems = "center";
                    buttonContainer.appendChild(editButton);

                    firstCell.appendChild(buttonContainer);
                    buttonAddedCount++;
                }
            });

            if (buttonAddedCount > 0) {
                return true;
            }
            return false;
        }

        // 複数回試行する
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(function () {
            attempts++;

            if (addEditButtons()) {
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 300); // 300msごとに試行

        return event;
    });
})();
