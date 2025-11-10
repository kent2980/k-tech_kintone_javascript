/**
 * テーブルフィルター用カスタムフック（将来のReact化への準備）
 * 現在はTypeScriptクラスとして実装
 */

import { FilterConfig } from "../types";
import { DateUtil, Logger } from "../utils";

/**
 * フィルター状態管理
 */
interface TableFiltersState {
    filterConfig: FilterConfig;
    availableYears: string[];
    availableMonths: string[];
    isFiltering: boolean;
}

/**
 * テーブルフィルター用のフック風クラス
 * 将来のReact Hooksへの移行を想定した構造
 */
export class TableFilters {
    private state: TableFiltersState = {
        filterConfig: {
            year: null,
            month: null,
        },
        availableYears: [],
        availableMonths: [],
        isFiltering: false,
    };

    private listeners: Array<(state: TableFiltersState) => void> = [];
    private filterChangeListeners: Array<(config: FilterConfig) => void> = [];

    /**
     * 状態変更を通知
     */
    private setState(updates: Partial<TableFiltersState>): void {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach((listener) => listener(this.state));
    }

    /**
     * 状態変更のリスナーを追加
     */
    subscribe(listener: (state: TableFiltersState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * フィルター変更のリスナーを追加
     */
    onFilterChange(listener: (config: FilterConfig) => void): () => void {
        this.filterChangeListeners.push(listener);
        return () => {
            const index = this.filterChangeListeners.indexOf(listener);
            if (index > -1) {
                this.filterChangeListeners.splice(index, 1);
            }
        };
    }

    /**
     * 現在の状態を取得
     */
    getState(): TableFiltersState {
        return { ...this.state };
    }

    /**
     * 現在のフィルター設定を取得
     */
    getFilterConfig(): FilterConfig {
        return { ...this.state.filterConfig };
    }

    /**
     * 初期化 - 利用可能な年月を設定
     */
    initialize(yearRange: number = 10): void {
        const currentYear = DateUtil.getCurrentYear();
        const availableYears = Array.from({ length: yearRange }, (_, i) =>
            (currentYear - yearRange + 1 + i).toString()
        );

        const availableMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

        this.setState({
            availableYears,
            availableMonths,
            filterConfig: {
                year: currentYear.toString(),
                month: DateUtil.getCurrentMonth().toString(),
            },
        });

        Logger.info(`フィルターを初期化: ${availableYears.length}年分, 現在: ${currentYear}年`);
    }

    /**
     * 年フィルターを設定
     */
    setYear(year: string | null): void {
        const newConfig = { ...this.state.filterConfig, year };
        this.setState({
            filterConfig: newConfig,
            isFiltering: true,
        });

        Logger.debug(`年フィルターを設定: ${year}`);
        this.notifyFilterChange(newConfig);
    }

    /**
     * 月フィルターを設定
     */
    setMonth(month: string | null): void {
        const newConfig = { ...this.state.filterConfig, month };
        this.setState({
            filterConfig: newConfig,
            isFiltering: true,
        });

        Logger.debug(`月フィルターを設定: ${month}`);
        this.notifyFilterChange(newConfig);
    }

    /**
     * フィルター設定を一括更新
     */
    setFilterConfig(config: FilterConfig): void {
        this.setState({
            filterConfig: { ...config },
            isFiltering: true,
        });

        Logger.debug(`フィルター設定を更新:`, config);
        this.notifyFilterChange(config);
    }

    /**
     * フィルターをリセット
     */
    reset(): void {
        const resetConfig = { year: null, month: null };
        this.setState({
            filterConfig: resetConfig,
            isFiltering: false,
        });

        Logger.info("フィルターをリセット");
        this.notifyFilterChange(resetConfig);
    }

    /**
     * フィルター処理完了を通知
     */
    setFilteringComplete(): void {
        this.setState({ isFiltering: false });
    }

    /**
     * 現在の年を取得
     */
    getCurrentYear(): string {
        return DateUtil.getCurrentYear().toString();
    }

    /**
     * 現在の月を取得
     */
    getCurrentMonth(): string {
        return DateUtil.getCurrentMonth().toString();
    }

    /**
     * フィルターが有効かどうかを判定
     */
    hasActiveFilters(): boolean {
        const { year, month } = this.state.filterConfig;
        return year !== null || month !== null;
    }

    /**
     * 完全なフィルター（年月両方）が設定されているかを判定
     */
    hasCompleteFilters(): boolean {
        const { year, month } = this.state.filterConfig;
        return year !== null && month !== null;
    }

    /**
     * フィルター変更を通知
     */
    private notifyFilterChange(config: FilterConfig): void {
        // デバウンス処理を将来実装可能
        setTimeout(() => {
            this.filterChangeListeners.forEach((listener) => listener(config));
        }, 0);
    }

    /**
     * デバッグ用 - 現在の状態を出力
     */
    debug(): void {
        Logger.debug("TableFilters State:", this.state);
    }
}
