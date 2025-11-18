import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { ScriptableScaleContext } from "chart.js";

import { HolidayStore } from "../../store";
import { RevenueAnalysis } from "../../types";
import { DateUtil, Logger } from "../../utils";
import { BaseGraphManager } from "./BaseGraphManager";

/**
 * PLダッシュボード用のグラフ管理クラス
 * BaseGraphManagerを継承し、PL管理に特化したグラフ機能を提供
 */
export class PLDashboardGraphBuilder extends BaseGraphManager {
    /**
     * コンストラクタ
     */
    constructor() {
        super();
    }

    /**
     * 日付に応じた背景色を取得する
     * @param date - 日付文字列（YYYY-MM-DD形式）
     * @param holidayData - 会社休日マスタデータ
     * @returns 背景色の文字列、通常日の場合は空文字
     */
    private getDateBackgroundColor(
        date: string,
        holidayData: { date?: { value: string }; holiday_type?: { value: string } }[] = []
    ): string {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        // 会社休日マスタの日付と一致する場合はholiday_typeに応じた背景色を設定
        const holidayRecord = holidayData.find((holiday) => holiday.date?.value === date);
        if (holidayRecord) {
            const holidayType = holidayRecord.holiday_type?.value;
            switch (holidayType) {
                case "法定休日":
                    return "#e6f3ff"; // 薄い青
                case "所定休日":
                    return "#ffe6e6"; // 薄い赤
                case "一斉有給":
                    return "#fffacd"; // 薄い黄色
                default:
                    return "#ffe6e6"; // デフォルトは薄い赤
            }
        }

        // 通常日は背景色なし
        return "";
    }

