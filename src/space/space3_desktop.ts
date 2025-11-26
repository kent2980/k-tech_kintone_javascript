import reportSvg from "../../assets/report.svg?raw";

(function (): void {
    "use strict";

    const baseUrl = document.location.origin;

    /**
     * SVG文字列をDOM要素に変換する
     */
    function createSvgElement(svgString: string): SVGSVGElement {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = svgDoc.documentElement;
        return svgElement as unknown as SVGSVGElement;
    }

    kintone.events.on("space.portal.show", function (event) {
        const spaceId = event.spaceId;

        if (spaceId === "3") {
            const root = document.getElementsByClassName("gaia-argoui-page-space-show-left")[0];
            // divを作成
            const div = document.createElement("div");
            div.className = "gaia-argoui-widget gaia-argoui-space-spacebodywidget";
            div.style.padding = "10px";
            root.prepend(div);

            // タイトルを作成
            const title = document.createElement("div");
            title.style.height = "56px";
            title.style.lineHeight = "56px";
            const h3 = document.createElement("h3");
            h3.textContent = "データ入力";
            h3.className = "gaia-argoui-widget-title";
            h3.style.fontSize = "20px";
            title.appendChild(h3);
            div.appendChild(title);

            // カラム名の定義
            const columns = [
                { key: "item", label: "アプリ名" },
                { key: "description", label: "説明" },
                { key: "charge", label: "担当者" },
                { key: "frequency", label: "更新頻度" },
            ];

            // リストの項目と説明文を作成
            const listItems = [
                {
                    item: "生産日報",
                    description: "日々の生産状況を入力します。",
                    svg: reportSvg,
                    charge: "ラインリーダー",
                    link: `${baseUrl}/k/40/edit`,
                    frequency: "毎日",
                },
            ];

            // テーブルを作成
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.marginTop = "10px";

            // テーブルヘッダーを作成
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            headerRow.style.backgroundColor = "#f5f5f5";
            headerRow.style.borderBottom = "2px solid #ddd";

            columns.forEach((column) => {
                const th = document.createElement("th");
                th.textContent = column.label;
                th.style.padding = "8px";
                th.style.textAlign = "left";
                th.style.border = "1px solid #ddd";
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // テーブルボディを作成
            const tbody = document.createElement("tbody");
            listItems.forEach((item) => {
                const row = document.createElement("tr");
                row.style.cursor = "pointer";
                row.addEventListener("click", () => {
                    window.location.href = item.link;
                });
                row.addEventListener("mouseenter", () => {
                    row.style.backgroundColor = "#f0f0f0";
                });
                row.addEventListener("mouseleave", () => {
                    row.style.backgroundColor = "";
                });

                // 各カラムのセルを作成
                columns.forEach((column) => {
                    const td = document.createElement("td");
                    td.style.padding = "8px";
                    td.style.border = "1px solid #ddd";

                    if (column.key === "item") {
                        // アイコンと項目名を同じセルに配置
                        td.style.display = "flex";
                        td.style.alignItems = "center";
                        td.style.gap = "10px";
                        // SVG要素を作成
                        const svgElement = createSvgElement(item.svg);
                        svgElement.setAttribute("width", "40");
                        svgElement.setAttribute("height", "40");
                        td.appendChild(svgElement);
                        // 項目名を追加
                        const itemName = document.createElement("span");
                        itemName.textContent = item.item;
                        td.appendChild(itemName);
                    } else {
                        // テキストコンテンツを設定
                        const value = item[column.key as keyof typeof item];
                        if (typeof value === "string") {
                            td.textContent = value;
                        }
                    }

                    row.appendChild(td);
                });

                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            div.appendChild(table);
        }

        return event;
    });
})();
