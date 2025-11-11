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
        container.className = "header-filter-container";

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
        settingsLink.className = "header-settings-link";
        return settingsLink;
    }

    /**
     * ヘッダーコンテナを作成する（フィルターと設定リンクを横並びに配置）
     * @returns ヘッダーコンテナ
     */
    static create(): HTMLDivElement {
        const headerContainer = document.createElement("div");
        headerContainer.className = "header-container";

        // フィルターコンテナを作成
        const filterContainer = this.createFilterContainer();
        headerContainer.appendChild(filterContainer);

        // 設定リンクを作成
        const settingsLink = this.createSettingsLink();
        headerContainer.appendChild(settingsLink);

        return headerContainer;
    }
}
