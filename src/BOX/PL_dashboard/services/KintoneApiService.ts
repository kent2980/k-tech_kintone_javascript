import { API_LIMITS, APP_CONFIG, APP_IDS } from "../config";
import { kintoneApiFatalRegisterError } from "../error/kintoneApiError";
import {
    FilterConfig,
    KintoneDuplicateResult,
    KintoneRecord,
    KintoneRecordPostResponse,
    KintoneRecordsPostResponse,
    KintoneSaveResult,
    KintoneSaveResults,
} from "../types";
import { DateUtil, ErrorHandler, FieldsUtil, Logger, PerformanceUtil } from "../utils";

/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />
/// <reference path="../fields/holiday_fields.d.ts" />

/**
 * kintone API関連の処理を担当するサービスクラス
 *
 * @remarks
 * このクラスはkintone APIとの通信を担当し、以下の機能を提供します：
 * - レコードの取得（fetch）
 * - レコードの保存（save）
 * - レコードの更新（update）
 * - レコードの削除（delete）
 * - 重複チェック（checkDuplicate）
 *
 * @example
 * ```typescript
 * const apiService = new KintoneApiService();
 * const monthlyData = await apiService.fetchPLMonthlyData("2024", "01");
 * ```
 *
 * @category Services
 */
export class KintoneApiService {
    /**
     * コンストラクタ
     *
     * @remarks
     * 将来的に設定や依存性を注入できるように拡張可能
     */
    constructor() {
        // 現在は設定不要のため空実装
        // 将来的に設定や依存性を注入できるように拡張可能
    }

    /**
     * キャッシュキーを生成する
     */
    private static createCacheKey(prefix: string, ...params: (string | number)[]): string {
        return params.length > 0 ? `${prefix}-${params.join("-")}` : prefix;
    }

    /**
     * 特定のアプリのキャッシュを無効化する
     * 追加パラメータを指定した場合は特定のキーを、省略した場合は該当アプリの全キャッシュを無効化
     */
    private static invalidateCache(
        appType: keyof typeof APP_CONFIG.CACHE_KEY_PREFIX,
        ...params: (string | number)[]
    ): void {
        const prefix = APP_CONFIG.CACHE_KEY_PREFIX[appType];
        if (params.length > 0) {
            // 特定のキーを無効化
            const cacheKey = this.createCacheKey(prefix, ...params);
            PerformanceUtil.clearCache(`^${cacheKey}$`);
            Logger.debug(`キャッシュを無効化しました: ${cacheKey}`);
        } else {
            // 該当アプリの全キャッシュを無効化
            PerformanceUtil.clearCache(`^${prefix}-`);
            Logger.debug(`キャッシュを無効化しました: ${prefix}-*`);
        }
    }

    /**
     * 複数のアプリのキャッシュを無効化する
     */
    private static invalidateMultipleCaches(
        ...appTypes: Array<keyof typeof APP_CONFIG.CACHE_KEY_PREFIX>
    ): void {
        for (const appType of appTypes) {
            this.invalidateCache(appType);
        }
    }

    /**
     * アプリIDからアプリタイプを取得する
     * 見つからない場合はnullを返す
     */
    private static getAppTypeFromId(
        appId: number
    ): keyof typeof APP_CONFIG.CACHE_KEY_PREFIX | null {
        if (appId === APP_IDS.PL_MONTHLY) return "PL_MONTHLY";
        if (appId === APP_IDS.PL_DAILY) return "PL_DAILY";
        if (appId === APP_IDS.MASTER_MODEL) return "MASTER_MODEL";
        if (appId === APP_IDS.PRODUCTION_REPORT) return "PRODUCTION_REPORT";
        if (appId === APP_IDS.HOLIDAY) return "HOLIDAY";
        return null;
    }

