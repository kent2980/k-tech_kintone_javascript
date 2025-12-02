// 定数
const DEFECT_NAME_APP_ID = 53;

// 型定義
interface KintoneEvent {
    record: KintoneRecord;
    error?: string;
}

// テーブル行の値の型定義（kintoneのテーブルフィールド形式に合わせる）
interface TableRowValue extends Record<string, { value: string | number }> {
    work_type: {
        value: string;
    };
    personnel_type: {
        value: string;
    };
    man_hours: {
        value: string | number;
    };
}

type KintoneFieldValue =
    | {
          value: string | number;
      }
    | {
          value: Array<{
              value: Record<string, { value: string | number }>;
          }>;
      };

interface KintoneRecord {
    [fieldCode: string]: KintoneFieldValue;
}

interface MasterRecord {
    line_name: {
        value: string;
    };
    model_name: {
        value: string;
    };
    model_code: {
        value: string;
    };
}

/**
 * レコード作成・編集画面表示時の処理
 */
async function handleRecordShow(event: KintoneEvent): Promise<KintoneEvent> {
    const appId = 24; // 🔁 他アプリのID
    const fieldCode = "line_name"; // 🔁 保存先フィールドコード
    let allRecords: MasterRecord[] = []; // 変数をここで宣言

    // キャッシュにデータがあれば利用する
    const cachedData = sessionStorage.getItem("allRecords");
    if (cachedData) {
        allRecords = JSON.parse(cachedData) as MasterRecord[];
    }

    if (!cachedData) {
        const limit = 100;
        let offset = 0;

        // --- 1️⃣ 他アプリのレコードを取得 ---
        while (true) {
            const params = {
                app: appId,
                query: `order by line_name asc, model_name asc limit ${limit} offset ${offset}`,
                fields: ["line_name", "model_name", "model_code"], // 🔁 必要なフィールドだけにしておくと高速！
            };

            const resp = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", params);
            allRecords = allRecords.concat(resp.records as MasterRecord[]);

            if (resp.records.length < limit) break; // もう次がない
            offset += limit;
        }

        // allRecordsをsessionStorageに保存
        sessionStorage.setItem("allRecords", JSON.stringify(allRecords));
    }

    // 重複を削除（Name.valueがユニークになるように）
    const seen = new Set<string>();
    const uniqueRecords = allRecords.filter((rec) => {
        const val = rec.line_name.value;
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
    });

    // --- 2️⃣ スペースフィールドにラベルとドロップダウン作成（まとめて生成） ---
    // ライン名ドロップダウンの生成
    const lineNameSpace = kintone.app.record.getSpaceElement("line_name_drop");
    if (lineNameSpace) {
        lineNameSpace.innerHTML = ""; // 初期化

        // スペースに縦配置のスタイルを適用
        lineNameSpace.style.display = "flex";
        lineNameSpace.style.flexDirection = "column";
        lineNameSpace.style.gap = "5px";
        lineNameSpace.style.margin = "5px";

        // ラベルを作成
        const label = document.createElement("label");
        label.textContent = "ライン名: ";
        label.className = "control-label-text-gaia";
        label.style.marginBottom = "5px";
        lineNameSpace.appendChild(label);

        // ドロップダウンを作成
        const select = document.createElement("select");
        select.id = "custom_line_dropdown";
        select.className = "kintoneplugin-select gaia-argoui-select";
        lineNameSpace.appendChild(select);

        // --- 3️⃣ 選択肢を追加 ---
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "選択してください";
        defaultOption.value = "";
        select.appendChild(defaultOption);

        uniqueRecords.forEach((rec) => {
            const option = document.createElement("option");
            option.value = rec.line_name.value;
            option.textContent = rec.line_name.value;
            select.appendChild(option);
        });

        // --- 4️⃣ 選択時にレコードデータへ反映 ---
        select.addEventListener("change", () => {
            const record = kintone.app.record.get();
            const field = record.record[fieldCode] as { value: string };
            if (field) {
                field.value = select.value;
                kintone.app.record.set(record);

                // ライン名が変更されたら、モデル名ドロップダウンを更新
                updateModelNameDropdown(select.value, allRecords);
            }
        });
    }

    // モデル名ドロップダウンの生成（初期状態：空）
    const modelNameSpace = kintone.app.record.getSpaceElement("model_name_drop");
    if (modelNameSpace) {
        modelNameSpace.innerHTML = ""; // 初期化

        // スペースに縦配置のスタイルを適用
        modelNameSpace.style.display = "flex";
        modelNameSpace.style.flexDirection = "column";
        modelNameSpace.style.gap = "5px";
        modelNameSpace.style.margin = "5px";

        // ラベルを作成
        const label = document.createElement("label");
        label.textContent = "モデル名: ";
        label.className = "control-label-text-gaia";
        label.style.marginBottom = "5px";
        modelNameSpace.appendChild(label);

        // ドロップダウンを作成（初期状態は空）
        const select = document.createElement("select");
        select.id = "model_dropdown";
        select.className = "kintoneplugin-select gaia-argoui-select";
        select.disabled = true; // 初期状態は無効化
        modelNameSpace.appendChild(select);

        // デフォルトオプションを追加
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "ライン名を選択してください";
        defaultOption.value = "";
        select.appendChild(defaultOption);

        // 選択時にレコードデータへ反映
        select.addEventListener("change", () => {
            const record = kintone.app.record.get();
            const target_values = select.value.split("_");
            if (target_values.length >= 2) {
                const modelNameField = record.record["model_name"] as { value: string };
                const modelCodeField = record.record["model_code"] as { value: string };
                if (modelNameField && modelCodeField) {
                    modelNameField.value = target_values[0];
                    modelCodeField.value = target_values[1];
                    kintone.app.record.set(record);
                }
            }
        });
    }

    // --- 編集画面で既存値を反映（モデル名ドロップダウン生成後） ---
    const lineNameField = event.record[fieldCode] as { value: string } | undefined;
    if (lineNameField?.value) {
        const lineNameSelect = document.getElementById("custom_line_dropdown");
        if (lineNameSelect && lineNameSelect instanceof HTMLSelectElement) {
            lineNameSelect.value = lineNameField.value;
            // 既存値がある場合、モデル名ドロップダウンも初期化
            updateModelNameDropdown(lineNameField.value, allRecords);
        }
    }

    // --- 編集画面で既存値を反映（モデル名ドロップダウン生成後） ---
    const modelFieldCode = "model_name";
    const modelCodeFieldCode = "model_code";
    const modelNameField = event.record[modelFieldCode] as { value: string } | undefined;
    const modelCodeField = event.record[modelCodeFieldCode] as { value: string } | undefined;
    if (modelNameField?.value && modelCodeField?.value) {
        const modelNameSelect = document.getElementById("model_dropdown");
        if (modelNameSelect && modelNameSelect instanceof HTMLSelectElement) {
            modelNameSelect.value = modelNameField.value + "_" + modelCodeField.value;
        }
    }

    // 不良入力フィールドを非表示
    // setHideDefectField();

    // ルックアップボタンの取得
    const lookupButtons = document.getElementsByClassName("input-lookup-gaia");
    if (lookupButtons[0]) {
        lookupButtons[0].addEventListener(
            "click",
            function () {
                // console.log("1つ目のルックアップボタンがクリックされました");
            },
            true
        );
    }

    return event;
}

