// テーブルフィールドと文字列フィールドのペアを定義
interface TableFieldPair {
    tableField: string;
    stringField: string;
}

const tableFieldPairs: TableFieldPair[] = [
    { tableField: "man_hours_table", stringField: "man_hours_text" },
    { tableField: "chg_o_table", stringField: "chg_o_text" },
    { tableField: "deflist_table", stringField: "deflist_text" },
];

// テーブルデータの型定義
interface TableRow {
    value: Record<string, TableFieldValue>;
}

type TableFieldValue =
    | string
    | number
    | {
          value?: string | number | FileFieldValue[];
          type?: string;
      };

interface FileFieldValue {
    name: string;
    [key: string]: unknown;
}

// Kintoneレコードの型定義
interface KintoneRecord {
    [fieldCode: string]: {
        value: unknown;
    };
}

// Kintoneイベントの型定義
interface KintoneEvent {
    record: KintoneRecord;
    error?: string;
}

// ----- 関数：テーブル内のテキストボックスを入力可能にする -----
function makeTableTextEditable(): void {
    // テーブルを取得
    const tableElement = document.getElementsByClassName(
        "subtable-gaia subtable-13457853 edit-subtable-gaia"
    )[0] as HTMLElement | undefined;
    // テーブルが存在しない場合は処理を終了
    if (!tableElement) return;

    // テーブル内のinput要素を全て取得
    const inputElements = tableElement.querySelectorAll<HTMLInputElement>("input");

    if (inputElements.length === 0) return;
    // input要素を繰り返し処理
    inputElements.forEach((inputElement) => {
        // input要素のreadonly属性を削除
        inputElement.removeAttribute("readonly");
        inputElement.disabled = false; // 入力可能にする
    });
}

// テーブルデータをシリアライズする関数
/**
 * @param tableData - テーブルデータ
 * @returns シリアライズされた文字列
 */
function serializeTable(tableData: TableRow[] | undefined | null): string {
    if (!tableData || !Array.isArray(tableData)) {
        return "";
    }

    const serializedRows = tableData.map((row) => {
        const values: string[] = [];
        // 各行の値を取得（カラム名は除外し、値のみ）
        for (const fieldCode in row.value) {
            const fieldValue = row.value[fieldCode];
            let value = "";

            // フィールドタイプに応じて値を取得
            if (fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue)) {
                if ("value" in fieldValue && fieldValue.value !== undefined) {
                    value = String(fieldValue.value);
                } else if (
                    "type" in fieldValue &&
                    fieldValue.type === "FILE" &&
                    "value" in fieldValue &&
                    fieldValue.value
                ) {
                    // ファイルフィールドの場合はファイル名を取得
                    const fileArray = Array.isArray(fieldValue.value)
                        ? (fieldValue.value as FileFieldValue[])
                        : [];
                    value = fileArray.map((file) => file.name).join(",");
                }
            } else {
                value = String(fieldValue || "");
            }
            values.push(value);
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
 * @param record - レコードオブジェクト
 * @returns 処理後のレコードオブジェクト
 */
function processAllTablePairs(record: KintoneRecord): KintoneRecord {
    tableFieldPairs.forEach((pair) => {
        const { tableField, stringField } = pair;

        // テーブルフィールドが存在するかチェック
        const tableFieldData = record[tableField];
        if (tableFieldData && tableFieldData.value) {
            const tableData = tableFieldData.value as TableRow[];
            const serializedData = serializeTable(tableData);

            // 文字列フィールドが存在するかチェック
            if (record[stringField]) {
                record[stringField].value = serializedData;
            }
        }
    });

    return record;
}

// ----- イベント：作成・編集画面表示時 -----
kintone.events.on(
    ["app.record.create.show", "app.record.edit.show"],
    (event: KintoneEvent) => {
        makeTableTextEditable();
        return event;
    }
);

// レコード保存前にシリアライズ処理を実行
kintone.events.on(
    ["app.record.create.submit", "app.record.edit.submit"],
    (event: KintoneEvent) => {
        try {
            event.record = processAllTablePairs(event.record);
        } catch (err) {
            // エラーが発生した場合は保存を中止
            const errorMessage = err instanceof Error ? err.message : String(err);
            event.error = "シリアライズ処理でエラーが発生しました: " + errorMessage;
        }

        return event;
    }
);

// テーブルフィールドの値が変更された時にもシリアライズ処理を実行
const tableChangeEvents: string[] = [];
tableFieldPairs.forEach((pair) => {
    tableChangeEvents.push(`app.record.create.change.${pair.tableField}`);
    tableChangeEvents.push(`app.record.edit.change.${pair.tableField}`);
});

kintone.events.on(tableChangeEvents, (event: KintoneEvent) => {
    // テーブル内のテキストボックスを入力可能にする
    makeTableTextEditable();

    try {
        event.record = processAllTablePairs(event.record);
        kintone.app.record.set(event);
    } catch {
        // エラーは無視
    }

    return event;
});