    /**
     * 折れ線と棒グラフの複合グラフを作成したコンテナを作成
     * @param canvasId - キャンバスID
     * @param RevenueAnalysisList - 収益分析データ
     * @returns グラフコンテナ要素
     */
    public createMixedChartContainer(
        canvasId: string,
        RevenueAnalysisList: RevenueAnalysis[]
    ): HTMLDivElement {
        // 既存のグラフがあれば破棄
        if (this.hasChart(canvasId)) {
            this.destroyChart(canvasId);
        }

        // グラフコンテナを作成
        const { container, canvas } = this.createChartContainer(canvasId);
        const ctx = canvas.getContext("2d");

        // 祝日データを取得
        const holidayStore = HolidayStore.getInstance();
        const holidayData = holidayStore.getHolidayData();

        // thisの参照を保持
        const self = this;

        if (ctx) {
            const labels = RevenueAnalysisList.map((item) => {
                // YYYY-MM-DD形式を配列で改行表示（MM/DD と (曜日) を別々の行に）
                const dateObj = new Date(item.date);
                const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}`;
                const dayOfWeek = `(${DateUtil.getDayOfWeek(dateObj)})`;
                return [monthDay, dayOfWeek];
            });
            const addedValueData = RevenueAnalysisList.map((item) => item.CumulativeAddedValue);
            const expensesData = RevenueAnalysisList.map((item) => item.CumulativeExpenses);
            const profitRateData = RevenueAnalysisList.map((item) =>
                Number(item.CumulativeProfitRate)
            );

            const chart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            type: "bar",
                            label: "付加価値",
                            data: addedValueData,
                            backgroundColor: "rgba(75, 192, 192, 0.6)",
                            yAxisID: "y-axis-1",
                        },
                        {
                            type: "bar",
                            label: "経費",
                            data: expensesData,
                            backgroundColor: "rgba(255, 99, 132, 0.6)",
                            yAxisID: "y-axis-1",
                        },
                        {
                            type: "line",
                            label: "利益率",
                            data: profitRateData,
                            borderColor: "rgba(255, 206, 86, 1)",
                            backgroundColor: "rgba(255, 206, 86, 0.6)",
                            yAxisID: "y-axis-2",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            right: 30,
                            bottom: 20,
                            left: 10,
                        },
                    },
                    plugins: {
                        datalabels: {
                            display: true,
                            color: "#000",
                            font: {
                                weight: "normal",
                                size: 10,
                            },
                            formatter: (
                                value: number,
                                context: { dataset?: { label?: string } }
                            ): string => {
                                // 利益率（折れ線グラフ）の場合は%を付ける
                                if (context.dataset?.label === "利益率") {
                                    return value.toFixed(1) + "%";
                                }
                                // 金額の場合は桁区切りで表示
                                return value.toLocaleString();
                            },
                            anchor: "end",
                            align: "top",
                        },
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxRotation: 0,
                                minRotation: 0,
                                maxTicksLimit: undefined,
                                color: function (context: ScriptableScaleContext): string {
                                    // ラベルのインデックスから対応する日付を取得
                                    const index = context.index;
                                    if (index < RevenueAnalysisList.length) {
                                        const date = RevenueAnalysisList[index].date;
                                        const backgroundColor = self.getDateBackgroundColor(
                                            date,
                                            holidayData
                                        );

                                        // 背景色に応じてテキスト色を調整
                                        if (backgroundColor === "#e6f3ff") return "#0066cc"; // 法定休日: 青色テキスト
                                        if (backgroundColor === "#ffe6e6") return "#cc0000"; // 所定休日: 赤色テキスト
                                        if (backgroundColor === "#fffacd") return "#cc8800"; // 一斉有給: 黄色テキスト
                                    }
                                    return "#333333"; // 通常日: デフォルト色
                                },
                                font: {
                                    weight: function (
                                        context: ScriptableScaleContext
                                    ): "normal" | "bold" | "bolder" | "lighter" | number {
                                        // 休日の場合は太字にする
                                        const index = context.index;
                                        if (index < RevenueAnalysisList.length) {
                                            const date = RevenueAnalysisList[index].date;
                                            const backgroundColor = self.getDateBackgroundColor(
                                                date,
                                                holidayData
                                            );
                                            return backgroundColor ? "bold" : "normal";
                                        }
                                        return "normal";
                                    },
                                },
                            },
                            grid: {
                                display: true,
                            },
                            border: {
                                display: true,
                            },
                        },
                        "y-axis-1": {
                            type: "linear",
                            position: "left",
                            max: 120000,
                            title: {
                                display: true,
                                text: "金額",
                            },
                        },
                        "y-axis-2": {
                            type: "linear",
                            position: "right",
                            max: 80,
                            title: {
                                display: true,
                                text: "利益率 (%)",
                            },
                            ticks: {
                                callback: function (value) {
                                    return value + "%";
                                },
                            },
                        },
                    },
                },
                plugins: [ChartDataLabels],
            });

            // グラフ情報を登録
            this.registerChart(canvasId, chart, container);
        }

        // グラフコンテナを返す
        return container;
    }

    /**
     * 既存のチャートを更新（データのみ）
     * @param canvasId - キャンバスID
     * @param RevenueAnalysisList - 収益分析データ
     */
    public updateMixedChart(canvasId: string, RevenueAnalysisList: RevenueAnalysis[]): void {
        const chartInfo = this.getChartInfo(canvasId);
        if (!chartInfo) {
            // チャートが存在しない場合は新規作成
            Logger.debug(`チャート ${canvasId} が存在しないため、新規作成します`);
            return;
        }

        const chart = chartInfo.chart;

        // チャートが破棄されている場合は再作成
        if (!chart || chart.ctx === null) {
            Logger.debug(`チャート ${canvasId} が破棄されているため、再作成します`);
            this.destroyChart(canvasId);
            return;
        }

        const labels = RevenueAnalysisList.map((item) => {
            const dateObj = new Date(item.date);
            const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(
                dateObj.getDate()
            ).padStart(2, "0")}`;
            const dayOfWeek = `(${DateUtil.getDayOfWeek(dateObj)})`;
            return [monthDay, dayOfWeek];
        });

        const addedValueData = RevenueAnalysisList.map((item) => item.CumulativeAddedValue);
        const expensesData = RevenueAnalysisList.map((item) => item.CumulativeExpenses);
        const profitRateData = RevenueAnalysisList.map((item) => Number(item.CumulativeProfitRate));

        // Chart.jsの型定義に合わせて型アサーションを使用
        // labelsは string[][] または string[] の形式
        type ChartDataLabels = (string | string[])[];
        type ChartDataDataset = { data?: number[] };
        type ChartData = { labels?: ChartDataLabels; datasets?: ChartDataDataset[] };
        (chart.data as ChartData).labels = labels;
        if (chart.data.datasets && chart.data.datasets.length >= 3) {
            // datasets[0]は累積付加価値（数値配列）
            if (chart.data.datasets[0]) {
                (chart.data.datasets[0] as ChartDataDataset).data = addedValueData;
            }
            // datasets[1]は累積経費（数値配列）
            if (chart.data.datasets[1]) {
                (chart.data.datasets[1] as ChartDataDataset).data = expensesData;
            }
            // datasets[2]は累積利益率（数値配列）
            if (chart.data.datasets[2]) {
                (chart.data.datasets[2] as ChartDataDataset).data = profitRateData;
            }
        }

        chart.update();

        // 更新日時を更新
        chartInfo.updatedAt = new Date();
    }
}