/**
 * モデル名ドロップダウンを更新する関数
 */
function updateModelNameDropdown(lineName: string, allRecords: MasterRecord[]): void {
    // 入力された値に対応するモデルコードリストを作成
    const matchedRecords = allRecords.filter((rec) => rec.line_name.value === lineName);

    // 既存のドロップダウンを取得
    const select = document.getElementById("model_dropdown");
    if (!select || !(select instanceof HTMLSelectElement)) return;

    // 選択肢をクリア（デフォルトオプション以外）
    while (select.options.length > 1) {
        select.remove(1);
    }

    if (matchedRecords.length === 0) {
        select.disabled = true;
        select.options[0].textContent = "該当するモデルがありません";
        return;
    }

    // ドロップダウンを有効化
    select.disabled = false;
    select.options[0].textContent = "選択してください";

    // matchedRecordsをモデル名で並び替え
    matchedRecords.sort((a, b) => {
        const name_compare = a.model_name.value.localeCompare(b.model_name.value);
        if (name_compare !== 0) return name_compare;
        return a.model_code.value.localeCompare(b.model_code.value);
    });

    // 選択肢を追加
    matchedRecords.forEach((rec) => {
        const option = document.createElement("option");
        option.value = `${rec.model_name.value}_${rec.model_code.value}`;
        option.textContent = `${rec.model_name.value}_${rec.model_code.value}`;
        select.appendChild(option);
    });
}

