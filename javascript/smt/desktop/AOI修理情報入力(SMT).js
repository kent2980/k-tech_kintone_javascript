(function () {
    "use strict";

    // レコード追加・編集画面で発火
    kintone.events.on(["app.record.create.show", "app.record.edit.show"], function (event) {
        // 編集ボタンエリア
        const editButtonArea = document.getElementById("user-js-button-space-RelatedRecords");
        if (!editButtonArea) {
            return event;
        }
        // 編集ボタンエリアにボタンを追加
        const customButton = document.createElement("button");
        customButton.id = "custom-edit-button";
        customButton.innerText = "編集";
        editButtonArea.appendChild(customButton);
        return event;
    });

    // 編集ボタンをクリックしたときの処理
    document.addEventListener("click", function (e) {
        // @ts-ignore - e.targetはHTMLElementとして扱う
        if (e.target && e.target.id === "custom-edit-button") {
            // 関連レコードエリアをquerySelectorで取得
            const relatedRecordsWrapper = document.querySelector(
                ".control-reference_table-field-gaia"
            );

            if (!relatedRecordsWrapper) {
                return;
            }

            // 関連レコードラベルを取得
            const relatedRecordsTitle = relatedRecordsWrapper.querySelector(".label-13457485");

            // relatedRecordsTitleをクローン
            let clonedTitle = null;
            if (relatedRecordsTitle) {
                clonedTitle = relatedRecordsTitle.cloneNode(true);
            }

            // 関連レコード一覧テーブルエリアを取得
            const relatedRecordsTableWrapper =
                relatedRecordsWrapper.querySelector(".value-13457485");

            if (!relatedRecordsTableWrapper) {
                return;
            }

            // tableタグを取得
            const relatedRecordsTable = relatedRecordsTableWrapper.querySelector("table");

            if (relatedRecordsTable) {
                // カスタムテーブルエリアを取得
                const customTableArea = document.getElementById(
                    "user-js-custom-table-space-RelatedRecords"
                );

                if (customTableArea) {
                    // テーブルのクローンを作成してコピー
                    const clonedTable = relatedRecordsTable.cloneNode(true);

                    // clonedTableからtbody内の全てのtr要素を取得
                    // @ts-ignore - cloneNodeの結果はHTMLElementとして扱う
                    const clonedRows = clonedTable.querySelectorAll("tbody tr");

                    clonedRows.forEach(
                        /** @param {any} row */ (row) => {
                            const cells = row.querySelectorAll("td");

                            // 7列目（インデックス6）を取得
                            if (cells.length >= 7) {
                                const cell7 = cells[6]; // 0始まりなので6が7列目
                                const currentValue = cell7.textContent.trim();

                                // ドロップダウン（select要素）を作成
                                const select = document.createElement("select");
                                select.style.width = "calc(100% - 8px)"; // マージン分を考慮
                                select.style.padding = "4px 8px";
                                select.style.margin = "4px";
                                select.style.verticalAlign = "middle";
                                select.style.boxSizing = "border-box";

                                // オプションを追加（空白オプションを削除）
                                const options = ["C/R", "異形"];
                                options.forEach((optionValue) => {
                                    const option = document.createElement("option");
                                    option.value = optionValue;
                                    option.textContent = optionValue;

                                    // 現在の値と一致する場合は選択状態にする
                                    // 一致しない場合は初期値として「C/R」を選択
                                    if (currentValue && optionValue === currentValue) {
                                        option.selected = true;
                                    } else if (!currentValue && optionValue === "C/R") {
                                        option.selected = true;
                                    }

                                    select.appendChild(option);
                                });

                                // セルのスタイルを調整（中央寄せ）
                                cell7.style.textAlign = "center";
                                cell7.style.verticalAlign = "middle";
                                cell7.style.padding = "0";

                                // セルの内容をクリアしてドロップダウンを追加
                                cell7.innerHTML = "";
                                cell7.appendChild(select);
                            }
                        }
                    );

                    // カスタムテーブルエリアの既存の内容をクリア
                    customTableArea.innerHTML = "";

                    // クローンしたタイトルを追加（存在する場合のみ）
                    if (clonedTitle) {
                        customTableArea.appendChild(clonedTitle);
                    }

                    // クローンしたテーブルを追加
                    customTableArea.appendChild(clonedTable);

                    // 保存・キャンセルボタンをcustomTableAreaに作成
                    const buttonContainer = document.createElement("div");
                    buttonContainer.style.marginTop = "10px";

                    const saveButton = document.createElement("button");
                    saveButton.id = "custom-save-button";
                    saveButton.innerText = "保存";
                    saveButton.style.marginRight = "10px";

                    const cancelButton = document.createElement("button");
                    cancelButton.id = "custom-cancel-button";
                    cancelButton.innerText = "キャンセル";

                    // 保存ボタンのクリックイベントを追加
                    saveButton.addEventListener("click", () => {
                        const appId = 15;

                        // 空のリストを作成
                        /** @type {any[]} */
                        const updatedRecords = [];

                        // clonedTableからtbody内の全てのtr要素を取得
                        // @ts-ignore - HTMLElementとして扱う
                        const updatedRows = clonedTable.querySelectorAll("tbody tr");

                        updatedRows.forEach(
                            /** @param {any} row */ (row) => {
                                const cells = row.querySelectorAll("td");

                                // listTable-action-gaiaクラスを持つaタグを探す
                                const actionLink = row.querySelector("a.listTable-action-gaia");
                                let recordId = null;
                                if (actionLink) {
                                    // href属性からレコードIDを抽出
                                    const href = actionLink.getAttribute("href");
                                    if (href) {
                                        const match = href.match(/record=(\d+)/);
                                        if (match && match[1]) {
                                            recordId = match[1];
                                        }
                                    }
                                }

                                // 7列目（インデックス6）のドロップダウンの選択値を取得
                                let dropdownValue = null;
                                if (cells.length >= 7) {
                                    const cell7 = cells[6];
                                    const select = cell7.querySelector("select");
                                    if (select) {
                                        dropdownValue = select.value;
                                    }
                                }
                                // 更新用オブジェクトを作成してリストに追加
                                updatedRecords.push({
                                    id: recordId,
                                    dropdownValue: dropdownValue,
                                });
                            }
                        );
                        // ここでupdatedRecordsを使って保存処理を実装する
                        const body = {
                            app: appId,
                            records: updatedRecords.map((record) => ({
                                id: record.id,
                                record: {
                                    parts_type: {
                                        value: record.dropdownValue,
                                    },
                                },
                            })),
                        };

                        kintone
                            .api(kintone.api.url("/k/v1/records", true), "PUT", body)
                            .then(function () {
                                // 更新成功
                            })
                            .catch(function () {
                                // 更新失敗
                            });
                        // 作成したカスタムエリアをクリアして元の関連レコードエリアを表示
                        customTableArea.innerHTML = "";
                        // @ts-ignore - HTMLElementとして扱う
                        relatedRecordsWrapper.style.display = "block";
                        // 編集ボタンを再表示
                        const editButton = document.getElementById("custom-edit-button");
                        if (editButton) {
                            // @ts-ignore - HTMLElementとして扱う
                            editButton.style.display = "inline-block";
                        }
                        //updatedRecordsを使ってUIを更新
                        const updatedTableRows = relatedRecordsTable.querySelectorAll("tr");
                        // updatedTableRowsをループしてaタグからレコードIDを取得し、対応するupdatedRecordsの値で7列目を更新
                        updatedTableRows.forEach((row) => {
                            const actionLink = row.querySelector("a.listTable-action-gaia");
                            let recordId = null;
                            if (actionLink) {
                                const href = actionLink.getAttribute("href");
                                if (href) {
                                    const match = href.match(/record=(\d+)/);
                                    if (match && match[1]) {
                                        recordId = match[1];
                                    }
                                }
                            }
                            const recordUpdate = updatedRecords.find((rec) => rec.id === recordId);
                            if (recordUpdate) {
                                const cells = row.querySelectorAll("td");
                                if (cells.length >= 7) {
                                    cells[6].textContent = recordUpdate.dropdownValue;
                                }
                            }
                        });
                    });

                    // キャンセルボタンのクリックイベントを追加
                    cancelButton.addEventListener("click", () => {
                        // ここにキャンセル処理を実装
                        // 作成したカスタムエリアをクリアして元の関連レコードエリアを表示
                        customTableArea.innerHTML = "";
                        // @ts-ignore - HTMLElementとして扱う
                        relatedRecordsWrapper.style.display = "block";
                        // 編集ボタンを再表示
                        const editButton = document.getElementById("custom-edit-button");
                        if (editButton) {
                            // @ts-ignore - HTMLElementとして扱う
                            editButton.style.display = "inline-block";
                        }
                    });

                    buttonContainer.appendChild(saveButton);
                    buttonContainer.appendChild(cancelButton);
                    customTableArea.appendChild(buttonContainer);

                    // 元の関連レコードエリアをスタイルを変えずに非表示にする
                    // @ts-ignore - HTMLElementとして扱う
                    relatedRecordsWrapper.style.display = "none";
                    // 編集ボタンを非表示にする
                    const editButton = document.getElementById("custom-edit-button");
                    if (editButton) {
                        // @ts-ignore - HTMLElementとして扱う
                        editButton.style.display = "none";
                    }
                }
            }
        }
    });
})();
