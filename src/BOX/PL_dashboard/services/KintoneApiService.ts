import { API_LIMITS, APP_IDS } from "../config";
import { FilterConfig, KintoneSaveResult, KintoneSaveResults } from "../types";
import { DateUtil, FieldsUtil, Logger, PerformanceUtil } from "../utils";

/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />
/// <reference path="../fields/holiday_fields.d.ts" />

/**
 * kintone API関連の処理を担当するサービスクラス
 */
export class KintoneApiService {
    /**
     * PL月次データを取得する
     * @param year - 年
     * @param month - 月
     * @returns 取得したレコードデータ
     */
    static async fetchPLMonthlyData(
        year: string,
        month: string
    ): Promise<monthly.SavedFields | null> {
        const cacheKey = `pl-monthly-${year}-${month}`;

        // キャッシュから取得を試行
        const cachedData = PerformanceUtil.getFromCache<monthly.SavedFields>(cacheKey);
        if (cachedData) {
            Logger.debug(`PL月次データをキャッシュから取得: ${year}/${month}`);
            return cachedData;
        }

        const fields = FieldsUtil.getMonthlyFields();
        const query = `year_month = "${year}_${month}"`;

        try {
            PerformanceUtil.startMeasure(`pl-monthly-fetch-${year}-${month}`);

            const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
                app: APP_IDS.PL_MONTHLY,
                query: query,
                fields: fields,
            });

            const fetchTime = PerformanceUtil.endMeasure(`pl-monthly-fetch-${year}-${month}`);
            Logger.debug(`PL月次データ取得完了: ${fetchTime.toFixed(2)}ms`);

            const result = response.records[0] || null;

            // 結果をキャッシュ（5分間）
            if (result) {
                PerformanceUtil.setCache(cacheKey, result, 300000);
            }