/**
 * ライン名変更時の処理
 */
function handleLineNameChange(event: KintoneEvent): KintoneEvent {
    // キャッシュからデータを取得
    const cachedData = sessionStorage.getItem("allRecords");
    if (!cachedData) {
        return event;
    }
    const allRecords = JSON.parse(cachedData) as MasterRecord[];

    // 入力された値に対応するモデルコードリストを作成
    const lineNameField = event.record.line_name as { value: string } | undefined;
    const inputLineName = lineNameField?.value || "";

    // モデル名ドロップダウンを更新
    updateModelNameDropdown(inputLineName, allRecords);

    return event;
}

/**
 * テーブル変更・送信時の工数計算処理
 */
function handleManHoursTableChange(event: KintoneEvent): KintoneEvent {
    const record = event.record;
    // テーブルフィールドを取得（KintoneFieldValueから型アサーションで取得）
    const tableField = record.man_hours_table as
        | {
              value: Array<{
                  value: Record<string, { value: string | number }>;
              }>;
          }
        | undefined;
    const table = tableField?.value || [];
    let insideFixedTimeSum = 0;
    let outsideFixedTimeSum = 0;
    let insideOvertimeSum = 0;
    let outsideOvertimeSum = 0;

    // 条件に合致する行だけ加算
    if (Array.isArray(table)) {
        table.forEach((row) => {
            // row.valueをTableRowValueとして扱う
            const rowValue = row.value as unknown as TableRowValue;
            const work_type = rowValue.work_type?.value || ""; // テーブル内フィールドコード
            const personnel_type = rowValue.personnel_type?.value || ""; // テーブル内フィールドコード
            const man_hours = Number(rowValue.man_hours?.value || 0);

            if (work_type === "通常" && personnel_type === "社内") {
                // ← ここが条件部分！
                insideFixedTimeSum += man_hours;
            }
            if (work_type === "通常" && personnel_type === "社外") {
                // ← ここが条件部分！
                outsideFixedTimeSum += man_hours;
            }
            if (work_type === "残業" && personnel_type === "社内") {
                // ← ここが条件部分！
                insideOvertimeSum += man_hours;
            }
            if (work_type === "残業" && personnel_type === "社外") {
                // ← ここが条件部分！
                outsideOvertimeSum += man_hours;
            }
        });
    }

    // フィールドが存在する場合のみ値を設定
    const insideTimeField = record.inside_time as { value: number } | undefined;
    if (insideTimeField) {
        insideTimeField.value = insideFixedTimeSum;
    }
    // フィールドが存在する場合のみ値を設定
    const outsideTimeField = record.outside_time as { value: number } | undefined;
    if (outsideTimeField) {
        outsideTimeField.value = outsideFixedTimeSum;
    }

    // フィールドが存在する場合のみ値を設定
    const insideOvertimeField = record.inside_overtime as { value: number } | undefined;
    if (insideOvertimeField) {
        insideOvertimeField.value = insideOvertimeSum;
    }

    const outsideOvertimeField = record.outside_overtime as { value: number } | undefined;
    if (outsideOvertimeField) {
        outsideOvertimeField.value = outsideOvertimeSum;
    }

    // 不良入力フィールドを非表示
    // setHideDefectField();

    return event;
}

// 不良データの型定義
interface DefectData {
    lineName: string;
    reference: string;
    defectName: string;
}

/**
 * テーブルの列ヘッダーから列インデックスを取得する
 */
