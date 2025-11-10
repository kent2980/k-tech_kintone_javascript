import Chart from "chart.js/auto";

export class PLDashboardGraphBuilder {
    private chart: Chart | null = null;

    /**
     * 折れ線と棒グラフの複合グラフを作成したコンテナを作成
     */
    static createMixedChartContainer(canvasId: string): HTMLDivElement {
        const container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "400px";
        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        container.appendChild(canvas);

        // サンプルデータ
        const sampleData = {
            labels: ["January", "February", "March", "April", "May"],
            lineDataset: {
                label: "Line Dataset",
                data: [65, 59, 80, 81, 56],
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
            },
            barDataset: {
                label: "Bar Dataset",
                data: [28, 48, 40, 19, 86],
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                borderColor: "rgb(54, 162, 235)",
            },
        };
        const ctx = canvas.getContext("2d");
        if (ctx) {
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: sampleData.labels,
                    datasets: [
                        {
                            ...sampleData.barDataset,
                            type: "bar",
                        },
                        {
                            ...sampleData.lineDataset,
                            type: "line",
                            fill: false,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
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