            return result;
        } catch (error) {
            Logger.error("PL月次データ取得エラー:", error);
            return null;
        }
    }

    /**
     * PL日次データを取得する
     * @param year - 年
     * @param month - 月
     * @returns レコードの配列
     */
    static async fetchPLDailyData(year: string, month: string): Promise<daily.SavedFields[]> {
        const fields = FieldsUtil.getDailyFields();

        const today = DateUtil.getTodayString();
        const startDate = `${year}-${month.padStart(2, "0")}-01`;
        const lastDayOfMonth = DateUtil.getLastDayOfMonth(parseInt(year), parseInt(month));
        let endDate = `${year}-${month.padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

        // 未来の日付の場合は今日までに制限
        if (endDate > today) {
            endDate = today;
        }

        const queryCondition = `date >= "${startDate}" and date <= "${endDate}"`;

        try {
            return await this.fetchAllRecords<daily.SavedFields>(
                APP_IDS.PL_DAILY,
                fields,
                `${queryCondition} order by date asc`
            );
        } catch (error) {
            Logger.error("PL日次データ取得エラー:", error);
            return [];
        }
    }

    /**
     * 生産日報報告書データを取得する
     * @param filterConfig - フィルター設定
     * @returns レコードの配列
     */
    static async fetchProductionReportData(
        filterConfig: FilterConfig
    ): Promise<line_daily.SavedFields[]> {
        const fields = FieldsUtil.getLineDailyFields();

        const today = DateUtil.getTodayString();
        let queryCondition = "";

        if (filterConfig.year && filterConfig.month) {
            // 年と月の両方が指定されている場合
            const startDate = `${filterConfig.year}-${filterConfig.month.padStart(2, "0")}-01`;
            const lastDayOfMonth = DateUtil.getLastDayOfMonth(
                parseInt(filterConfig.year),
                parseInt(filterConfig.month)
            );
            let endDate = `${filterConfig.year}-${filterConfig.month.padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

            if (endDate > today) {
                endDate = today;
            }
            queryCondition = `date >= "${startDate}" and date <= "${endDate}"`;
        } else if (filterConfig.year) {
            // 年のみが指定されている場合
            const startDate = `${filterConfig.year}-01-01`;
            let endDate = `${filterConfig.year}-12-31`;
            if (endDate > today) {
                endDate = today;
            }
            queryCondition = `date >= "${startDate}" and date <= "${endDate}"`;
        } else {
            // どちらも指定されていない場合は今日までの全データ
            queryCondition = `date <= "${today}"`;
        }

        try {
            return await this.fetchAllRecords<line_daily.SavedFields>(
                APP_IDS.PRODUCTION_REPORT,
                fields,
                `${queryCondition} order by date asc, line_name asc, model_name asc`
            );
        } catch (error) {
            Logger.error("生産日報データ取得エラー:", error);
            return [];
        }
    }

    /**
     * マスタ機種一覧データを取得する
     * @returns レコードの配列
     */
    static async fetchMasterModelData(): Promise<model_master.SavedFields[]> {
        const cacheKey = "master-model-data";

        // キャッシュから取得を試行
        const cachedData = PerformanceUtil.getFromCache<model_master.SavedFields[]>(cacheKey);
        if (cachedData) {
            Logger.debug(`マスタ機種データをキャッシュから取得: ${cachedData.length}件`);
            return cachedData;
        }

        const fields = FieldsUtil.getModelMasterFields();

        try {
            PerformanceUtil.startMeasure("master-model-fetch");

            const records = await this.fetchAllRecords<model_master.SavedFields>(
                APP_IDS.MASTER_MODEL,
                fields,
                "order by line_name asc, model_name asc"
            );

            const fetchTime = PerformanceUtil.endMeasure("master-model-fetch");
            Logger.success(
                `マスタ機種一覧データを${records.length}件取得しました (${fetchTime.toFixed(2)}ms)`
            );

            // 結果をキャッシュ（30分間）- マスタデータは変更頻度が低いため
            PerformanceUtil.setCache(cacheKey, records, 1800000);

            return records;
        } catch (error) {
            Logger.error("マスタ機種データ取得エラー:", error);
            return [];
        }
    }

    /**
     * 祝日データを取得する
     * @returns レコードの配列
     */
    static async fetchHolidayData(): Promise<holiday.SavedFields[]> {
        const fields = FieldsUtil.getHolidayFields();

        return await this.fetchAllRecords<holiday.SavedFields>(
            APP_IDS.HOLIDAY,
            fields,
            "order by date asc"
        );
    }

    /**
     * すべてのレコードを取得する（ページング処理込み）
     * @param appId - アプリID
     * @param fields - 取得するフィールド
     * @param query - クエリ条件
     * @returns すべてのレコード
     */
    private static async fetchAllRecords<T>(
        appId: number,
        fields: string[],
        query: string
    ): Promise<T[]> {
        let allRecords: T[] = [];
        let offset = 0;
        const limit = API_LIMITS.RECORDS_PER_REQUEST;

        while (true) {
            const fullQuery = `${query} limit ${limit} offset ${offset}`;
            const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
                app: appId,
                fields: fields,
                query: fullQuery,
            });

            allRecords = allRecords.concat(response.records);

            if (response.records.length < limit) {
                break;
            }
            offset += limit;
        }

        return allRecords;
    }

    /**
     * レコード取得のリトライ処理
     * @param fetchFunction - 実行する取得関数
     * @param maxRetries - 最大リトライ回数
     * @returns 取得結果
     */
    static async withRetry<T>(
        fetchFunction: () => Promise<T>,
        maxRetries: number = API_LIMITS.MAX_RETRIES
    ): Promise<T> {
        let lastError: Error;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fetchFunction();
            } catch (error) {
                lastError = error as Error;
                Logger.warn(`API取得試行 ${i + 1}/${maxRetries} 失敗:`, error);

                if (i < maxRetries - 1) {
                    // 指数バックオフで待機
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }

        throw lastError!;
    }

    /**
     * 与えられた API 呼び出し関数群を並列で実行（同時実行数制限付き）
     * 各呼び出しは `withRetry` でラップされます。
     * @param tasks - 実行する API 呼び出し関数の配列
     * @param concurrency - 同時実行数
     */
    private static async executeBatchedRequests<T>(
        tasks: Array<() => Promise<T>>,
        concurrency: number = 3,
        meta?: { appId?: number; action?: string }
    ): Promise<T[]> {
        const results: T[] = [];
        const total = tasks.length;
        let completed = 0;

        // dispatch start event
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("uploadStart", {
                    detail: { appId: meta?.appId, action: meta?.action, totalTasks: total },
                })
            );
        }

        for (let i = 0; i < tasks.length; i += concurrency) {
            const chunk = tasks.slice(i, i + concurrency);
            const promises = chunk.map((t) => this.withRetry(() => t()));
            const res = await Promise.all(promises);
            results.push(...res);

            completed += chunk.length;
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("uploadProgress", {
                        detail: { appId: meta?.appId, action: meta?.action, completed, total },
                    })
                );
            }
        }

        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("uploadComplete", {
                    detail: { appId: meta?.appId, action: meta?.action, totalTasks: total },
                })
            );
        }

        return results;
    }

    // ========================================
    // レコード登録・更新メソッド
    // ========================================

    /**
     * PL月次データを登録する
     * @param record - 登録するレコード
     * @returns KintoneSaveResult 登録されたレコードIDとリビジョン
     * @throws error 重複レコードが見つかった場合のエラー
     * @example
     * ```typescript
     * const record = {
     *   year_month: { type: "SINGLE_LINE_TEXT", value: "2024_06" },
     *   dispatch: { type: "NUMBER", value: "5" },
     *   indirect: { type: "NUMBER", value: "3" },
     *   year: { type: "NUMBER", value: "2024" },
     *   direct: { type: "NUMBER", value: "10" },
     *   inside_unit: { type: "NUMBER", value: "2000" },
     *   month: { type: "DROP_DOWN", value: "June" },
     *   outside_unit: { type: "NUMBER", value: "1800" }
     * };
     * savePLMonthlyData(record).then((id) => {
     *   console.log("登録されたレコードID:", id);
     * });
     * ```
     */
    static async savePLMonthlyData(record: Record<string, any>): Promise<KintoneSaveResult> {
        try {
            // 重複チェック
            const duplicates = await this.checkDuplicateRecords(
                APP_IDS.PL_MONTHLY,
                record,
                "year_month"
            );
            if (!duplicates || duplicates.length === 0) {
                // 登録処理開始
                Logger.debug("PL月次データを登録しています...");
                const res = await kintone.api(kintone.api.url("/k/v1/record", true), "POST", {
                    app: APP_IDS.PL_MONTHLY,
                    record: JSON.parse(JSON.stringify(record)),
                });

                // キャッシュをクリア
                PerformanceUtil.clearCache();

                const saveResult: KintoneSaveResult = {
                    id: res.id,
                    revision: res.revision,
                };

                return saveResult;
            } else {
                Logger.warn("PL月次データの重複が検出され、登録をスキップしました:", duplicates);
                throw new Error("重複レコードが見つかりました。登録はスキップされました。");
            }
        } catch (error) {
            Logger.error("PL月次データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * PL日次データを登録する
     * @param records - 登録するレコード配列
     * @returns KintoneSaveResults 登録されたレコードID配列
     * @throws error 重複レコードが見つかった場合のエラー
     * @example
     * ```typescript
     * const records = [
     *   {
     *     date: { type: "DATE", value: "2024-06-01" },
     *     indirect_material_costs: { type: "NUMBER", value: "20000" },
     *     inside_overtime_cost: { type: "NUMBER", value: "4000" },
     *     outside_overtime_cost: { type: "NUMBER", value: "2500" },
     *     other_added_value: { type: "NUMBER", value: "50000" },
     *     other_indirect_material_costs: { type: "SINGLE_LINE_TEXT", value: "5000" },
     *     inside_holiday_expenses: { type: "NUMBER", value: "1000" },
     *     outside_holiday_expenses: { type: "NUMBER", value: "500" },
     *     direct_personnel: { type: "NUMBER", value: "10" },
     *     temporary_employees: { type: "NUMBER", value: "2" },
     *     labor_costs: { type: "NUMBER", value: "100000" },
     *     indirect_overtime: { type: "NUMBER", value: "8" },
     *     total_sub_cost: { type: "NUMBER", value: "15000" },
     *     indirect_holiday_work: { type: "NUMBER", value: "4" },
     *     indirect_personnel: { type: "NUMBER", value: "5" },
     *     night_shift_allowance: { type: "NUMBER", value: "3000" }
     *   }
     * ];
     * savePLDailyData(records).then((ids) => {
     *   console.log("登録されたレコードID:", ids);
     * });
     * ```
     */
    static async savePLDailyData(records: Record<string, any>[]): Promise<KintoneSaveResults> {
        try {
            // まずバッチ内で同一の日付が重複していないかチェックして、あれば除去する
            let uploadRecords = records;
            try {
                const dateValues = records.map((r) => {
                    const v = r && r.date;
                    return typeof v === "object" && v && v.value !== undefined ? v.value : v;
                });

                const seen = new Set<string>();
                const duplicatesInBatch: string[] = [];
                const uniqueRecords: Record<string, any>[] = [];

                for (let idx = 0; idx < dateValues.length; idx++) {
                    const d = dateValues[idx];
                    if (d === undefined || d === null) {
                        // 日付がない場合はそのまま含める
                        uniqueRecords.push(records[idx]);
                        continue;
                    }

                    if (seen.has(String(d))) {
                        duplicatesInBatch.push(String(d));
                    } else {
                        seen.add(String(d));
                        uniqueRecords.push(records[idx]);
                    }
                }

                if (duplicatesInBatch.length > 0) {
                    console.log(
                        `バッチ内で重複する日付が見つかりました (${[...new Set(duplicatesInBatch)].join(", ")}))。重複を除いて登録を続行します。`
                    );
                    uploadRecords = uniqueRecords;
                }
            } catch (e) {
                // 日付抽出で予期せぬ形式が来た場合はそのまま進める（既存の重複チェックでガード）
                console.log("バッチ内重複チェック中にエラーが発生しました。スキップします。", e);
                uploadRecords = records;
            }

            // 重複チェック（サーバ側に既存データがあるか確認）
            const duplicatesInfo = await this.checkBatchDuplicateRecords(
                APP_IDS.PL_DAILY,
                uploadRecords,
                "date"
            );

            // 実際に重複しているレコードがあるか確認
            const hasDuplicates = duplicatesInfo.some((info) => info.isDuplicate);

            if (hasDuplicates) {
                console.log(
                    "PL日次データの重複が検出され、登録をスキップしました:",
                    duplicatesInfo.filter((info) => info.isDuplicate)
                );
                throw new Error("重複レコードが見つかりました。登録はスキップされました。");
            }
            // 登録処理開始
            console.log("PL日次データ登録処理開始");
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録（同時実行数は制限）
            const batches: Record<string, any>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const uploadResults: any[] = [];
            const tasks = batches.map((batch) => async () => {
                const res = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.PL_DAILY,
                    records: batch,
                });
                Logger.debug(`${batch.length}件のPL日次データを登録しました`);
                uploadResults.push(res);
                return res;
            });

            await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.PL_DAILY,
                action: "savePLDailyData",
            });

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            // uploadResults からsaveResultsを構築
            const saveResults: KintoneSaveResults = {
                records: [],
            };
            for (const res of uploadResults) {
                if (res && Array.isArray(res.records)) {
                    saveResults.records.push({
                        id: res.records[0].id,
                        revision: res.records[0].revision,
                    });
                }
            }

            return saveResults;
        } catch (error) {
            console.log("PL日次データ登録エラー:", error);
            if (error instanceof Error) {
                console.log("エラーメッセージ:", error.message);
            }
            // APIエラーの詳細を出力
            if (error && typeof error === "object") {
                console.log("エラーの詳細:", JSON.stringify(error, null, 2));
            }
            throw error;
        }
    }

    /**
     * 生産日報データを登録する
     * @param records - 登録するレコード配列
     * @returns KintoneSaveResults 登録されたレコードID配列
     * @throws error 重複レコードが見つかった場合のエラー
     * @example
     * ```typescript
     * const records = [
     *   {
     *     date: { type: "DATE", value: "2024-06-01" },
     *     line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
     *     model_name: { type: "SINGLE_LINE_TEXT", value: "Model X" },
     *     model_code: { type: "SINGLE_LINE_TEXT", value: "BKC001" },
     *     user_name: { type: "SINGLE_LINE_TEXT", value: "John Doe" },
     *     actual_number: { type: "NUMBER", value: "100" },
     *     target_number: { type: "NUMBER", value: "120" },
     *     production_number: { type: "NUMBER", value: "105" },
     *     inside_time: { type: "NUMBER", value: "200" },
     *     outside_time: { type: "NUMBER", value: "50" },
     *     inside_overtime: { type: "NUMBER", value: "10" },
     *     outside_overtime: { type: "NUMBER", value: "5" },
     *     added_value: { type: "NUMBER", value: "5000" },
     *     man_hours_text: { type: "SINGLE_LINE_TEXT", value: "250 hours" },
     *     deflist_text: { type: "SINGLE_LINE_TEXT", value: "2 defects" },
     *     chg_o_text: { type: "SINGLE_LINE_TEXT", value: "Changeover completed" }
     *   }
     * ];
     * saveProductionReportData(records).then((ids) => {
     *   console.log("登録されたレコードID:", ids);
     * });
     * ```
     */
    static async saveProductionReportData(
        records: Record<string, any>[]
    ): Promise<KintoneSaveResults> {
        try {
            Logger.debug(`${records.length}件の生産日報データを登録しています...`);
            // 重複チェック
            const duplicatesInfo = await this.checkBatchDuplicateRecords(
                APP_IDS.PRODUCTION_REPORT,
                records,
                ["date", "line_name", "model_name"]
            );

            // 実際に重複しているレコードがあるか確認
            const hasDuplicates = duplicatesInfo.some((info) => info.isDuplicate);

            if (hasDuplicates) {
                Logger.warn(
                    "生産日報データの重複が検出され、登録をスキップしました:",
                    duplicatesInfo.filter((info) => info.isDuplicate)
                );
                console.log(duplicatesInfo.filter((info) => info.isDuplicate));
                throw new Error("重複レコードが見つかりました。登録はスキップされました。");
            }
            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録
            const batches: Record<string, any>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch) => async () => {
                const res = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.PRODUCTION_REPORT,
                    records: batch,
                });
                Logger.debug(`${batch.length}件の生産日報データを登録しました`);
                return res;
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.PRODUCTION_REPORT,
                action: "saveProductionReportData",
            });
            // kintone のレスポンスから id を収集できる場合は収集
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    recordIds.push(...r.records.map((rec: any) => rec.id));
                }
            }
            Logger.success(`合計${recordIds.length}件の生産日報データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            const saveResults: KintoneSaveResults = {
                records: [],
            };

            // responses からsaveResultsを構築
            for (const res of responses) {
                if (res && Array.isArray(res.records)) {
                    for (const rec of res.records) {
                        saveResults.records.push({
                            id: rec.id,
                            revision: rec.revision,
                        });
                    }
                }
            }

            return saveResults;
        } catch (error) {
            console.error("生産日報データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * マスタ機種データを登録する
     * @param records - 登録するレコード配列
     * @returns KintoneSaveResults 登録されたレコードID配列
     * @throws error 重複レコードが見つかった場合のエラー
     * @example
     * ```typescript
     * const records = [
     *   {
     *     model_code: { type: "SINGLE_LINE_TEXT", value: "BKC001" },
     *     model_name: { type: "SINGLE_LINE_TEXT", value: "Model X" },
     *     line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
     *     customer: { type: "SINGLE_LINE_TEXT", value: "Customer A" },
     *     number_of_people: { type: "NUMBER", value: "5" },
     *     time: { type: "NUMBER", value: "2.5" },
     *     added_value: { type: "NUMBER", value: "5000" }
     *   }
     * ];
     * saveMasterModelData(records).then((ids) => {
     *   console.log("登録されたレコードID:", ids);
     * });
     * ```
     */
    static async saveMasterModelData(records: Record<string, any>[]): Promise<KintoneSaveResults> {
        try {
            Logger.debug(`${records.length}件のマスタ機種データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録
            const batches: Record<string, any>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch) => async () => {
                const batchRecords = batch.map((record) => ({
                    fields: JSON.parse(JSON.stringify(record)),
                }));
                const res = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.MASTER_MODEL,
                    records: batchRecords,
                });
                Logger.debug(`${batchRecords.length}件のマスタ機種データを登録しました`);
                return res;
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.MASTER_MODEL,
                action: "saveMasterModelData",
            });
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    recordIds.push(...r.records.map((rec: any) => rec.id));
                }
            }

            Logger.success(`合計${recordIds.length}件のマスタ機種データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            const saveResults: KintoneSaveResults = {
                records: [],
            };

            // responses からsaveResultsを構築
            for (const res of responses) {
                if (res && Array.isArray(res.records)) {
                    for (const rec of res.records) {
                        saveResults.records.push({
                            id: rec.id,
                            revision: rec.revision,
                        });
                    }
                }
            }

            return saveResults;
        } catch (error) {
            Logger.error("マスタ機種データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * 祝日データを登録する
     * @param records - 登録するレコード配列
     * @returns KintoneSaveResults 登録されたレコードID配列
     * @throws error 重複レコードが見つかった場合のエラー
     * @example
     * ```typescript
     * const records = [
     *   {
     *     date: { type: "DATE", value: "2024-01-01" },
     *     holiday_type: { type: "DROP_DOWN", value: "New Year's Day" }
     *   },
     *   {
     *     date: { type: "DATE", value: "2024-12-25" },
     *     holiday_type: { type: "DROP_DOWN", value: "Christmas" }
     *   }
     * ];
     * saveHolidayData(records).then((ids) => {
     *   console.log("登録されたレコードID:", ids);
     * });
     * ```
     */
    static async saveHolidayData(records: Record<string, any>[]): Promise<KintoneSaveResults> {
        try {
            Logger.debug(`${records.length}件の祝日データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録
            const batches: Record<string, any>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch) => async () => {
                const batchRecords = batch.map((record) => ({
                    fields: JSON.parse(JSON.stringify(record)),
                }));
                const res = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.HOLIDAY,
                    records: batchRecords,
                });
                Logger.debug(`${batchRecords.length}件の祝日データを登録しました`);
                return res;
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.HOLIDAY,
                action: "saveHolidayData",
            });
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    recordIds.push(...r.records.map((rec: any) => rec.id));
                }
            }

            Logger.success(`合計${recordIds.length}件の祝日データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            const saveResults: KintoneSaveResults = {
                records: [],
            };

            // responses からsaveResultsを構築
            for (const res of responses) {
                if (res && Array.isArray(res.records)) {
                    for (const rec of res.records) {
                        saveResults.records.push({
                            id: rec.id,
                            revision: rec.revision,
                        });
                    }
                }
            }

            return saveResults;
        } catch (error) {
            Logger.error("祝日データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * 単一レコードを更新する
     * @param appId - アプリID
     * @param recordId - レコードID
     * @param record - 更新するデータ
     * @returns 更新結果
     */
    static async updateRecord(
        appId: number,
        recordId: number,
        record: Record<string, any>
    ): Promise<any> {
        try {
            Logger.debug(`レコードを更新しています (AppID: ${appId}, RecordID: ${recordId})`);

            const response = await kintone.api(kintone.api.url("/k/v1/record", true), "PUT", {
                app: appId,
                id: recordId,
                record: record,
            });

            Logger.success(`レコードを更新しました (RecordID: ${recordId})`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return response;
        } catch (error) {
            Logger.error("レコード更新エラー:", error);
            throw error;
        }
    }

    /**
     * 複数レコードを更新する
     * @param appId - アプリID
     * @param records - 更新するレコードデータ配列（idを含む）
     * @returns 更新結果
     */
    static async updateRecords(appId: number, records: Record<string, any>[]): Promise<any> {
        try {
            Logger.debug(`${records.length}件のレコードを更新しています (AppID: ${appId})`);

            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;
            const updateData = [];

            // バッチに分割して並列で更新
            const batches: Record<string, any>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch) => async () => {
                const batchRecords = batch.map((record) => ({
                    id: record.id,
                    record: record.data || record,
                }));
                const res = await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", {
                    app: appId,
                    records: batchRecords,
                });
                Logger.debug(`${batchRecords.length}件のレコードを更新しました`);
                return res;
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: appId,
                action: "updateRecords",
            });
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    updateData.push(...r.records);
                }
            }

            Logger.success(`合計${updateData.length}件のレコードを更新しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return updateData;
        } catch (error) {
            Logger.error("レコード一括更新エラー:", error);
            throw error;
        }
    }

    /**
     * レコードを削除する
     * @param appId - アプリID
     * @param recordIds - 削除するレコードID配列
     * @returns 削除結果
     */
    static async deleteRecords(appId: number, recordIds: number[]): Promise<any> {
        try {
            Logger.debug(`${recordIds.length}件のレコードを削除しています (AppID: ${appId})`);

            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で削除
            const batches: number[][] = [];
            for (let i = 0; i < recordIds.length; i += batchSize) {
                batches.push(recordIds.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch) => async () => {
                const res = await kintone.api(kintone.api.url("/k/v1/records", true), "DELETE", {
                    app: appId,
                    ids: batch,
                });
                Logger.debug(`${batch.length}件のレコードを削除しました`);
                return res;
            });

            await this.executeBatchedRequests(tasks, 3, { appId: appId, action: "deleteRecords" });

            Logger.success(`合計${recordIds.length}件のレコードを削除しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return { deletedCount: recordIds.length };
        } catch (error) {
            Logger.error("レコード削除エラー:", error);
            throw error;
        }
    }

    // ========================================
    // 重複確認メソッド
    // ========================================

    /**
     * 指定フィールドの値が既存レコードと重複しているか確認する
     * @param appId - アプリID
     * @param record - 確認するレコードデータ
     * @param fieldNames - 確認対象フィールド名（単数 or 複数）
     * @returns 重複レコード情報。重複がない場合はnull
     * @example
     * ```typescript
     * // 単一フィールドで確認
     * const duplicate = await KintoneApiService.checkDuplicateRecords(
     *   APP_IDS.PL_MONTHLY,
     *   { year_month: { type: "SINGLE_LINE_TEXT", value: "2024_06" } },
     *   "year_month"
     * );
     *
     * // 複数フィールドで確認（AND条件）
     * const duplicates = await KintoneApiService.checkDuplicateRecords(
     *   APP_IDS.PRODUCTION_REPORT,
     *   {
     *     date: { type: "DATE", value: "2024-06-01" },
     *     line_name: { type: "SINGLE_LINE_TEXT", value: "Line A" },
     *     model_code: { type: "SINGLE_LINE_TEXT", value: "BKC001" }
     *   },
     *   ["date", "line_name", "model_code"]
     * );
     * ```
     */
    static async checkDuplicateRecords(
        appId: number,
        record: Record<string, any>,
        fieldNames: string | string[]
    ): Promise<any[] | null> {
        try {
            // fieldNamesを配列に統一
            const fieldsToCheck = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

            Logger.debug(
                `重複確認を開始します (AppID: ${appId}, フィールド: ${fieldsToCheck.join(", ")})`
            );

            // クエリ条件を構築
            const queryConditions = fieldsToCheck
                .map((fieldName) => {
                    const fieldValue = record[fieldName];
                    if (!fieldValue) {
                        console.log(`フィールド ${fieldName} が見つかりません`);
                        return null;
                    }

                    // kintoneフィールドフォーマットから値を抽出
                    // { value: "..." } または直接値の形式に対応
                    const value =
                        typeof fieldValue === "object" && fieldValue.value !== undefined
                            ? fieldValue.value
                            : fieldValue;

                    // 値のタイプに応じてクエリを構築
                    if (typeof value === "string") {
                        return `${fieldName} = "${value.replace(/"/g, '\\"')}"`;
                    } else if (typeof value === "number") {
                        return `${fieldName} = ${value}`;
                    } else {
                        console.log(`${fieldName} の値が文字列または数値ではありません: ${value}`);
                        return null;
                    }
                })
                .filter((condition): condition is string => condition !== null);

            if (queryConditions.length === 0) {
                Logger.warn("重複確認に有効なフィールド値がありません");
                return null;
            }

            // AND条件で結合
            const query = queryConditions.join(" and ");

            PerformanceUtil.startMeasure(`check-duplicates-${appId}`);

            const response = await kintone.api(kintone.api.url("/k/v1/records", true), "GET", {
                app: appId,
                query: query,
            });

            const checkTime = PerformanceUtil.endMeasure(`check-duplicates-${appId}`);
            Logger.debug(`重複確認完了: ${checkTime.toFixed(2)}ms`);

            const duplicateRecords = response.records;

            if (duplicateRecords.length > 0) {
                Logger.warn(
                    `重複レコードが見つかりました: ${duplicateRecords.length}件 (AppID: ${appId})`
                );
                return duplicateRecords;
            }

            Logger.debug(`重複レコードなし (AppID: ${appId})`);
            return null;
        } catch (error) {
            Logger.error("重複確認エラー:", error);
            throw error;
        }
    }

    /**
     * 複数のレコードについて一括で重複確認を実行
     * @param appId - アプリID
     * @param records - 確認するレコード配列
     * @param fieldNames - 確認対象フィールド名（単数 or 複数）
     * @returns 重複情報を含む結果配列 { record, isDuplicate, duplicates }
     * @example
     * ```typescript
     * const results = await KintoneApiService.checkBatchDuplicateRecords(
     *   APP_IDS.PL_DAILY,
     *   [
     *     { date: { type: "DATE", value: "2024-06-01" }, ... },
     *     { date: { type: "DATE", value: "2024-06-02" }, ... }
     *   ],
     *   "date"
     * );
     *
     * results.forEach((result) => {
     *   if (result.isDuplicate) {
     *     console.log(`重複: ${result.duplicates.length}件`, result.duplicates);
     *   }
     * });
     * ```
     */
    static async checkBatchDuplicateRecords(
        appId: number,
        records: Record<string, any>[],
        fieldNames: string | string[]
    ): Promise<
        Array<{
            record: Record<string, any>;
            isDuplicate: boolean;
            duplicates: any[] | null;
        }>
    > {
        Logger.debug(`一括重複確認を開始します (件数: ${records.length}, AppID: ${appId})`);

        const results: Array<{
            record: Record<string, any>;
            isDuplicate: boolean;
            duplicates: any[] | null;
        }> = [];

        // 正規化されたフィールド配列
        const fieldsArray = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

        // 値抽出ユーティリティ
        const extractValue = (fieldValue: any) =>
            typeof fieldValue === "object" && fieldValue && fieldValue.value !== undefined
                ? fieldValue.value
                : fieldValue;

        // 単一フィールドの場合は in 演算子でまとめて検索（高速）
        if (fieldsArray.length === 1) {
            const field = fieldsArray[0];
            const chunkSize = 100; // クエリ長やAPI制限を考慮して分割

            for (let i = 0; i < records.length; i += chunkSize) {
                const chunk = records.slice(i, i + chunkSize);

                const values = chunk
                    .map((rec) => extractValue(rec[field]))
                    .filter((v) => v !== undefined && v !== null);

                if (values.length === 0) {
                    // チャンク内に有効な値がなければ全件を非重複として扱う
                    chunk.forEach((rec) =>
                        results.push({ record: rec, isDuplicate: false, duplicates: null })
                    );
                    continue;
                }

                // date フィールドは in 演算子を使えないため OR 条件を作る
                const useInOperator = field !== "date";

                let query: string;
                if (useInOperator) {
                    const formattedValues = values
                        .map((v) =>
                            typeof v === "string"
                                ? `"${String(v).replace(/"/g, '\\"')}"`
                                : String(v)
                        )
                        .join(",");
                    query = `${field} in (${formattedValues})`;
                } else {
                    const orClauses = values
                        .map((v) =>
                            typeof v === "string"
                                ? `${field} = "${String(v).replace(/"/g, '\\"')}"`
                                : `${field} = ${String(v)}`
                        )
                        .join(" or ");
                    query = `(${orClauses})`;
                }

                // マッチする既存レコードを一括取得
                const existing = await this.fetchAllRecords<any>(appId, fieldsArray, query);

                const existingSet = new Set(existing.map((r: any) => extractValue(r[field])));

                for (const rec of chunk) {
                    const v = extractValue(rec[field]);
                    const isDup = v !== undefined && existingSet.has(v);
                    const duplicates = isDup
                        ? existing.filter((r: any) => extractValue(r[field]) === v)
                        : null;
                    results.push({ record: rec, isDuplicate: isDup, duplicates });
                }
            }
        } else {
            // 複数フィールド（複合キー）: 各レコードごとの AND 条件を OR で繋いで一括検索
            const chunkSize = 30; // 複合条件はクエリ長になりやすいため小さめ

            for (let i = 0; i < records.length; i += chunkSize) {
                const chunk = records.slice(i, i + chunkSize);

                const orClauses: string[] = [];

                for (const rec of chunk) {
                    const andParts: string[] = [];
                    let skip = false;
                    for (const f of fieldsArray) {
                        const val = extractValue(rec[f]);
                        if (val === undefined || val === null) {
                            skip = true;
                            break;
                        }
                        if (typeof val === "string") {
                            andParts.push(`${f} = "${String(val).replace(/"/g, '\\"')}"`);
                        } else {
                            andParts.push(`${f} = ${String(val)}`);
                        }
                    }
                    if (!skip && andParts.length > 0) {
                        orClauses.push(`(${andParts.join(" and ")})`);
                    }
                }

                if (orClauses.length === 0) {
                    chunk.forEach((rec) =>
                        results.push({ record: rec, isDuplicate: false, duplicates: null })
                    );
                    continue;
                }

                const query = orClauses.join(" or ");

                const existing = await this.fetchAllRecords<any>(appId, fieldsArray, query);

                // 既存レコードを複合キーでマッピング
                const keyOf = (obj: any) =>
                    fieldsArray.map((f) => String(extractValue(obj[f]) ?? "")).join("|::|");

                const existingMap = new Map<string, any[]>();
                for (const e of existing) {
                    const k = keyOf(e);
                    const arr = existingMap.get(k) || [];
                    arr.push(e);
                    existingMap.set(k, arr);
                }

                for (const rec of chunk) {
                    const missing = fieldsArray.some(
                        (f) => extractValue(rec[f]) === undefined || extractValue(rec[f]) === null
                    );
                    if (missing) {
                        results.push({ record: rec, isDuplicate: false, duplicates: null });
                        continue;
                    }

                    const key = keyOf(rec);
                    const duplicates = existingMap.get(key) || null;
                    results.push({
                        record: rec,
                        isDuplicate: !!(duplicates && duplicates.length > 0),
                        duplicates,
                    });
                }
            }
        }

        Logger.debug(`一括重複確認完了 (重複有: ${results.filter((r) => r.isDuplicate).length}件)`);

        return results;
    }
}
