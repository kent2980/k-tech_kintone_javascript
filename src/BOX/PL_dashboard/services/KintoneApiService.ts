import { API_LIMITS, APP_IDS } from "../config";
import { FilterConfig } from "../types";
import { DateUtil, FieldsUtil, Logger, PerformanceUtil } from "../utils";

/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />

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

    // ========================================
    // レコード登録・更新メソッド
    // ========================================

    /**
     * PL月次データを登録する
     * @param record - 登録するレコード
     * @returns 登録されたレコードID
     */
    static async savePLMonthlyData(record: Record<string, any>): Promise<number> {
        try {
            Logger.debug("PL月次データを登録しています...");
            const response = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                app: APP_IDS.PL_MONTHLY,
                records: [{ fields: record }],
            });

            const recordId = response.records[0].id;
            Logger.success(`PL月次データを登録しました (ID: ${recordId})`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return recordId;
        } catch (error) {
            Logger.error("PL月次データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * PL日次データを登録する
     * @param records - 登録するレコード配列
     * @returns 登録されたレコードID配列
     */
    static async savePLDailyData(records: Record<string, any>[]): Promise<number[]> {
        try {
            Logger.debug(`${records.length}件のPL日次データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチ処理で登録
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                const batchRecords = batch.map((record) => ({ fields: record }));

                const response = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.PL_DAILY,
                    records: batchRecords,
                });

                recordIds.push(...response.records.map((r: any) => r.id));
                Logger.debug(`${batchRecords.length}件のPL日次データを登録しました`);
            }

            Logger.success(`合計${recordIds.length}件のPL日次データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return recordIds;
        } catch (error) {
            Logger.error("PL日次データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * 生産日報データを登録する
     * @param records - 登録するレコード配列
     * @returns 登録されたレコードID配列
     */
    static async saveProductionReportData(records: Record<string, any>[]): Promise<number[]> {
        try {
            Logger.debug(`${records.length}件の生産日報データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチ処理で登録
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                const batchRecords = batch.map((record) => ({ fields: record }));

                const response = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.PRODUCTION_REPORT,
                    records: batchRecords,
                });

                recordIds.push(...response.records.map((r: any) => r.id));
                Logger.debug(`${batchRecords.length}件の生産日報データを登録しました`);
            }

            Logger.success(`合計${recordIds.length}件の生産日報データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return recordIds;
        } catch (error) {
            Logger.error("生産日報データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * マスタ機種データを登録する
     * @param records - 登録するレコード配列
     * @returns 登録されたレコードID配列
     */
    static async saveMasterModelData(records: Record<string, any>[]): Promise<number[]> {
        try {
            Logger.debug(`${records.length}件のマスタ機種データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチ処理で登録
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                const batchRecords = batch.map((record) => ({ fields: record }));

                const response = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.MASTER_MODEL,
                    records: batchRecords,
                });

                recordIds.push(...response.records.map((r: any) => r.id));
                Logger.debug(`${batchRecords.length}件のマスタ機種データを登録しました`);
            }

            Logger.success(`合計${recordIds.length}件のマスタ機種データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return recordIds;
        } catch (error) {
            Logger.error("マスタ機種データ登録エラー:", error);
            throw error;
        }
    }

    /**
     * 祝日データを登録する
     * @param records - 登録するレコード配列
     * @returns 登録されたレコードID配列
     */
    static async saveHolidayData(records: Record<string, any>[]): Promise<number[]> {
        try {
            Logger.debug(`${records.length}件の祝日データを登録しています...`);

            const recordIds: number[] = [];
            const batchSize = API_LIMITS.RECORDS_PER_REQUEST;

            // バッチ処理で登録
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                const batchRecords = batch.map((record) => ({ fields: record }));

                const response = await kintone.api(kintone.api.url("/k/v1/records", true), "POST", {
                    app: APP_IDS.HOLIDAY,
                    records: batchRecords,
                });

                recordIds.push(...response.records.map((r: any) => r.id));
                Logger.debug(`${batchRecords.length}件の祝日データを登録しました`);
            }

            Logger.success(`合計${recordIds.length}件の祝日データを登録しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return recordIds;
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

            // バッチ処理で更新
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                const batchRecords = batch.map((record) => ({
                    id: record.id,
                    record: record.data || record,
                }));

                const response = await kintone.api(kintone.api.url("/k/v1/records", true), "PUT", {
                    app: appId,
                    records: batchRecords,
                });

                updateData.push(...response.records);
                Logger.debug(`${batchRecords.length}件のレコードを更新しました`);
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

            // バッチ処理で削除
            for (let i = 0; i < recordIds.length; i += batchSize) {
                const batch = recordIds.slice(i, i + batchSize);

                await kintone.api(kintone.api.url("/k/v1/records", true), "DELETE", {
                    app: appId,
                    ids: batch,
                });

                Logger.debug(`${batch.length}件のレコードを削除しました`);
            }

            Logger.success(`合計${recordIds.length}件のレコードを削除しました`);

            // キャッシュをクリア
            PerformanceUtil.clearCache();

            return { deletedCount: recordIds.length };
        } catch (error) {
            Logger.error("レコード削除エラー:", error);
            throw error;
        }
    }
}
