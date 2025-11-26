(function () {
    "use strict";

    /**
     * レコード作成・編集画面表示時の処理
     * @param {Object} event - kintoneイベントオブジェクト
     * @returns {Object} event
     */
    async function handleRecordShow(event) {
        const appId = 24; // 🔁 他アプリのID
        const fieldCode = "line_name"; // 🔁 保存先フィールドコード
        let allRecords = []; // 変数をここで宣言

        // キャッシュにデータがあれば利用する
        const cachedData = sessionStorage.getItem("allRecords");
        if (cachedData) {
            allRecords = JSON.parse(cachedData);
        }

        if (!cachedData) {
            const limit = 100;
            let offset = 0;
            // let allRecords = []; ← この行を削除

            // --- 1️⃣ 他アプリのレコードを取得 ---
            while (true) {
                const params = {
                    app: appId,
                    query: `order by line_name asc, model_name asc limit ${limit} offset ${offset}`,
                    fields: ["line_name", "model_name", "model_code"], // 🔁 必要なフィールドだけにしておくと高速！
                };

                const resp = await kintone.api(
                    kintone.api.url("/k/v1/records", true),
                    "GET",
                    params
                );
                allRecords = allRecords.concat(resp.records);

                if (resp.records.length < limit) break; // もう次がない
                offset += limit;
            }

            // allRecordsをsessionStorageに保存
            sessionStorage.setItem("allRecords", JSON.stringify(allRecords));
        }

        // 重複を削除（Name.valueがユニークになるように）
        const seen = new Set();
        const uniqueRecords = allRecords.filter((rec) => {
            const val = rec.line_name.value;
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });

        // --- 2️⃣ ライン名とモデル名の親要素divを作成 ---
        const lineSpace = kintone.mobile.app.record.getSpaceElement("line_name_drop");
        const modelSpace = kintone.mobile.app.record.getSpaceElement("model_name_drop");
        if (!lineSpace || !modelSpace) return event;

        // 両方のスペース要素をラップする親divを作成
        const parentDiv = document.createElement("div");
        parentDiv.style.display = "flex";
        parentDiv.style.flexDirection = "column";
        parentDiv.style.padding = "6.5px";
        parentDiv.style.paddingBottom = "13px";
        parentDiv.style.width = "calc(100% - 13px)";

        // 既存のスペース要素をクリア
        lineSpace.innerHTML = "";
        modelSpace.innerHTML = "";

        // 親divをlineSpaceに配置
        lineSpace.appendChild(parentDiv);

        // --- ライン名のコンテナdivを作成 ---
        const lineParentDiv = document.createElement("div");
        lineParentDiv.style.display = "flex";
        lineParentDiv.style.flexDirection = "column";
        lineParentDiv.style.width = "100%";
        parentDiv.appendChild(lineParentDiv);

        // ラベルを作成
        const lineLabel = document.createElement("h3");
        lineLabel.textContent = "ライン名";
        lineLabel.className = "control-label-gaia";
        lineParentDiv.appendChild(lineLabel);

        // 必須マークを追加
        const lineRequired = document.createElement("span");
        lineRequired.textContent = "*";
        lineRequired.style.color = "#d01212";
        lineRequired.style.left = "3px";
        lineLabel.appendChild(lineRequired);

        // ドロップダウンを作成
        const lineSelect = document.createElement("select");
        lineSelect.id = "custom_dropdown";
        lineSelect.className = "kintoneplugin-select gaia-argoui-select";
        lineSelect.style.width = "100%";
        lineSelect.style.height = "30px";
        lineParentDiv.appendChild(lineSelect);

        // --- 3️⃣ 選択肢を追加 ---
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "選択してください";
        defaultOption.value = "";
        lineSelect.appendChild(defaultOption);

        uniqueRecords.forEach((rec) => {
            const option = document.createElement("option");
            option.value = rec.line_name.value;
            option.textContent = rec.line_name.value;
            lineSelect.appendChild(option);
        });

        // --- 4️⃣ 選択時にレコードデータへ反映 ---
        lineSelect.addEventListener("change", (event) => {
            const record = kintone.mobile.app.record.get();
            record.record[fieldCode].value = event.target.value;
            kintone.mobile.app.record.set(record);
        });

        // --- 5️⃣ モデル名のコンテナdivを作成 ---
        const modelParentDiv = document.createElement("div");
        modelParentDiv.style.display = "flex";
        modelParentDiv.style.flexDirection = "column";
        modelParentDiv.style.width = "100%";
        parentDiv.appendChild(modelParentDiv);

        // ラベルを作成
        const modelLabel = document.createElement("h3");
        modelLabel.textContent = "モデル名";
        modelLabel.className = "control-label-gaia";
        modelParentDiv.appendChild(modelLabel);

        // 必須マークを追加
        const modelRequired = document.createElement("span");
        modelRequired.textContent = "*";
        modelRequired.style.color = "#d01212";
        modelRequired.style.left = "3px";
        modelLabel.appendChild(modelRequired);

        // ドロップダウンを作成
        const modelSelect = document.createElement("select");
        modelSelect.id = "model_dropdown";
        modelSelect.className = "kintoneplugin-select gaia-argoui-select";
        modelSelect.style.width = "100%";
        modelSelect.style.height = "30px";
        modelParentDiv.appendChild(modelSelect);

        // 初期選択肢を追加
        const modelDefaultOption = document.createElement("option");
        modelDefaultOption.textContent = "選択してください";
        modelDefaultOption.value = "";
        modelSelect.appendChild(modelDefaultOption);

        // 既存のライン名があれば、対応するモデルを表示
        const currentLineName = event.record[fieldCode]?.value;
        if (currentLineName) {
            const matchedRecords = allRecords.filter(
                (rec) => rec.line_name.value === currentLineName
            );

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
                modelSelect.appendChild(option);
            });
        }

        // 選択時にレコードデータへ反映
        modelSelect.addEventListener("change", (event) => {
            const record = kintone.mobile.app.record.get();
            const target_values = event.target.value.split("_");
            console.log(event.target.value);
            record.record["model_name"].value = target_values[0];
            record.record["model_code"].value = target_values[1];
            kintone.mobile.app.record.set(record);
        });

        // --- 編集画面で既存値を反映（モデル名ドロップダウン生成後） ---
        // ライン名の既存値を反映
        if (event.record[fieldCode].value) {
            lineSelect.value = event.record[fieldCode].value;
        }

        // モデル名の既存値を反映
        if (event.record.model_name?.value && event.record.model_code?.value) {
            modelSelect.value = `${event.record.model_name.value}_${event.record.model_code.value}`;
        }

        return event;
    }

    /**
     * ライン名変更時の処理
     * @param {Object} event - kintoneイベントオブジェクト
     * @returns {Object} event
     */
    function handleLineNameChange(event) {
        // キャッシュからデータを取得
        const cachedData = sessionStorage.getItem("allRecords");
        if (!cachedData) {
            return event;
        }
        const allRecords = JSON.parse(cachedData);

        // 入力された値に対応するモデルコードリストを作成
        const inputLineName = event.record.line_name.value;
        const matchedRecords = allRecords.filter((rec) => rec.line_name.value === inputLineName);

        // 既存のモデル名ドロップダウンを取得
        const modelSelect = document.getElementById("model_dropdown");
        if (!modelSelect) return event;

        // 選択肢をクリア
        modelSelect.innerHTML = "";

        // デフォルト選択肢を追加
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "選択してください";
        defaultOption.value = "";
        modelSelect.appendChild(defaultOption);

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
            modelSelect.appendChild(option);
        });

        return event;
    }

    /**
     * テーブル変更・送信時の工数計算処理
     * @param {Object} event - kintoneイベントオブジェクト
     * @returns {Object} event
     */
    function handleManHoursTableChange(event) {
        const record = event.record;
        const table = record.man_hours_table.value; // テーブルのフィールドコードを指定
        let insideFixedTimeSum = 0;
        let outsideFixedTimeSum = 0;
        let insideOvertimeSum = 0;
        let outsideOvertimeSum = 0;

        // 条件に合致する行だけ加算
        table.forEach((row) => {
            const work_type = row.value.work_type.value; // テーブル内フィールドコード
            const personnel_type = row.value.personnel_type.value; // テーブル内フィールドコード
            const man_hours = Number(row.value.man_hours.value || 0);

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

        // フィールドが存在する場合のみ値を設定
        if (record.inside_time) {
            record.inside_time.value = insideFixedTimeSum;
        }
        // フィールドが存在する場合のみ値を設定
        if (record.outside_time) {
            record.outside_time.value = outsideFixedTimeSum;
        }

        // フィールドが存在する場合のみ値を設定
        if (record.inside_overtime) {
            record.inside_overtime.value = insideOvertimeSum;
        }

        if (record.outside_overtime) {
            record.outside_overtime.value = outsideOvertimeSum;
        }

        return event;
    }

    // イベントハンドラーの登録
    // 作成・編集画面で動作
    kintone.events.on(
        ["mobile.app.record.create.show", "mobile.app.record.edit.show"],
        handleRecordShow
    );

    // レコード追加 or 編集画面で、ライン名が変わった時にモデル名ドロップダウンの選択肢を更新
    kintone.events.on(
        ["mobile.app.record.create.change.line_name", "mobile.app.record.edit.change.line_name"],
        handleLineNameChange
    );

    // テーブル内の値が変更されたときに発火
    kintone.events.on(
        [
            "mobile.app.record.create.change.man_hours_table",
            "mobile.app.record.edit.change.man_hours_table",
            "mobile.app.record.create.change.man_hours_table.man_hours",
            "mobile.app.record.edit.change.man_hours_table.man_hours",
            "mobile.app.record.create.change.man_hours_table.work_type",
            "mobile.app.record.edit.change.man_hours_table.work_type",
            "mobile.app.record.create.submit",
            "mobile.app.record.edit.submit",
        ],
        handleManHoursTableChange
    );
})();
