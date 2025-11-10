/// <reference path="../../../../kintone.d.ts" />

import { DomUtil } from "../utils";
import { PLDashboardDomBuilder } from "./PLDashboardDomBuilder";

/**
 * ヘッダーコンテナを作成するクラス
 */
export class HeaderContainer {
    /**
     * フィルターコンテナを作成する
     * @returns フィルターコンテナ
     */
    private static createFilterContainer(): HTMLDivElement {
        const container = document.createElement("div");
        container.style.margin = "10px 0";

        // 年フィルター
        container.appendChild(DomUtil.createLabel("年: ", "year-select"));
        container.appendChild(PLDashboardDomBuilder.createYearSelect(10));

        // 月フィルター
        container.appendChild(DomUtil.createLabel("月: ", "month-select", "20px"));
        container.appendChild(PLDashboardDomBuilder.createMonthSelect());

        return container;
    }

    /**
     * 設定リンクを作成する
     * @returns 設定リンク
     */
    private static createSettingsLink(): HTMLAnchorElement {
        const thisAppId = kintone.app.getId();
        const settingsHref = `https://d5wpzdj4iuwp.cybozu.com/k/admin/app/flow?app=${thisAppId}#section=form`;
        const settingsLink = document.createElement("a");
        settingsLink.textContent = "⚙️ 設定";
        settingsLink.href = settingsHref;
        settingsLink.target = "_blank";
        settingsLink.style.cursor = "pointer";
        settingsLink.style.whiteSpace = "nowrap"; // 折り返しを防止
        return settingsLink;
    }

    /**
     * ヘッダーコンテナを作成する（フィルターと設定リンクを横並びに配置）
     * @returns ヘッダーコンテナ
     */
    static create(): HTMLDivElement {
        const headerContainer = document.createElement("div");
        headerContainer.style.display = "flex";
        headerContainer.style.justifyContent = "space-between";
        headerContainer.style.alignItems = "center";
        headerContainer.style.marginTop = "10px";
        headerContainer.style.marginLeft = "20px";
        headerContainer.style.marginRight = "20px";
        headerContainer.style.gap = "20px";

        // フィルターコンテナを作成
        const filterContainer = this.createFilterContainer();
        filterContainer.style.margin = "0"; // 既存のmarginをリセット
        headerContainer.appendChild(filterContainer);

        // 設定リンクを作成
        const settingsLink = this.createSettingsLink();
        headerContainer.appendChild(settingsLink);

        return headerContainer;
    }
}
