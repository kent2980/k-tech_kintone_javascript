import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { RevenueAnalysis } from "../types";
import { PLDashboardTableBuilder } from "./PLDashboardTableBuilder";
import { DateUtil } from "../utils";
export class PLDashboardGraphBuilder {
    private chart: Chart | null = null;

    /**
     * 折れ線と棒グラフの複合グラフを作成したコンテナを作成
     */
    static createMixedChartContainer(
        canvasId: string,
        RevenueAnalysisList: RevenueAnalysis[],
        holidayData: { date?: { value: string }; holiday_type?: { value: string } }[] = []
    ): HTMLDivElement {
        const container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "600px";
        container.style.minHeight = "500px";
        container.style.padding = "20px";
        container.style.boxSizing = "border-box";
        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        container.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const labels = RevenueAnalysisList.map((item) => {
                // YYYY-MM-DD形式をMM/DD\n曜日形式に変換
                const dateObj = new Date(item.date);
                const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}`;
                const dayOfWeek = DateUtil.getDayOfWeek(dateObj);
                return `${monthDay}\n(${dayOfWeek})`;
            });
            const addedValueData = RevenueAnalysisList.map((item) => item.CumulativeAddedValue);
            const expensesData = RevenueAnalysisList.map((item) => item.CumulativeExpenses);
            const profitRateData = RevenueAnalysisList.map((item) =>
                Number(item.CumulativeProfitRate)
            );

            new Chart(ctx, {
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
                            formatter: (value, context) => {
                                // 利益率（折れ線グラフ）の場合は%を付ける
                                if (context.dataset.label === "利益率") {
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
                                color: function (context: any) {
                                    // ラベルのインデックスから対応する日付を取得
                                    const index = context.index;
                                    if (index < RevenueAnalysisList.length) {
                                        const date = RevenueAnalysisList[index].date;
                                        const backgroundColor =
                                            PLDashboardTableBuilder.getDateBackgroundColor(
                                                date,
                                                holidayData
                                            );

                                        // 背景色に応じてテキスト色を調整
                                        if (backgroundColor === "#e6f3ff") return "#0066cc"; // 法定休日: 青色テキスト
                                        if (backgroundColor === "#ffe6e6") return "#cc0000"; // 所定休日: 赤色テキスト
                                        if (backgroundColor === "#fffacd") return "#cc8800"; // 一斉有給: 黄色テキスト
                                        if (backgroundColor === "#f5f5f5") return "#666666"; // 土曜日: グレーテキスト
                                    }
                                    return "#333333"; // 通常日: デフォルト色
                                },
                                font: {
                                    weight: function (context: any) {
                                        // 休日の場合は太字にする
                                        const index = context.index;
                                        if (index < RevenueAnalysisList.length) {
                                            const date = RevenueAnalysisList[index].date;
                                            const backgroundColor =
                                                PLDashboardTableBuilder.getDateBackgroundColor(
                                                    date,
                                                    holidayData
                                                );
                                            return backgroundColor ? "bold" : "normal";
                                        }
                                        return "normal";
                                    },
                                },
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
        }

        // グラフコンテナを返す
        return container;
    }

    /**
     * グラフを破棄
     */
    destroy(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}
