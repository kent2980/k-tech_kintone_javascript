/**
 * メモリリーク検出ユーティリティ
 * DataTablesやChart.jsのインスタンスが適切に破棄されているかを監視
 */

import { Logger } from "./Logger";

/**
 * メモリリーク検出結果
 *
 * @category Utils
 */
export interface MemoryLeakReport {
    /** 検出日時 */
    timestamp: Date;
    /** 未破棄のDataTablesインスタンス数 */
    dataTablesCount: number;
    /** 未破棄のChart.jsインスタンス数 */
    chartsCount: number;
    /** 未破棄のイベントリスナー数（概算） */
    eventListenersCount: number;
    /** 警告メッセージ */
    warnings: string[];
}

/**
 * メモリリーク検出クラス
 */
export class MemoryLeakDetector {
    private static isEnabled: boolean = false;
    private static checkInterval: number | null = null;
    private static previousDataTablesCount: number = 0;
    private static previousChartsCount: number = 0;

    /**
     * メモリリーク検出を有効化
     * チェック間隔を指定可能（ミリ秒、デフォルト: 30000）
     */
    static enable(intervalMs: number = 30000): void {
        if (this.isEnabled) {
            Logger.warn("メモリリーク検出は既に有効です");
            return;
        }

        this.isEnabled = true;
        this.checkInterval = window.setInterval(() => {
            this.checkMemoryLeaks();
        }, intervalMs);

        Logger.info(`メモリリーク検出を有効化しました（間隔: ${intervalMs}ms）`);
    }

    /**
     * メモリリーク検出を無効化
     */
    static disable(): void {
        if (!this.isEnabled) return;

        if (this.checkInterval !== null) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.isEnabled = false;
        Logger.info("メモリリーク検出を無効化しました");
    }

    /**
     * メモリリークをチェック
     */
    static checkMemoryLeaks(): MemoryLeakReport {
        const report: MemoryLeakReport = {
            timestamp: new Date(),
            dataTablesCount: 0,
            chartsCount: 0,
            eventListenersCount: 0,
            warnings: [],
        };

        // DataTablesインスタンスの検出
        try {
            // jQueryはグローバルに存在する可能性があるため、型アサーションを使用

            if (typeof window !== "undefined" && (window as any).jQuery) {
                const $ = (window as any).jQuery;
                const tables = $("table").filter(function (this: HTMLElement) {
                    return $.fn.DataTable && $.fn.DataTable.isDataTable(this);
                });
                report.dataTablesCount = tables.length;

                if (report.dataTablesCount > this.previousDataTablesCount) {
                    report.warnings.push(
                        `DataTablesインスタンスが増加しています: ${this.previousDataTablesCount} → ${report.dataTablesCount}`
                    );
                }
                this.previousDataTablesCount = report.dataTablesCount;
            }
        } catch (error) {
            Logger.debug("DataTables検出でエラー:", error);
        }

        // Chart.jsインスタンスの検出（概算）
        try {
            const canvases = document.querySelectorAll("canvas");
            report.chartsCount = canvases.length;

            if (report.chartsCount > this.previousChartsCount) {
                report.warnings.push(
                    `Chart.jsインスタンスが増加しています: ${this.previousChartsCount} → ${report.chartsCount}`
                );
            }
            this.previousChartsCount = report.chartsCount;
        } catch (error) {
            Logger.debug("Chart.js検出でエラー:", error);
        }

        // 警告をログに出力
        if (report.warnings.length > 0) {
            Logger.warn("メモリリークの可能性が検出されました:", report);
        }

        return report;
    }

    /**
     * 現在のメモリ使用状況を取得
     * performance.memoryが利用可能な場合のみ返す
     */
    static getMemoryUsage(): {
        usedJSHeapSize?: number;
        totalJSHeapSize?: number;
        jsHeapSizeLimit?: number;
    } {
        // performance.memoryは非標準のプロパティのため、型アサーションを使用

        if (typeof performance !== "undefined" && (performance as any).memory) {
            const memory = (performance as any).memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize as number,
                totalJSHeapSize: memory.totalJSHeapSize as number,
                jsHeapSizeLimit: memory.jsHeapSizeLimit as number,
            };
        }
        return {};
    }
}
