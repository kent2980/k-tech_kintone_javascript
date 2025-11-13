(function () {
    "use strict";

    // 作成・編集画面で動作
    kintone.events.on(["app.record.create.show", "app.record.edit.show"], async (event) => {
        const appId = 25; // 🔁 他アプリのID
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

        // --- 2️⃣ スペースフィールドにラベルとドロップダウン作成 ---
        const space = kintone.app.record.getSpaceElement("line_name_drop");
        if (!space) return event;
        space.innerHTML = ""; // 初期化

        // スペースに縦配置のスタイルを適用
        space.style.display = "flex";
        space.style.flexDirection = "column";
        space.style.gap = "5px";
        space.style.margin = "5px";

        // ラベルを作成
        const label = document.createElement("label");
        label.textContent = "ライン名: ";
        label.className = "control-label-text-gaia";
        label.style.marginBottom = "5px";
        space.appendChild(label);

        // ドロップダウンを作成
        const select = document.createElement("select");
        select.id = "custom_dropdown";
        select.className = "kintoneplugin-select gaia-argoui-select";
        space.appendChild(select);

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
        select.addEventListener("change", (event) => {
            const record = kintone.app.record.get();
            record.record[fieldCode].value = event.target.value;
            kintone.app.record.set(record);
        });

        // --- 編集画面で既存値を反映 ---
        if (event.record[fieldCode].value) {
            select.value = event.record[fieldCode].value;
        }

        return event;
    });

    // レコード追加 or 編集画面で、文字列フィールドが変わった時に発火
    kintone.events.on(
        ["app.record.create.change.line_name", "app.record.edit.change.line_name"],
        function (event) {
            // キャッシュからデータを取得
            const cachedData = sessionStorage.getItem("allRecords");
            if (!cachedData) {
                return event;
            }
            const allRecords = JSON.parse(cachedData);

            // 入力された値に対応するモデルコードリストを作成
            const inputLineName = event.record.line_name.value;
            const matchedRecords = allRecords.filter(
                (rec) => rec.line_name.value === inputLineName
            );

            // スペースフィールドにラベルとドロップダウンを作成
            const space = kintone.app.record.getSpaceElement("model_name_drop");
            if (!space) return event;
            space.innerHTML = ""; // 初期化

            // スペースに縦配置のスタイルを適用
            space.style.display = "flex";
            space.style.flexDirection = "column";
            space.style.gap = "5px";
            space.style.margin = "5px";

            // ラベルを作成
            const label = document.createElement("label");
            label.textContent = "モデル名: ";
            label.className = "control-label-text-gaia";
            label.style.marginBottom = "5px";
            space.appendChild(label);

            // ドロップダウンを作成
            const select = document.createElement("select");
            select.id = "model_dropdown";
            select.className = "kintoneplugin-select gaia-argoui-select";
            space.appendChild(select);
            // 選択肢を追加
            const defaultOption = document.createElement("option");
            defaultOption.textContent = "選択してください";
            defaultOption.value = "";
            select.appendChild(defaultOption);

            // matchedRecordsをモデル名で並び替え
            matchedRecords.sort((a, b) => {
                const name_compare = a.model_name.value.localeCompare(b.model_name.value);
                if (name_compare !== 0) return name_compare;
                return a.model_code.value.localeCompare(b.model_code.value);
            });

            // 2つ目のドロップダウンに項目を挿入
            matchedRecords.forEach((rec) => {
                const option = document.createElement("option");
                option.value = `${rec.model_name.value}_${rec.model_code.value}`;
                option.textContent = `${rec.model_name.value}_${rec.model_code.value}`;
                select.appendChild(option);
            });

            // 選択時にレコードデータへ反映
            select.addEventListener("change", (event) => {
                const record = kintone.app.record.get();
                const target_values = event.target.value.split("_");
                console.log(event.target.value);
                record.record["model_name"].value = target_values[0]; // 🔁 model_nameはフィールドコード
                record.record["model_code"].value = target_values[1];
                kintone.app.record.set(record);
            });

            return event;
        }
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
        function (event) {
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
            if (record.inside_fixed_time) {
                record.inside_fixed_time.value = insideFixedTimeSum;
            }
            // フィールドが存在する場合のみ値を設定
            if (record.outside_fixed_time) {
                record.outside_fixed_time.value = outsideFixedTimeSum;
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
    );
})();
