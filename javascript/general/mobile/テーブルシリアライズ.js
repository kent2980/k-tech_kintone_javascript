(function () {
    "use strict";

    // テーブルフィールドと文字列フィールドのペアを定義
    const tableFieldPairs = [
        { tableField: "man_hours_table", stringField: "man_hours_text" },
        { tableField: "chg_o_table", stringField: "chg_o_text" },
        { tableField: "deflist_table", stringField: "deflist_text" },
    ];

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
                        value = fileArray.map((file) => file.name).join(",");
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
                    console.log(`${tableField} → ${stringField}: シリアライズ完了`);
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

    console.log(`アプリID: ${currentAppId}, ドメイン: ${currentDomain}`);

    // レコード保存前にシリアライズ処理を実行
    kintone.events.on(
        ["mobile.app.record.create.submit", "mobile.app.record.edit.submit"],
        function (event) {
            console.log("レコード保存前のシリアライズ処理を開始...");

            try {
                event.record = processAllTablePairs(event.record);
                console.log("保存前シリアライズ処理が完了しました");
            } catch (error) {
                console.error("保存前シリアライズ処理でエラーが発生しました:", error);
                // エラーが発生した場合は保存を中止
                const errorMessage = error instanceof Error ? error.message : String(error);
                event.error = "シリアライズ処理でエラーが発生しました: " + errorMessage;
            }

            return event;
        }
    );

    // テーブルフィールドの値が変更された時にもシリアライズ処理を実行
    /** @type {string[]} */
    const tableChangeEvents = [];
    tableFieldPairs.forEach((pair) => {
        tableChangeEvents.push(`mobile.app.record.create.change.${pair.tableField}`);
        tableChangeEvents.push(`mobile.app.record.edit.change.${pair.tableField}`);
    });

    kintone.events.on(tableChangeEvents, function (event) {
        console.log("テーブルフィールドの変更を検知しました");

        try {
            event.record = processAllTablePairs(event.record);
            kintone.app.record.set(event);
            console.log("リアルタイムシリアライズ処理が完了しました");
        } catch (error) {
            console.error("リアルタイムシリアライズ処理でエラーが発生しました:", error);
        }

        return event;
    });

    console.log("テーブルシリアライズ機能が初期化されました");
    console.log("対象ペア:", tableFieldPairs);
})();
