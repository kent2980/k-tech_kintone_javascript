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
 * @param event - kintoneイベントオブジェクト
 * @returns event
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

    if (lookupButtons[1]) {
        lookupButtons[1].addEventListener(
            "click",
            function () {
                // テーブル要素がDOMに追加されるまで待機
                waitForTableElement();
            },
            true
        );
    }

    /**
     * テーブル要素から、いずれかのセルのtextContentが指定されたライン名と一致しない行を非表示にする
     * @param table - 対象のテーブル要素
     * @param lineName - フィルタリングに使用するライン名
     */
    function hideTableRowByLineName(table: HTMLTableElement, lineName: string): void {
        // ライン名が未選択の場合は何もしない
        if (lineName === "") {
            return;
        }
        // テーブル要素から行を取得
        const rows = table.getElementsByTagName("tr");
        for (const row of rows) {
            const cells = row.getElementsByTagName("div");
            let found = false;
            for (const cell of cells) {
                if (cell.textContent === lineName) {
                    row.style.display = "table-row";
                    found = true;
                    break;
                }
            }
            if (!found) {
                row.style.display = "none";
            }
        }
    }

    /**
     * テーブルに新しい行が追加されたタイミングでフィルタ処理を再実行するための監視を設定
     * @param table - 対象のテーブル要素
     */
    function observeTableRows(table: HTMLTableElement): void {
        const tbody = table.tBodies[0];
        if (!tbody) {
            return;
        }
        // 現在選択中のライン名を取得
        const lineNameSelect = document.getElementById("custom_line_dropdown");
        if (!lineNameSelect || !(lineNameSelect instanceof HTMLSelectElement)) {
            console.error("ライン名ドロップダウンが見つかりません");
            return;
        }
        const lineName = lineNameSelect.value;
        // 最初に一度フィルタを実行
        hideTableRowByLineName(table, lineName);

        const rowObserver = new MutationObserver(function () {
            // 行が追加・削除されたら再度フィルタを実行
            hideTableRowByLineName(table, lineName);
        });

        rowObserver.observe(tbody, {
            childList: true, // 行（tr）の追加・削除を監視
        });
    }

    /**
     * テーブル要素がDOMに追加されるまで待機する関数
     */
    function waitForTableElement(): void {
        // 既に存在する場合は即座に取得
        const existingTable = document.getElementsByClassName(
            "listTable-gaia lookup-table-gaia"
        )[0];
        if (existingTable && existingTable instanceof HTMLTableElement) {
            // テーブル要素が見つかった後の処理（必要に応じてlineNameを使用）
            observeTableRows(existingTable);
            return;
        }

        // MutationObserverでDOMの変更を監視
        const observer = new MutationObserver(function (mutations, obs) {
            const table = document.getElementsByClassName("listTable-gaia lookup-table-gaia")[0];
            if (table && table instanceof HTMLTableElement) {
                // テーブル要素が見つかった後の処理（必要に応じてlineNameを使用）
                observeTableRows(table);
                obs.disconnect(); // 監視を停止
            }
        });

        // 監視を開始（body配下の変更を監視）
        observer.observe(document.body, {
            childList: true, // 子ノードの追加・削除を監視
            subtree: true, // 子孫ノードも監視
        });

        // タイムアウト設定（30秒後に監視を停止）
        setTimeout(function () {
            observer.disconnect();
        }, 30000);
    }

    return event;
}

/**
 * 不良入力フィールドを非表示
 */
function setHideDefectField(): void {
    const formData = (window as any).cybozu?.data?.page?.FORM_DATA;
    const defectInput = document.getElementById("19_13458387-:b5-text");
    const parentDefectInput = defectInput?.parentElement;
    if (parentDefectInput) {
        parentDefectInput.style.display = "none";
    }
}

/**
 * モデル名ドロップダウンを更新する関数
 * @param lineName - 選択されたライン名
 * @param allRecords - 全レコードデータ
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
 * @param event - kintoneイベントオブジェクト
 * @returns event
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
 * @param event - kintoneイベントオブジェクト
 * @returns event
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

// イベントハンドラーの登録
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
