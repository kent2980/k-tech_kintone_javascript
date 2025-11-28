(function () {
    "use strict";

    // テーブルフィールドと文字列フィールドのペアを定義
    const tableFieldPairs = [
        { tableField: "man_hours_table", stringField: "man_hours_text" },
        { tableField: "chg_o_table", stringField: "chg_o_text" },
        { tableField: "deflist_table", stringField: "deflist_text" },
    ];
    // 設定：テーブルとテキストボックスのフィールドコード
    var TABLE_FIELD_CODE = "production_number"; // テーブルのフィールドコード
    var TEXT_FIELD_CODE = "defect_name"; // テーブル内のテキストボックスのフィールドコード

    // ----- 関数：テーブル内のテキストボックスを入力可能にする -----
    function makeTableTextEditable(record) {
        console.log("テーブル内のテキストボックスを入力可能にする");

        // テーブルを取得
        const tableElement = document.getElementsByClassName(
            "subtable-gaia subtable-13457853 edit-subtable-gaia"
        )[0];
        console.log(tableElement);
        // テーブルが存在しない場合は処理を終了
        if (!tableElement) return;

        // テーブル内のinput要素を全て取得
        const inputElements = tableElement.querySelectorAll("input");

        if (inputElements.length === 0) return;
        // input要素を繰り返し処理
        inputElements.forEach((inputElement) => {
            console.log(inputElement);
            // input要素のreadonly属性を削除
            inputElement.removeAttribute("readonly");
            inputElement.disabled = false; // 入力可能にする
        });
    }
    // テーブルデータをシリアライズする関数
    /**
     * @param {any} tableData - テーブルデータ
     * @returns {string} シリアライズされた文字列
     */
    function serializeTable(tableData) {
        if (!tableData || !Array.isArray(tableData)) {
            return "";
        }

        const serializedRows = tableData.map((row) => {
            const values = [];
            // 各行の値を取得（カラム名は除外し、値のみ）
            for (const fieldCode in row.value) {
                const fieldValue = row.value[fieldCode];
                let value = "";

                // フィールドタイプに応じて値を取得
                if (fieldValue && typeof fieldValue === "object") {
                    if (fieldValue.value !== undefined) {
                        value = fieldValue.value;
                    } else if (fieldValue.type === "FILE" && fieldValue.value) {
                        // ファイルフィールドの場合はファイル名を取得
                        /** @type {any[]} */
                        const fileArray = Array.isArray(fieldValue.value) ? fieldValue.value : [];
                        value = fileArray
                            .map(/** @param {any} file */ (file) => file.name)
                            .join(",");
                    }
                } else {
                    value = fieldValue || "";
                }
                values.push(String(value));
            }
            // 列の区分は「_」
            return values.join("_");
        });

        // serializedRowsの要素のうち'_'のみの要素を削除
        const filteredRows = serializedRows.filter((row) => row.replace(/_/g, "") !== "");

        // filteredRowsの要素が空の場合は空文字を返す
        if (filteredRows.length === 0) {
            return "";
        }

        // 行の区分は「$」
        return filteredRows.join("$");
    }

    // すべてのペアに対してシリアライズ処理を適用
    /**
     * @param {any} record - レコードオブジェクト
     * @returns {any} 処理後のレコードオブジェクト
     */
    function processAllTablePairs(record) {
        tableFieldPairs.forEach((pair) => {
            const { tableField, stringField } = pair;

            // テーブルフィールドが存在するかチェック
            if (record[tableField] && record[tableField].value) {
                const serializedData = serializeTable(record[tableField].value);

                // 文字列フィールドが存在するかチェック
                if (record[stringField]) {
                    record[stringField].value = serializedData;
                } else {
                    console.log(`警告: ${stringField}フィールドが存在しません`);
                }
            } else {
                console.log(`警告: ${tableField}フィールドが存在しないか空です`);
            }
        });

        return record;
    }

    // アプリIDとドメインを動的に取得
    const currentAppId = kintone.app.getId();
    const currentDomain = location.hostname;

    // ----- イベント：作成・編集画面表示時 -----
    kintone.events.on(["app.record.create.show", "app.record.edit.show"], function (event) {
        makeTableTextEditable(event.record);
        return event;
    });

    // // ----- イベント：テーブル行が追加された時 -----
    // kintone.events.on(
    //     [
    //         "app.record.create.change." + TABLE_FIELD_CODE,
    //         "app.record.edit.change." + TABLE_FIELD_CODE,
    //     ],
    //     function (event) {
    //         makeTableTextEditable(event.record);
    //         return event;
    //     }
    // );

    // レコード保存前にシリアライズ処理を実行
    kintone.events.on(["app.record.create.submit", "app.record.edit.submit"], function (event) {
        try {
            event.record = processAllTablePairs(event.record);
        } catch (error) {
            console.error("保存前シリアライズ処理でエラーが発生しました:", error);
            // エラーが発生した場合は保存を中止
            const errorMessage = error instanceof Error ? error.message : String(error);
            event.error = "シリアライズ処理でエラーが発生しました: " + errorMessage;
        }

        return event;
    });

    // テーブルフィールドの値が変更された時にもシリアライズ処理を実行
    /** @type {string[]} */
    const tableChangeEvents = [];
    tableFieldPairs.forEach((pair) => {
        tableChangeEvents.push(`app.record.create.change.${pair.tableField}`);
        tableChangeEvents.push(`app.record.edit.change.${pair.tableField}`);
    });

    kintone.events.on(tableChangeEvents, function (event) {
        // テーブル内のテキストボックスを入力可能にする
        makeTableTextEditable(event.record);

        try {
            event.record = processAllTablePairs(event.record);
            kintone.app.record.set(event);
        } catch (error) {
            console.error("リアルタイムシリアライズ処理でエラーが発生しました:", error);
        }

        return event;
    });
})();
