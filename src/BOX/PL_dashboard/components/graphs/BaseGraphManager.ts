/// <reference path="../../../../../kintone.d.ts" />
/// <reference path="../../../../../globals.d.ts" />

import Chart from "chart.js/auto";

/**
 * グラフ情報を管理するインターフェース
 *
 * @category Components
 */
export interface ChartInfo {
    /** キャンバスID */
    canvasId: string;
    /** Chart.jsインスタンス */
    chart: Chart;
    /** コンテナ要素 */
    container: HTMLDivElement;
    /** 作成日時 */
    createdAt: Date;
    /** 最終更新日時 */
    updatedAt: Date;
}

/**
 * グラフ管理の基底クラス
 * 汎用的なグラフ管理機能を提供
 */
export abstract class BaseGraphManager {
    /** 管理されているグラフのマップ */
    protected charts: Map<string, ChartInfo> = new Map();

    /**
     * コンストラクタ
     */
    constructor() {
        // 初期化処理（必要に応じて）
    }

    /**
     * グラフコンテナを作成（汎用的な部分）
     * @param canvasId - キャンバスID
     * @param width - コンテナの幅（デフォルト: "100%"）
     * @param height - コンテナの高さ（デフォルト: "600px"）
     * @param minHeight - 最小高さ（デフォルト: "500px"）
     * @param padding - パディング（デフォルト: "20px"）
     * @returns グラフコンテナ要素とキャンバス要素のタプル
     */
    protected createChartContainer(
        canvasId: string,
        width: string = "100%",
        height: string = "600px",
        minHeight: string = "500px",
        padding: string = "20px"
    ): { container: HTMLDivElement; canvas: HTMLCanvasElement } {
        const container = document.createElement("div");
        container.id = `container-${canvasId}`;
        container.style.width = width;
        container.style.height = height;
        container.style.minHeight = minHeight;
        container.style.padding = padding;
        container.style.boxSizing = "border-box";

        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        container.appendChild(canvas);

        return { container, canvas };
    }

    /**
     * グラフ情報を登録
     * @param canvasId - キャンバスID
     * @param chart - Chart.jsインスタンス
     * @param container - コンテナ要素
     */
    protected registerChart(canvasId: string, chart: Chart, container: HTMLDivElement): void {
        const chartInfo: ChartInfo = {
            canvasId,
            chart,
            container,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.charts.set(canvasId, chartInfo);
    }

    /**
     * 指定されたグラフを破棄
     * @param canvasId - キャンバスID
     */
    public destroyChart(canvasId: string): void {
        const chartInfo = this.charts.get(canvasId);
        if (!chartInfo) return;

        try {
            // Chart.jsインスタンスを破棄
            // destroy()メソッドはイベントリスナーもクリーンアップする
            chartInfo.chart.destroy();

            // キャンバス要素のコンテキストをクリア（メモリリーク防止）
            const canvas = chartInfo.container.querySelector("canvas");
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    // コンテキストのクリーンアップ
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            // DOM要素を削除
            if (chartInfo.container && chartInfo.container.parentNode) {
                chartInfo.container.parentNode.removeChild(chartInfo.container);
            }

            // チャート情報を削除
            this.charts.delete(canvasId);
        } catch (error) {
            // エラーが発生してもチャート情報は削除（メモリリーク防止）
            this.charts.delete(canvasId);
            console.error(`グラフ破棄でエラーが発生しました: ${error}`);
        }
    }

    /**
     * すべてのグラフを破棄
     */
    public destroyAllCharts(): void {
        const canvasIds = Array.from(this.charts.keys());
        canvasIds.forEach((canvasId) => {
            this.destroyChart(canvasId);
        });
    }

    /**
     * グラフ情報を取得
     * @param canvasId - キャンバスID
     * @returns グラフ情報、存在しない場合はnull
     */
    public getChartInfo(canvasId: string): ChartInfo | null {
        return this.charts.get(canvasId) || null;
    }

    /**
     * すべてのグラフIDを取得
     * @returns グラフIDの配列
     */
    public getAllChartIds(): string[] {
        return Array.from(this.charts.keys());
    }

    /**
     * グラフが存在するかチェック
     * @param canvasId - キャンバスID
     * @returns 存在するかどうか
     */
    public hasChart(canvasId: string): boolean {
        return this.charts.has(canvasId);
    }

    /**
     * グラフを破棄（後方互換性のため）
     */
    public destroy(): void {
        this.destroyAllCharts();
    }
}
