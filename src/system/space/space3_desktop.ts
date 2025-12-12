import reportSvg from "../../../assets/report.svg?raw";
import { Logger } from "../../utils/Logger";

/**
 * SVG文字列をDOM要素に変換する
 */
function createSvgElement(svgString: string): SVGSVGElement {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;
    return svgElement as unknown as SVGSVGElement;
}

/**
 * アプリ選択メニューを作成
 */
function createAppSelectMenu(root: Element, baseUrl: string): void {
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

/**
 * チュートリアルメニューを作成
 */
function createTutorialMenu(root: Element): void {
    const div = document.createElement("div");
    div.className = "gaia-argoui-widget gaia-argoui-space-spacebodywidget";
    div.style.padding = "10px";
    root.appendChild(div);

    // タイトルを作成
    const title = document.createElement("div");
    title.style.height = "56px";
    title.style.lineHeight = "56px";
    const h3 = document.createElement("h3");
    h3.textContent = "キントーンの使い方";
    h3.className = "gaia-argoui-widget-title";
    h3.style.fontSize = "20px";
    title.appendChild(h3);
    div.appendChild(title);

    // サブタイトル1
    const subTitle = document.createElement("div");
    subTitle.style.height = "40px";
    subTitle.style.lineHeight = "40px";
    const h4 = document.createElement("h4");
    h4.textContent = "1.トップページ";
    h4.className = "gaia-argoui-widget-subtitle";
    h4.style.fontSize = "16px";
    subTitle.appendChild(h4);
    div.appendChild(subTitle);

    // 操作方法の画像を配置
    const img = document.createElement("img");
    img.src =
        "https://2pjcypqjfl8m.cybozu.com/k/api/record/download.do/-/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202025-12-11%20133812.png?app=57&field=13458476&detectType=true&record=1&row=14554&id=5626&hash=a3b6574d6229efedca638d3aa466138332ddc1d9&revision=1&.png&w=1280&h=800&flag=SHRINK";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    div.appendChild(img);

    // 線を引く
    const line = document.createElement("div");
    line.style.width = "100%";
    line.style.height = "1px";
    line.style.marginTop = "10px";
    line.style.marginBottom = "10px";
    line.style.backgroundColor = "#ddd";
    div.appendChild(line);

    // サブタイトル2
    const subTitle2 = document.createElement("div");
    subTitle2.style.height = "40px";
    subTitle2.style.lineHeight = "40px";
    const h42 = document.createElement("h4");
    h42.textContent = "2.レコード閲覧画面";
    h42.className = "gaia-argoui-widget-subtitle";
    h42.style.fontSize = "16px";
    subTitle2.appendChild(h42);
    div.appendChild(subTitle2);

    // 操作方法の画像を配置
    const img2 = document.createElement("img");
    img2.src =
        "https://2pjcypqjfl8m.cybozu.com/k/api/record/download.do/-/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202025-12-11%20133824.png?app=57&field=13458476&detectType=true&record=2&row=14556&id=5627&hash=b4d3296473159830b2b773d821a9837bc3cc241e&revision=1&.png&w=1280&h=800&flag=SHRINK";
    img2.style.width = "100%";
    img2.style.height = "auto";
    img2.style.display = "block";
    div.appendChild(img2);
}

/**
 * spaceIdが3の時のスペースカスタマイズを実行
 */
export function renderSpace3(): void {
    const baseUrl = document.location.origin;
    const root = document.getElementsByClassName("gaia-argoui-page-space-show-left")[0];
    if (!root) {
        Logger.error("スペースエリアが見つかりません");
        return;
    }

    // アプリ選択メニューを作成
    createAppSelectMenu(root, baseUrl);
    // チュートリアルメニューを作成
    createTutorialMenu(root);
}