    /**
     * PL月次データを取得する
     *
     * キャッシュ機能を内蔵しており、設定ファイルで指定された期間はキャッシュから取得します。
     * エラーが発生した場合は、ErrorHandlerを使用してログに記録し、nullを返します。
     * データが存在しない場合はnullを返す。
     *
     * @example
     * ```typescript
     * const apiService = new KintoneApiService();
     * const data = await apiService.fetchPLMonthlyData("2024", "01");
     * if (data) {
     *   console.log(data.year_month?.value);
     * }
     * ```
     *
     * @throws {Error} kintone API呼び出しに失敗した場合（エラーハンドラーで処理される）
     */
    async fetchPLMonthlyData(year: string, month: string): Promise<monthly.SavedFields | null> {
        const cacheKey = KintoneApiService.createCacheKey(
            APP_CONFIG.CACHE_KEY_PREFIX.PL_MONTHLY,
            year,
            month
        );

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

            // 結果をキャッシュ（設定ファイルからTTLを取得）
            if (result) {
                PerformanceUtil.setCache(cacheKey, result, APP_CONFIG.CACHE_DURATION.PL_MONTHLY);
            }

            return result;
        } catch (error) {
            return ErrorHandler.handleErrorAndReturnNull("PL月次データ取得エラー", error, {
                year,
                month,
                appId: APP_IDS.PL_MONTHLY,
            });
        }
    }

    /**
     * PL日次データを取得する
     *
     * 指定された年月の1日から月末日までのデータを取得します。
     * 未来の日付の場合は今日までに制限されます。
     * エラーが発生した場合は、ErrorHandlerを使用してログに記録し、空配列を返します。
     * データが存在しない場合は空配列を返す。
     *
     * @example
     * ```typescript
     * const apiService = new KintoneApiService();
     * const records = await apiService.fetchPLDailyData("2024", "01");
     * records.forEach(record => {
     *   console.log(record.date?.value);
     * });
     * ```
     *
     * @throws {Error} kintone API呼び出しに失敗した場合（エラーハンドラーで処理される）
     */
    async fetchPLDailyData(year: string, month: string): Promise<daily.SavedFields[]> {
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
            return ErrorHandler.handleErrorAndReturnEmpty<daily.SavedFields>(
                "PL日次データ取得エラー",
                error,
                {
                    year,
                    month,
                    appId: APP_IDS.PL_DAILY,
                }
            );
        }
    }

    /**
     * 生産日報報告書データを取得する（インスタンスメソッド）
     */
    async fetchProductionReportData(filterConfig: FilterConfig): Promise<line_daily.SavedFields[]> {
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
            return ErrorHandler.handleErrorAndReturnEmpty<line_daily.SavedFields>(
                "生産日報データ取得エラー",
                error,
                {
                    filterConfig,
                    appId: APP_IDS.PRODUCTION_REPORT,
                }
            );
        }
    }

    /**
     * マスタ機種一覧データを取得する（インスタンスメソッド）
     */
    async fetchMasterModelData(): Promise<model_master.SavedFields[]> {
        const cacheKey = KintoneApiService.createCacheKey(APP_CONFIG.CACHE_KEY_PREFIX.MASTER_MODEL);

        // キャッシュから取得を試行
        const cachedData = PerformanceUtil.getFromCache<model_master.SavedFields[]>(cacheKey);
        if (cachedData) {
            console.log("マスタ機種データをキャッシュから取得: " + cachedData.length + "件");
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

            // 結果をキャッシュ（設定ファイルからTTLを取得）
            PerformanceUtil.setCache(cacheKey, records, APP_CONFIG.CACHE_DURATION.MASTER_MODEL);

            return records;
        } catch (error) {
            return ErrorHandler.handleErrorAndReturnEmpty<model_master.SavedFields>(
                "マスタ機種データ取得エラー",
                error,
                {
                    appId: APP_IDS.MASTER_MODEL,
                }
            );
        }
    }

    /**
     * 祝日データを取得する（インスタンスメソッド）
     *
     */
    async fetchHolidayData(): Promise<holiday.SavedFields[]> {
        const fields = FieldsUtil.getHolidayFields();

        return await this.fetchAllRecords<holiday.SavedFields>(
            APP_IDS.HOLIDAY,
            fields,
            "order by date asc"
        );
    }

    /**
     * すべてのレコードを取得する（ページング処理込み）（インスタンスメソッド）
     */
    private async fetchAllRecords<T>(appId: number, fields: string[], query: string): Promise<T[]> {
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
     * レコード取得のリトライ処理（インスタンスメソッド）
     */
    async withRetry<T>(
        fetchFunction: () => Promise<T>,
        maxRetries: number = API_LIMITS.MAX_RETRIES
    ): Promise<T> {
        let lastError: Error;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fetchFunction();
            } catch (error) {
                lastError = error as Error;
                ErrorHandler.logError(`API取得試行 ${i + 1}/${maxRetries} 失敗`, error, {
                    attempt: i + 1,
                    maxRetries,
                });

                if (i < maxRetries - 1) {
                    // 指数バックオフで待機
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }

        throw lastError!;
    }

    /**
     * 与えられた API 呼び出し関数群を並列で実行（同時実行数制限付き）（インスタンスメソッド）
     * 各呼び出しは `withRetry` でラップされます。
     */
    private async executeBatchedRequests<T>(
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
     * PL月次データを登録する（インスタンスメソッド）
     *
     * @throws kintoneApiDuplicateError 重複レコードが見つかった場合のエラー
     * @throws kintoneApiFatalRegisterError その他の登録失敗時のエラー
     */
    async savePLMonthlyData(
        record: Record<string, unknown>
    ): Promise<KintoneSaveResult | KintoneDuplicateResult> {
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

                // PL月次データのキャッシュを無効化
                KintoneApiService.invalidateCache("PL_MONTHLY");

                const saveResult: KintoneSaveResult = {
                    ok: true,
                    id: res.id,
                    revision: res.revision,
                };

                return saveResult;
            } else {
                Logger.warn("PL月次データの重複が検出され、登録をスキップしました:", duplicates);
                return {
                    ok: false,
                };
            }
        } catch (error) {
            ErrorHandler.logError("PL月次データ登録エラー", error, {
                method: "savePLMonthlyData",
                appId: APP_IDS.PL_MONTHLY,
            });
            throw new kintoneApiFatalRegisterError(
                `PL月次データの登録中にエラーが発生しました。:${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * PL日次データを登録する（インスタンスメソッド）
     *
     * @throws kintoneApiDuplicateError 重複レコードが見つかった場合のエラー
     * @throws kintoneApiFatalRegisterError その他の登録失敗時のエラー
     */
    async savePLDailyData(
        records: Record<string, unknown>[]
    ): Promise<KintoneSaveResults | KintoneDuplicateResult> {
        try {
            // まずバッチ内で同一の日付が重複していないかチェックして、あれば除去する
            let uploadRecords = records;
            try {
                const dateValues = records.map((r) => {
                    const v = r && (r as Record<string, unknown>).date;
                    return typeof v === "object" &&
                        v &&
                        (v as { value?: unknown }).value !== undefined
                        ? (v as { value: unknown }).value
                        : v;
                });

                const seen = new Set<string>();
                const duplicatesInBatch: string[] = [];
                const uniqueRecords: Record<string, unknown>[] = [];

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
                    uploadRecords = uniqueRecords;
                }
            } catch (e) {
                // 日付抽出で予期せぬ形式が来た場合はそのまま進める（既存の重複チェックでガード）
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
                return {
                    ok: false,
                };
            }
            // 登録処理開始
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録（同時実行数は制限）
            const batches: Record<string, unknown>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const uploadResults: KintoneRecordsPostResponse[] = [];
            const tasks = batches.map((batch): (() => Promise<KintoneRecordsPostResponse>) => {
                return async (): Promise<KintoneRecordsPostResponse> => {
                    const res = (await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                        app: APP_IDS.PL_DAILY,
                        records: batch,
                    })) as KintoneRecordsPostResponse;
                    Logger.debug(`${batch.length}件のPL日次データを登録しました`);
                    uploadResults.push(res);
                    return res;
                };
            });

            await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.PL_DAILY,
                action: "savePLDailyData",
            });

            // PL日次データのキャッシュを無効化
            KintoneApiService.invalidateCache("PL_DAILY");

            // uploadResults からsaveResultsを構築
            const saveResults: KintoneSaveResults = {
                ok: true,
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
            ErrorHandler.logError("PL日次データ登録エラー", error, {
                method: "savePLDailyData",
                appId: APP_IDS.PL_DAILY,
                recordCount: records.length,
            });
            throw new kintoneApiFatalRegisterError(
                `PL日次データの登録中にエラーが発生しました。:${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 生産日報データを登録する（インスタンスメソッド）
     *
     * @throws kintoneApiDuplicateError 重複レコードが見つかった場合のエラー
     * @throws kintoneApiFatalRegisterError その他の登録失敗時のエラー
     */
    async saveProductionReportData(
        records: Record<string, unknown>[]
    ): Promise<KintoneSaveResults | KintoneDuplicateResult> {
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
                return {
                    ok: false,
                };
            }
            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録
            const batches: Record<string, unknown>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch): (() => Promise<KintoneRecordsPostResponse>) => {
                return async (): Promise<KintoneRecordsPostResponse> => {
                    const res = (await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                        app: APP_IDS.PRODUCTION_REPORT,
                        records: batch,
                    })) as KintoneRecordsPostResponse;
                    Logger.debug(`${batch.length}件の生産日報データを登録しました`);
                    return res;
                };
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.PRODUCTION_REPORT,
                action: "saveProductionReportData",
            });
            // kintone のレスポンスから id を収集できる場合は収集
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    recordIds.push(
                        ...r.records.map((rec: KintoneRecordPostResponse) => Number(rec.id))
                    );
                }
            }
            Logger.success(`合計${recordIds.length}件の生産日報データを登録しました`);

            // 生産日報データのキャッシュを無効化
            KintoneApiService.invalidateCache("PRODUCTION_REPORT");

            const saveResults: KintoneSaveResults = {
                ok: true,
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
            ErrorHandler.logError("生産日報データ登録エラー", error, {
                method: "saveProductionReportData",
                appId: APP_IDS.PRODUCTION_REPORT,
                recordCount: records.length,
            });
            throw new kintoneApiFatalRegisterError(
                `生産日報データの登録中にエラーが発生しました。:${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * マスタ機種データを登録する（インスタンスメソッド）
     *
     * @throws kintoneApiFatalRegisterError 登録失敗時のエラー
     */
    async saveMasterModelData(records: Record<string, unknown>[]): Promise<KintoneSaveResults> {
        try {
            Logger.debug(`${records.length}件のマスタ機種データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録
            const batches: Record<string, unknown>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch): (() => Promise<KintoneRecordsPostResponse>) => {
                return async (): Promise<KintoneRecordsPostResponse> => {
                    const batchRecords = batch.map((record) => ({
                        fields: JSON.parse(JSON.stringify(record)),
                    }));
                    const res = (await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                        app: APP_IDS.MASTER_MODEL,
                        records: batchRecords,
                    })) as KintoneRecordsPostResponse;
                    Logger.debug(`${batchRecords.length}件のマスタ機種データを登録しました`);
                    return res;
                };
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.MASTER_MODEL,
                action: "saveMasterModelData",
            });
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    recordIds.push(
                        ...r.records.map((rec: KintoneRecordPostResponse) => Number(rec.id))
                    );
                }
            }

            Logger.success(`合計${recordIds.length}件のマスタ機種データを登録しました`);

            // マスタ機種データのキャッシュを無効化
            KintoneApiService.invalidateCache("MASTER_MODEL");

            const saveResults: KintoneSaveResults = {
                ok: true,
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
            ErrorHandler.logError("マスタ機種データ登録エラー", error, {
                method: "saveMasterModelData",
                appId: APP_IDS.MASTER_MODEL,
                recordCount: records.length,
            });
            throw new kintoneApiFatalRegisterError(
                `マスタ機種データの登録中にエラーが発生しました。:${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 祝日データを登録する（インスタンスメソッド）
     *
     * @throws kintoneApiFatalRegisterError 登録失敗時のエラー
     */
    async saveHolidayData(records: Record<string, unknown>[]): Promise<KintoneSaveResults> {
        try {
            Logger.debug(`${records.length}件の祝日データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で登録
            const batches: Record<string, unknown>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch): (() => Promise<KintoneRecordsPostResponse>) => {
                return async (): Promise<KintoneRecordsPostResponse> => {
                    const batchRecords = batch.map((record) => ({
                        fields: JSON.parse(JSON.stringify(record)),
                    }));
                    const res = (await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                        app: APP_IDS.HOLIDAY,
                        records: batchRecords,
                    })) as KintoneRecordsPostResponse;
                    Logger.debug(`${batchRecords.length}件の祝日データを登録しました`);
                    return res;
                };
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: APP_IDS.HOLIDAY,
                action: "saveHolidayData",
            });
            for (const r of responses) {
                if (r && Array.isArray(r.records)) {
                    recordIds.push(
                        ...r.records.map((rec: KintoneRecordPostResponse) => Number(rec.id))
                    );
                }
            }

            Logger.success(`合計${recordIds.length}件の祝日データを登録しました`);

            // 祝日データのキャッシュを無効化
            KintoneApiService.invalidateCache("HOLIDAY");

            const saveResults: KintoneSaveResults = {
                ok: true,
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
            ErrorHandler.logError("祝日データ登録エラー", error, {
                method: "saveHolidayData",
                appId: APP_IDS.HOLIDAY,
                recordCount: records.length,
            });
            throw new kintoneApiFatalRegisterError(
                `祝日データの登録中にエラーが発生しました。:${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 単一レコードを更新する（インスタンスメソッド）
     */
    async updateRecord(
        appId: number,
        recordId: number,
        record: Record<string, unknown>
    ): Promise<unknown> {
        try {
            Logger.debug(`レコードを更新しています (AppID: ${appId}, RecordID: ${recordId})`);

            const response = await kintone.api(kintone.api.url("/k/v1/record", true), "PUT", {
                app: appId,
                id: recordId,
                record: record,
            });

            Logger.success(`レコードを更新しました (RecordID: ${recordId})`);

            // 該当アプリのキャッシュを無効化
            const appType = KintoneApiService.getAppTypeFromId(appId);
            if (appType) {
                KintoneApiService.invalidateCache(appType);
            } else {
                // アプリタイプが特定できない場合は全キャッシュをクリア（フォールバック）
                PerformanceUtil.clearCache();
                Logger.warn(`未知のアプリIDのため全キャッシュをクリアしました: ${appId}`);
            }

            return response;
        } catch (error) {
            ErrorHandler.logError("レコード更新エラー", error, {
                method: "updateRecord",
                appId,
                recordId,
            });
            throw error;
        }
    }

    /**
     * 複数レコードを更新する（インスタンスメソッド）
     */
    async updateRecords(appId: number, records: Record<string, unknown>[]): Promise<unknown> {
        try {
            Logger.debug(`${records.length}件のレコードを更新しています (AppID: ${appId})`);

            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;
            const updateData: unknown[] = [];

            // バッチに分割して並列で更新
            const batches: Record<string, unknown>[][] = [];
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch): (() => Promise<unknown>) => {
                return async (): Promise<unknown> => {
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
                };
            });

            const responses = await this.executeBatchedRequests(tasks, 3, {
                appId: appId,
                action: "updateRecords",
            });
            for (const r of responses) {
                if (
                    r &&
                    typeof r === "object" &&
                    "records" in r &&
                    Array.isArray((r as { records: unknown[] }).records)
                ) {
                    const records = (r as { records: unknown[] }).records;
                    updateData.push(...(records as Array<{ id: string; revision: string }>));
                }
            }

            Logger.success(`合計${updateData.length}件のレコードを更新しました`);

            // 該当アプリのキャッシュを無効化
            const appType = KintoneApiService.getAppTypeFromId(appId);
            if (appType) {
                KintoneApiService.invalidateCache(appType);
            } else {
                // アプリタイプが特定できない場合は全キャッシュをクリア（フォールバック）
                PerformanceUtil.clearCache();
                Logger.warn(`未知のアプリIDのため全キャッシュをクリアしました: ${appId}`);
            }

            return updateData;
        } catch (error) {
            ErrorHandler.logError("レコード一括更新エラー", error, {
                method: "updateRecords",
                appId,
                recordCount: records.length,
            });
            throw error;
        }
    }

    /**
     * レコードを削除する（インスタンスメソッド）
     */
    async deleteRecords(appId: number, recordIds: number[]): Promise<{ deletedCount: number }> {
        try {
            Logger.debug(`${recordIds.length}件のレコードを削除しています (AppID: ${appId})`);

            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチに分割して並列で削除
            const batches: number[][] = [];
            for (let i = 0; i < recordIds.length; i += batchSize) {
                batches.push(recordIds.slice(i, i + batchSize));
            }

            const tasks = batches.map((batch): (() => Promise<unknown>) => {
                return async (): Promise<unknown> => {
                    const res = await kintone.api(
                        kintone.api.url("/k/v1/records", true),
                        "DELETE",
                        {
                            app: appId,
                            ids: batch,
                        }
                    );
                    Logger.debug(`${batch.length}件のレコードを削除しました`);
                    return res;
                };
            });

            await this.executeBatchedRequests(tasks, 3, { appId: appId, action: "deleteRecords" });

            Logger.success(`合計${recordIds.length}件のレコードを削除しました`);

            // 該当アプリのキャッシュを無効化
            const appType = KintoneApiService.getAppTypeFromId(appId);
            if (appType) {
                KintoneApiService.invalidateCache(appType);
            } else {
                // アプリタイプが特定できない場合は全キャッシュをクリア（フォールバック）
                PerformanceUtil.clearCache();
                Logger.warn(`未知のアプリIDのため全キャッシュをクリアしました: ${appId}`);
            }

            return { deletedCount: recordIds.length };
        } catch (error) {
            ErrorHandler.logError("レコード削除エラー", error, {
                method: "deleteRecords",
                appId,
                recordIdCount: recordIds.length,
            });
            throw error;
        }
    }

    // ========================================
    // 重複確認メソッド
    // ========================================

    /**
     * 指定フィールドの値が既存レコードと重複しているか確認する（インスタンスメソッド）
     * 重複がない場合はnullを返す
     * @example
     * ```typescript
     * const apiService = new KintoneApiService();
     * // 単一フィールドで確認
     * const duplicate = await apiService.checkDuplicateRecords(
     *   APP_IDS.PL_MONTHLY,
     *   { year_month: { type: "SINGLE_LINE_TEXT", value: "2024_06" } },
     *   "year_month"
     * );
     *
     * // 複数フィールドで確認（AND条件）
     * const duplicates = await apiService.checkDuplicateRecords(
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
    async checkDuplicateRecords(
        appId: number,
        record: Record<string, unknown>,
        fieldNames: string | string[]
    ): Promise<KintoneRecord[] | null> {
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
                        return null;
                    }

                    // kintoneフィールドフォーマットから値を抽出
                    // { value: "..." } または直接値の形式に対応
                    const value =
                        typeof fieldValue === "object" &&
                        fieldValue &&
                        (fieldValue as { value?: unknown }).value !== undefined
                            ? (fieldValue as { value: unknown }).value
                            : fieldValue;

                    // 値のタイプに応じてクエリを構築
                    if (typeof value === "string") {
                        return `${fieldName} = "${value.replace(/"/g, '\\"')}"`;
                    } else if (typeof value === "number") {
                        return `${fieldName} = ${value}`;
                    } else {
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
            ErrorHandler.logError("重複確認エラー", error, {
                method: "checkDuplicateRecords",
                appId,
                fieldNames: Array.isArray(fieldNames) ? fieldNames.join(", ") : fieldNames,
            });
            throw error;
        }
    }

    /**
     * 複数のレコードについて一括で重複確認を実行（インスタンスメソッド）
     * 重複情報を含む結果配列を返す
     *
     * @example
     * ```typescript
     * const apiService = new KintoneApiService();
     * const results = await apiService.checkBatchDuplicateRecords(
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
    async checkBatchDuplicateRecords(
        appId: number,
        records: Record<string, unknown>[],
        fieldNames: string | string[]
    ): Promise<
        Array<{
            record: Record<string, unknown>;
            isDuplicate: boolean;
            duplicates: KintoneRecord[] | null;
        }>
    > {
        Logger.debug(`一括重複確認を開始します (件数: ${records.length}, AppID: ${appId})`);

        const results: Array<{
            record: Record<string, unknown>;
            isDuplicate: boolean;
            duplicates: KintoneRecord[] | null;
        }> = [];

        // 正規化されたフィールド配列
        const fieldsArray = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

        // 値抽出ユーティリティ
        const extractValue = (fieldValue: unknown): unknown => {
            if (typeof fieldValue === "object" && fieldValue !== null && "value" in fieldValue) {
                return (fieldValue as { value: unknown }).value;
            }
            return fieldValue;
        };

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
                const existing = await this.fetchAllRecords<KintoneRecord>(
                    appId,
                    fieldsArray,
                    query
                );

                const existingSet = new Set(existing.map((r) => extractValue(r[field])));

                for (const rec of chunk) {
                    const v = extractValue(rec[field]);
                    const isDup = v !== undefined && existingSet.has(v);
                    const duplicates = isDup
                        ? existing.filter((r) => extractValue(r[field]) === v)
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

                const existing = await this.fetchAllRecords<KintoneRecord>(
                    appId,
                    fieldsArray,
                    query
                );

                // 既存レコードを複合キーでマッピング
                const keyOf = (obj: KintoneRecord | Record<string, unknown>): string =>
                    fieldsArray.map((f) => String(extractValue(obj[f]) ?? "")).join("|::|");

                const existingMap = new Map<string, KintoneRecord[]>();
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
