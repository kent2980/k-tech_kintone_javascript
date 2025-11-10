/**
 * データ取得用カスタムフック（将来のReact化への準備）
 * 現在はTypeScriptクラスとして実装
 */

import { KintoneApiService } from "../services";
import { FilterConfig } from "../types";
import { Logger, PerformanceUtil } from "../utils";

/// <reference path="../fields/monthly_fields.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />

/**
 * データ取得の状態管理
 */
interface DataFetcherState {
    loading: boolean;
    error: string | null;
    masterModelData: model_master.SavedFields[] | null;
    dailyReportData: daily.SavedFields[];
    productionReportData: line_daily.SavedFields[];
    plMonthlyData: monthly.SavedFields | null;
}

/**
 * データ取得用のフック風クラス
 * 将来のReact Hooksへの移行を想定した構造
 */
export class DataFetcher {
    private state: DataFetcherState = {
        loading: false,
        error: null,
        masterModelData: null,
        dailyReportData: [],
        productionReportData: [],
        plMonthlyData: null,
    };

    private listeners: Array<(state: DataFetcherState) => void> = [];

    /**
     * 状態変更を通知
     */
    private setState(updates: Partial<DataFetcherState>): void {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach((listener) => listener(this.state));
    }

    /**
     * 状態変更のリスナーを追加
     */
    subscribe(listener: (state: DataFetcherState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * 現在の状態を取得
     */
    getState(): DataFetcherState {
        return { ...this.state };
    }

    /**
     * マスタデータを取得
     */
    async fetchMasterModelData(): Promise<model_master.SavedFields[]> {
        this.setState({ loading: true, error: null });

        try {
            const data = await KintoneApiService.fetchMasterModelData();
            this.setState({ masterModelData: data, loading: false });
            Logger.info(`マスタモデルデータを取得: ${data.length}件`);
            return data;
        } catch (error) {
            const errorMessage = `マスタデータ取得エラー: ${error}`;
            this.setState({ error: errorMessage, loading: false });
            Logger.error(errorMessage, error);
            return [];
        }
    }

    /**
     * PL月次データを取得
     */
    async fetchPLMonthlyData(year: string, month: string): Promise<monthly.SavedFields | null> {
        this.setState({ loading: true, error: null });

        try {
            const data = await KintoneApiService.fetchPLMonthlyData(year, month);
            this.setState({ plMonthlyData: data, loading: false });
            Logger.info(`PL月次データを取得: ${year}/${month}`);
            return data;
        } catch (error) {
            const errorMessage = `PL月次データ取得エラー: ${error}`;
            this.setState({ error: errorMessage, loading: false });
            Logger.error(errorMessage, error);
            return null;
        }
    }

    /**
     * PL日次データを取得
     */
    async fetchPLDailyData(year: string, month: string): Promise<daily.SavedFields[]> {
        this.setState({ loading: true, error: null });

        try {
            const data = await KintoneApiService.fetchPLDailyData(year, month);
            this.setState({ dailyReportData: data, loading: false });
            Logger.info(`PL日次データを取得: ${data.length}件`);
            return data;
        } catch (error) {
            const errorMessage = `PL日次データ取得エラー: ${error}`;
            this.setState({ error: errorMessage, loading: false });
            Logger.error(errorMessage, error);
            return [];
        }
    }

    /**
     * 生産報告データを取得
     */
    async fetchProductionReportData(filterConfig: FilterConfig): Promise<line_daily.SavedFields[]> {
        this.setState({ loading: true, error: null });

        try {
            const data = await KintoneApiService.fetchProductionReportData(filterConfig);
            this.setState({ productionReportData: data, loading: false });
            Logger.info(`生産報告データを取得: ${data.length}件`);
            return data;
        } catch (error) {
            const errorMessage = `生産報告データ取得エラー: ${error}`;
            this.setState({ error: errorMessage, loading: false });
            Logger.error(errorMessage, error);
            return [];
        }
    }

    /**
     * 全データを一括取得
     */
    async fetchAllData(filterConfig: FilterConfig): Promise<void> {
        const startTime = PerformanceUtil.startMeasure("fetch-all-data");

        try {
            // 並行して実行可能なデータを取得
            const [masterModelData] = await Promise.all([this.fetchMasterModelData()]);

            // フィルター条件に基づくデータを取得
            if (filterConfig.year && filterConfig.month) {
                await Promise.all([
                    this.fetchPLMonthlyData(filterConfig.year, filterConfig.month),
                    this.fetchPLDailyData(filterConfig.year, filterConfig.month),
                    this.fetchProductionReportData(filterConfig),
                ]);
            } else if (filterConfig.year) {
                await this.fetchProductionReportData(filterConfig);
            }

            const endTime = PerformanceUtil.endMeasure("fetch-all-data");
            Logger.success(`全データ取得完了: ${endTime.toFixed(2)}ms`);
        } catch (error) {
            const errorMessage = `データ一括取得エラー: ${error}`;
            this.setState({ error: errorMessage, loading: false });
            Logger.error(errorMessage, error);
        }
    }

    /**
     * エラー状態をクリア
     */
    clearError(): void {
        this.setState({ error: null });
    }

    /**
     * 全状態をリセット
     */
    reset(): void {
        this.state = {
            loading: false,
            error: null,
            masterModelData: null,
            dailyReportData: [],
            productionReportData: [],
            plMonthlyData: null,
        };
        this.listeners.forEach((listener) => listener(this.state));
    }
}