function getColumnIndices(tableElement: Element, columnNames: string[]): Map<string, number> {
    const columnIndices = new Map<string, number>();
    const headerRows = tableElement.getElementsByTagName("tr");
    const targetColumnSet = new Set(columnNames);

    // ヘッダー行を検索（最初に見つかったヘッダー行で処理）
    for (const row of Array.from(headerRows)) {
        const headerCells = row.getElementsByTagName("th");
        if (headerCells.length === 0) continue;

        // 各ヘッダーセルを確認
        for (let index = 0; index < headerCells.length; index++) {
            const span = headerCells[index].getElementsByTagName("span")[0];
            if (!span) continue;

            const columnName = span.textContent?.trim() || "";
            if (targetColumnSet.has(columnName) && !columnIndices.has(columnName)) {
                columnIndices.set(columnName, index);
                // 全ての列が見つかったら早期終了
                if (columnIndices.size === columnNames.length) {
                    return columnIndices;
                }
            }
        }
        // ヘッダー行が見つかったら処理終了
        if (columnIndices.size > 0) break;
    }

    return columnIndices;
}

/**
 * テーブルから不良データを抽出する
 */
function extractDefectData(
    tableElement: Element,
    columnIndices: Map<string, number>,
    lineName: string
): DefectData[] {
    const defectList: DefectData[] = [];
    const referenceIndex = columnIndices.get("不具合場所");
    const defectNameIndex = columnIndices.get("不良名");

    // 必要な列インデックスが取得できていない場合は空配列を返す
    if (referenceIndex === undefined || defectNameIndex === undefined || !lineName) {
        return defectList;
    }

    const rows = tableElement.getElementsByTagName("tr");

    // データ行を処理（ヘッダー行をスキップ）
    for (const row of Array.from(rows)) {
        // ヘッダー行はスキップ
        if (row.getElementsByTagName("th").length > 0) continue;

        const cells = row.getElementsByClassName("input-text-cybozu");
        if (cells.length === 0) continue;

        // 必要な列の値を取得
        const referenceCell = cells[referenceIndex];
        const defectNameCell = cells[defectNameIndex];

        if (
            !(referenceCell instanceof HTMLInputElement) ||
            !(defectNameCell instanceof HTMLInputElement)
        ) {
            continue;
        }

        const referenceValue = referenceCell.value.trim();
        const defectNameValue = defectNameCell.value.trim();

        // 有効なデータのみ追加
        if (referenceValue && defectNameValue) {
            defectList.push({
                lineName: lineName,
                reference: referenceValue,
                defectName: defectNameValue,
            });
        }
    }

    return defectList;
}

/**
 * ライン名を取得する
 */
function getLineName(elementId: string): string {
    const lineNameElement = document.getElementById(elementId);
    if (lineNameElement instanceof HTMLInputElement) {
        return lineNameElement.value.trim();
    }
    return "";
}

// kintone APIレスポンスの型定義
interface KintoneApiResponse {
    records: Array<{
        [fieldCode: string]: {
            value: string;
        };
    }>;
}

/**
 * 不良名マスタへのJavaScriptAPI自動登録処理(重複レコードは登録しない)
 */
async function autoRegistrationDefectName(defectList: DefectData[]): Promise<void> {
    // データが空の場合は処理を終了
    if (defectList.length === 0) {
        return;
    }

    const DEFECT_NAME_APP_ID = 53;
    const lineName = defectList[0].lineName;

    try {
        // 既存のレコードを取得
        const params = {
            app: DEFECT_NAME_APP_ID,
            query: `lineName = "${lineName}"`,
            fields: ["lineName", "reference", "defectName"],
        };

        const response = (await kintone.api(
            kintone.api.url("/k/v1/records", true),
            "GET",
            params
        )) as KintoneApiResponse;

        const existingRecords = response.records || [];

        // 既存レコードから重複チェック用のセットを作成
        const existingRecordSet = new Set<string>();
        existingRecords.forEach((record) => {
            const reference = record.reference?.value || "";
            const defectName = record.defectName?.value || "";
            if (reference && defectName) {
                existingRecordSet.add(`${reference}_${defectName}`);
            }
        });

        // 重複していない新しいレコードのみを抽出
        const newRecords = defectList
            .filter((defect) => {
                const key = `${defect.reference}_${defect.defectName}`;
                return !existingRecordSet.has(key);
            })
            .map((defect) => ({
                lineName: { value: defect.lineName },
                reference: { value: defect.reference },
                defectName: { value: defect.defectName },
            }));

        // 新しいレコードがある場合のみ登録
        if (newRecords.length > 0) {
            await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                app: DEFECT_NAME_APP_ID,
                records: newRecords,
            });
            console.log(`${newRecords.length}件の不良データを登録しました`);
        } else {
            console.log("登録する新しい不良データはありません");
        }
    } catch (error) {
        console.error("不良名マスタへの登録処理でエラーが発生しました:", error);
        throw error; // エラーを上位に伝播
    }
}

/**
 * 不良データを準備する（changeイベント用の同期処理）
 * @param event - kintoneイベントオブジェクト
 * @returns event
 */
function prepareDefectData(event: KintoneEvent): KintoneEvent {
    // changeイベントでは同期処理のみ
    // データの準備やバリデーションは行わず、submitイベントで処理する
    return event;
}

/**
 * 不良名マスタへのJavaScriptAPIで自動登録処理(重複レコードは登録しない)
 * submitイベントでのみ実行される非同期処理
 */
async function handleDefectNameAutoRegistration(event: KintoneEvent): Promise<KintoneEvent> {
    const TARGET_COLUMNS = ["不具合場所", "不良名"];
    const LINE_NAME_ELEMENT_ID = "6_13457868-:9f-text";
    const TABLE_CLASS_NAME = "subtable-13457853";

    // ライン名を取得
    const lineName = getLineName(LINE_NAME_ELEMENT_ID);
    if (!lineName) {
        return event; // ライン名が取得できない場合は処理を終了
    }

    // テーブル要素を取得
    const subTable = document.getElementsByClassName(TABLE_CLASS_NAME)[0];
    if (!subTable) {
        return event; // テーブルが見つからない場合は処理を終了
    }

    // 列インデックスを取得
    const columnIndices = getColumnIndices(subTable, TARGET_COLUMNS);
    if (columnIndices.size !== TARGET_COLUMNS.length) {
        return event; // 必要な列が見つからない場合は処理を終了
    }

    // 不良データを抽出
    const defectList = extractDefectData(subTable, columnIndices, lineName);

    // 不良データが存在する場合のみ登録処理を実行
    if (defectList.length > 0) {
        try {
            await autoRegistrationDefectName(defectList);
        } catch (error) {
            // エラーが発生した場合はエラーメッセージを設定
            const errorMessage = error instanceof Error ? error.message : String(error);
            event.error = `不良名マスタへの登録処理でエラーが発生しました: ${errorMessage}`;
            console.error("不良名マスタ登録エラー:", error);
        }
    }

    return event;
}

/**
 * フィールドIDを取得する関数
 */
function findFieldId(fieldCode: string): string {
    let FORM_DATA = cybozu.data.page["FORM_DATA"];
    let ELEMENT_FIELD_ID = {};

    return "";
}

// ============================================================================
// ═══════════════════════════════════════════════════════════════════════════
//                         イベントハンドラーの登録
// ═══════════════════════════════════════════════════════════════════════════
// ============================================================================

// 作成・編集画面で動作
kintone.events.on(["app.record.create.show", "app.record.edit.show"], handleRecordShow);

// レコード追加 or 編集画面で、文字列フィールドが変わった時に発火
kintone.events.on(
    ["app.record.create.change.line_name", "app.record.edit.change.line_name"],
    handleLineNameChange
);

// テーブル内の値が変更されたときに発火
kintone.events.on(
    [
        "app.record.create.change.man_hours_table",
        "app.record.edit.change.man_hours_table",
        "app.record.create.change.man_hours_table.man_hours",
        "app.record.edit.change.man_hours_table.man_hours",
        "app.record.create.change.man_hours_table.work_type",
        "app.record.edit.change.man_hours_table.work_type",
        "app.record.create.submit",
        "app.record.edit.submit",
    ],
    handleManHoursTableChange
);

// 不良名マスタへの自動登録処理(重複レコードは登録しない)
// submitイベントでのみ非同期処理を実行
kintone.events.on(
    ["app.record.create.submit", "app.record.edit.submit"],
    handleDefectNameAutoRegistration
);

// changeイベントでは同期処理のみ（データ準備など）
kintone.events.on(
    [
        "app.record.create.change.deflist_table",
        "app.record.edit.change.deflist_table",
        "app.record.create.change.memo",
        "app.record.edit.change.memo",
    ],
    prepareDefectData
);
