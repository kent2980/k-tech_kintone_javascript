/// <reference path="../../../../../kintone.d.ts" />
/// <reference path="../../../../../globals.d.ts" />

import { DataTablesApi, DataTablesOptions, TableBuilderConfig, TableRowData } from "../../types";
import { Logger } from "../../utils";

// jQueryを最初にインポート（DataTablesが依存するため）
import $ from "jquery";

// jQueryをグローバルに設定
(window as unknown as { $: typeof $; jQuery: typeof $ }).$ = $;
(window as unknown as { $: typeof $; jQuery: typeof $ }).jQuery = $;

// DataTables関連のimport（jQueryの後に）
import "datatables.net";
import "datatables.net-buttons";
import "datatables.net-buttons-dt";
import "datatables.net-dt/css/dataTables.dataTables.min.css";

// ボタン機能に必要な追加ライブラリ
import "datatables.net-buttons/js/buttons.html5.min.js";
import "datatables.net-buttons/js/buttons.print.min.js";

/**
 * テーブル情報を管理するインターフェース
 */
export interface TableInfo {
    /** テーブルID */
    tableId: string;
    /** テーブル要素 */
    tableElement: HTMLTableElement | null;
    /** コンテナ要素 */
    containerElement: HTMLDivElement | null;
    /** DataTables APIインスタンス */
    dataTableInstance: DataTablesApi | null;
    /** テーブルの設定 */
    config: TableBuilderConfig;
    /** テーブルのデータ */
    data: TableRowData[];
    /** テーブルのカラム */
    columns: string[];
    /** テーブルの種類 */
    tableType: string;
    /** 作成日時 */
    createdAt: Date;
    /** 最終更新日時 */
    updatedAt: Date;
}

/**
 * テーブル管理の基底クラス
 * 汎用的なテーブル作成・管理機能を提供
 */
export abstract class BaseTableManager {
    /** 管理されているテーブルのマップ */
    protected tables: Map<string, TableInfo> = new Map();

    /** デフォルト設定 */
    protected defaultConfig: TableBuilderConfig = {
        stickyHeader: true,
        enableDataTables: true,
        holidayColoring: true,
    };

    /**
     * コンストラクタ
     * @param defaultConfig - デフォルト設定（オプション）
     */
    constructor(defaultConfig?: Partial<TableBuilderConfig>) {
        if (defaultConfig) {
            this.defaultConfig = { ...this.defaultConfig, ...defaultConfig };
        }
    }

    /**
     * テーブル要素を作成
     * @param id - テーブルのID
     * @param className - テーブルのクラス名
     * @returns テーブル要素
     */
    protected createTable(
        id: string,
        className: string = "recordlist-gaia recordlist-consistent-column-width-gaia"
    ): HTMLTableElement {
        const table = document.createElement("table");
        table.id = id;
        table.className = `pl-table-base ${className}`;
        return table;
    }

    /**
     * 固定ヘッダーを持つテーブルヘッダーを作成
     * @param columns - カラム名の配列
     * @returns テーブルヘッダー要素
     */
    protected createStickyTableHeader(columns: string[]): HTMLTableSectionElement {
        const thead = document.createElement("thead");
        thead.className = "pl-table-thead-sticky";

        const headerRow = document.createElement("tr");
        columns.forEach((column) => {
            const th = document.createElement("th");
            th.textContent = column;
            th.className =
                "pl-table-th-standard sorting recordlist-header-cell-gaia label-13458061 recordlist-header-sortable-gaia";
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        return thead;
    }

    /**
     * テーブルボディを作成
     * @param className - ボディのクラス名
     * @returns テーブルボディ要素
     */
    protected createTableBody(className: string = "recordlist-body-gaia"): HTMLTableSectionElement {
        const tbody = document.createElement("tbody");
        tbody.className = className;
        return tbody;
    }

    /**
     * テーブルセルを作成
     * @param content - セルの内容
     * @param isNumeric - 数値セルかどうか（右寄せにする）
     * @returns テーブルセル要素
     */
    protected createTableCell(
        content: string | number,
        isNumeric: boolean = false
    ): HTMLTableCellElement {
        const td = document.createElement("td");
        td.textContent = String(content);
        td.className = isNumeric
            ? "pl-table-td-numeric recordlist-cell-gaia"
            : "pl-table-td-standard recordlist-cell-gaia";
        return td;
    }

    /**
     * テーブル行を作成
     * @param cells - セルの配列
     * @param className - 行のクラス名
     * @returns テーブル行要素
     */
    protected createTableRow(
        cells: HTMLTableCellElement[],
        className?: string
    ): HTMLTableRowElement {
        const row = document.createElement("tr");
        if (className) {
            row.className = className;
        }

        cells.forEach((cell) => {
            row.appendChild(cell);
        });

        return row;
    }

    /**
     * 数値をフォーマットして表示用文字列に変換
     * @param value - 数値
     * @param decimals - 小数点以下の桁数（デフォルト: 0）
     * @returns フォーマットされた文字列
     */
    protected formatNumber(value: number, decimals: number = 0): string {
        if (isNaN(value)) return "0";
        return value.toLocaleString("ja-JP", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    /**
     * パーセンテージをフォーマット
     * @param value - パーセンテージ値（0-100）
     * @returns フォーマットされた文字列
     */
    protected formatPercentage(value: number): string {
        if (isNaN(value)) return "0%";
        return `${value.toFixed(1)}%`;
    }

    /**
     * テーブル情報を登録
     * @param tableId - テーブルID
     * @param tableType - テーブルの種類
     * @param config - 設定
     * @param columns - カラム
     */
    protected registerTable(
        tableId: string,
        tableType: string,
        config: Partial<TableBuilderConfig>,
        columns: string[]
    ): void {
        const tableInfo: TableInfo = {
            tableId,
            tableElement: null,
            containerElement: null,
            dataTableInstance: null,
            config: { ...this.defaultConfig, ...config },
            data: [],
            columns,
            tableType,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.tables.set(tableId, tableInfo);
        Logger.debug(`テーブル ${tableId} を登録しました`);
    }

    /**
     * テーブル情報を取得
     * @param tableId - テーブルID
     * @returns テーブル情報、存在しない場合はnull
     */
    public getTableInfo(tableId: string): TableInfo | null {
        return this.tables.get(tableId) || null;
    }

    /**
     * すべてのテーブルIDを取得
     * @returns テーブルIDの配列
     */
    public getAllTableIds(): string[] {
        return Array.from(this.tables.keys());
    }

    /**
     * テーブルが存在するかチェック
     * @param tableId - テーブルID
     * @returns 存在するかどうか
     */
    public hasTable(tableId: string): boolean {
        return this.tables.has(tableId);
    }

    /**
     * テーブルにDataTables機能を適用
     * @param tableId - テーブルのID
     * @param options - DataTablesのオプション
     * @returns DataTables APIインスタンス（利用可能な場合）
     */
    protected enhanceTableWithDataTables(
        tableId: string,
        options: Partial<DataTablesOptions> = {}
    ): DataTablesApi | null {
        try {
            // DataTablesが利用可能かチェック
            if (!this.isDataTablesAvailable()) {
                return null;
            }

            // デフォルトオプション
            const defaultOptions: DataTablesOptions = {
                paging: true,
                pageLength: 50,
                searching: true,
                ordering: true,
                info: true,
                responsive: true,
                scrollX: false,
                fixedHeader: false,
                language: {
                    url: "//cdn.datatables.net/plug-ins/1.13.7/i18n/ja.json",
                },
                lengthMenu: [
                    [25, 50, 100, -1],
                    [25, 50, 100, "全て"],
                ],
                dom: '<"dt-top-controls"<"dt-length"l><"dt-buttons"B><"dt-search"f>>rtip',
                buttons: [
                    {
                        extend: "csv",
                        text: "CSV出力",
                        className: "btn btn-secondary",
                        charset: "utf-8",
                        bom: true,
                        filename: function () {
                            const date = new Date();
                            const dateStr = date.toISOString().split("T")[0];
                            return `テーブル_${dateStr}`;
                        },
                    },
                    {
                        extend: "print",
                        text: "印刷",
                        className: "btn btn-secondary",
                    },
                ],
                columnDefs: [
                    // 数値列の右寄せ設定
                    {
                        targets: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], // 数値列のインデックス
                        className: "dt-right",
                    },
                ],
            };

            // オプションをマージして、initCompleteコールバックを追加
            const finalOptions = {
                ...defaultOptions,
                ...options,
                // initCompleteコールバックでDataTables初期化完了後にカスタム処理を実行
                initComplete: (settings: any, json: any) => {
                    // カスタムスタイルを適用
                    this.applyCustomTableStyles(tableId);

                    // サブクラスで実装される追加処理を呼び出す
                    this.onDataTableInitialized(tableId);
                },
            };

            // DataTablesを適用
            const dataTable = $(`#${tableId}`).DataTable(finalOptions);

            // テーブル情報を更新
            const tableInfo = this.tables.get(tableId);
            if (tableInfo) {
                tableInfo.dataTableInstance = dataTable;
                tableInfo.updatedAt = new Date();
            }

            Logger.debug(`DataTables が ${tableId} に適用されました`);
            return dataTable;
        } catch (error) {
            Logger.debug(`DataTables の適用でエラーが発生しました: ${error}`);
            return null;
        }
    }

    /**
     * DataTables初期化完了時のコールバック（サブクラスでオーバーライド可能）
     * @param tableId - テーブルID
     */
    protected onDataTableInitialized(tableId: string): void {
        // サブクラスで実装
    }

    /**
     * DataTablesの破棄
     * @param tableId - テーブルのID
     */
    public destroyTable(tableId: string): void {
        const tableInfo = this.tables.get(tableId);
        if (!tableInfo) {
            Logger.debug(`テーブル ${tableId} は存在しません`);
            return;
        }

        try {
            // DataTablesインスタンスを破棄
            if (tableInfo.dataTableInstance && this.isDataTablesAvailable()) {
                const table = $(`#${tableId}`);
                if (table.length && $.fn.DataTable.isDataTable(table)) {
                    table.DataTable().destroy();
                    Logger.debug(`DataTable ${tableId} を破棄しました`);
                }
            }

            // DOM要素を削除
            if (tableInfo.containerElement && tableInfo.containerElement.parentNode) {
                tableInfo.containerElement.parentNode.removeChild(tableInfo.containerElement);
            }

            // テーブル情報を削除
            this.tables.delete(tableId);
            Logger.debug(`テーブル ${tableId} を削除しました`);
        } catch (error) {
            Logger.debug(`DataTable破棄でエラーが発生しました: ${error}`);
        }
    }

    /**
     * すべてのテーブルを破棄
     */
    public destroyAllTables(): void {
        const tableIds = Array.from(this.tables.keys());
        tableIds.forEach((tableId) => {
            this.destroyTable(tableId);
        });
        Logger.debug("すべてのテーブルを破棄しました");
    }

    /**
     * テーブルデータの動的更新
     * @param tableId - テーブルのID
     * @param newData - 新しいデータ
     */
    public updateTableData(tableId: string, newData: unknown[]): void {
        const tableInfo = this.tables.get(tableId);
        if (!tableInfo) {
            Logger.debug(`テーブル ${tableId} は存在しません`);
            return;
        }

        try {
            if (this.isDataTablesAvailable() && tableInfo.dataTableInstance) {
                const table = $(`#${tableId}`);
                if (table.length && $.fn.DataTable.isDataTable(table)) {
                    const dataTable = table.DataTable();
                    dataTable.clear();
                    dataTable.rows.add(newData);
                    dataTable.draw();

                    // テーブル情報を更新
                    tableInfo.data = newData as TableRowData[];
                    tableInfo.updatedAt = new Date();

                    Logger.debug(`テーブル ${tableId} のデータを更新しました`);
                }
            } else {
                // DataTablesが使用できない場合は、直接DOMを更新
                if (tableInfo.tableElement) {
                    const tbody = tableInfo.tableElement.querySelector("tbody");
                    if (tbody) {
                        tbody.innerHTML = "";
                        newData.forEach((row: any) => {
                            const tr = document.createElement("tr");
                            tr.className =
                                "recordlist-row-gaia recordlist-row-gaia-hover-highlight";
                            if (Array.isArray(row)) {
                                row.forEach((cell: any) => {
                                    const td = this.createTableCell(cell);
                                    tr.appendChild(td);
                                });
                            }
                            tbody.appendChild(tr);
                        });

                        // テーブル情報を更新
                        tableInfo.data = newData as TableRowData[];
                        tableInfo.updatedAt = new Date();
                    }
                }
            }
        } catch (error) {
            Logger.debug(`テーブルデータ更新でエラーが発生しました: ${error}`);
        }
    }

    /**
     * DataTablesライブラリの利用可能チェック
     * @returns boolean - 利用可能かどうか
     */
    protected isDataTablesAvailable(): boolean {
        try {
            // jQueryとDataTablesの確認
            if (typeof $ === "undefined") {
                Logger.debug("jQuery が利用できません");
                return false;
            }

            if (!$.fn || !$.fn.DataTable) {
                Logger.debug("DataTables が利用できません");
                return false;
            }

            Logger.debug("DataTables は利用可能です");
            return true;
        } catch (error) {
            Logger.debug(`DataTables 利用可能チェックでエラー: ${error}`);
            return false;
        }
    }

    /**
     * カスタムテーブルスタイルを適用
     * DataTablesのテーブルラッパーに必要なCSSクラスを追加
     * @param tableId - テーブルのID
     */
    protected applyCustomTableStyles(tableId: string): void {
        try {
            // DataTablesのwrapperにカスタムクラスを追加
            const wrapper = document.querySelector(`#${tableId}_wrapper`);
            if (wrapper) {
                wrapper.classList.add("dataTables_wrapper");
                Logger.debug(`カスタムスタイルクラスが ${tableId}_wrapper に適用されました`);
            } else {
                Logger.debug(`${tableId}_wrapper が見つからないため、スタイル適用をスキップします`);
            }
        } catch (error) {
            Logger.debug(`カスタムスタイル適用でエラーが発生しました: ${error}`);
        }
    }

    /**
     * 色分けラベルを作成する
     * @returns 色分けラベルのHTML要素
     */
    protected createColorLegend(): HTMLDivElement {
        const legend = document.createElement("div");
        legend.className = "color-legend";

        // 各色分けアイテムを作成（サブクラスでオーバーライド可能）
        const legendItems = this.getColorLegendItems();

        legendItems.forEach((item) => {
            const legendItem = document.createElement("div");
            legendItem.className = "color-legend-item";

            const colorBox = document.createElement("div");
            colorBox.className = `color-legend-box ${item.className}`;

            const label = document.createElement("span");
            label.textContent = item.label;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
        });

        return legend;
    }

    /**
     * 色分けラベルのアイテムを取得（サブクラスでオーバーライド可能）
     * @returns 色分けアイテムの配列
     */
    protected getColorLegendItems(): Array<{ className: string; label: string }> {
        return [
            { className: "legal-holiday", label: "法定休日" },
            { className: "company-holiday", label: "所定休日" },
            { className: "collective-leave", label: "一斉有給" },
        ];
    }

    /**
     * DataTablesの検索バーの右に色分けラベルを追加する
     * @param tableId - テーブルのID
     */
    protected addColorLegendToDataTable(tableId: string): void {
        try {
            // DataTablesのdt-top-controlsクラスを持つ要素を探す（優先順位順）
            let targetElement = null;

            // 優先1: dt-top-controls要素を直接探す
            const dtTopControls = document.querySelector(`#${tableId}_wrapper .dt-top-controls`);
            if (dtTopControls) {
                targetElement = dtTopControls;
            } else {
                // 優先2: DataTablesのwrapper内でdt-top-controlsを探す
                const wrapperElement = document.querySelector(`#${tableId}_wrapper`);
                if (wrapperElement) {
                    // dt-top-controlsクラスの要素を探すか、なければ作成
                    let topControls = wrapperElement.querySelector(".dt-top-controls");
                    if (!topControls) {
                        // dt-top-controlsが見つからない場合は作成
                        topControls = document.createElement("div");
                        topControls.className = "dt-top-controls";
                        // wrapper内の最初の子要素の前に挿入
                        const firstChild = wrapperElement.firstElementChild;
                        if (firstChild) {
                            wrapperElement.insertBefore(topControls, firstChild);
                        } else {
                            wrapperElement.appendChild(topControls);
                        }
                    }
                    targetElement = topControls;
                } else {
                    // 優先3: DataTablesのfilter要素
                    const filterElement = document.querySelector(`#${tableId}_filter`);
                    if (filterElement) {
                        targetElement = filterElement;
                    }
                }
            }

            if (targetElement) {
                // 既存の凡例があれば削除
                const existingLegend =
                    targetElement.querySelector(".color-legend") ||
                    document.querySelector(`.color-legend[data-table="${tableId}"]`);
                if (existingLegend) {
                    existingLegend.remove();
                }

                // 新しい色分けラベルを作成
                const colorLegend = this.createColorLegend();
                colorLegend.setAttribute("data-table", tableId);
                colorLegend.className = "color-legend";

                // dt-top-controlsに追加
                targetElement.appendChild(colorLegend);

                Logger.debug(`色分けラベルが ${tableId} に追加されました`);
            } else {
                Logger.debug(`${tableId} に適切な追加先が見つかりませんでした`);
            }
        } catch (error) {
            console.error(`色分けラベル追加でエラーが発生しました:`, error);
            Logger.debug(`色分けラベル追加でエラーが発生しました: ${error}`);
        }
    }

    /**
     * テーブルのDataTableインスタンスを取得
     * @param tableId - テーブルID
     * @returns DataTableインスタンス、存在しない場合はnull
     */
    public getDataTableInstance(tableId: string): DataTablesApi | null {
        const tableInfo = this.tables.get(tableId);
        return tableInfo?.dataTableInstance || null;
    }

    /**
     * テーブルのデータを取得
     * @param tableId - テーブルID
     * @returns テーブルデータ、存在しない場合はnull
     */
    public getTableData(tableId: string): TableRowData[] | null {
        const tableInfo = this.tables.get(tableId);
        return tableInfo?.data || null;
    }

    /**
     * テーブルの設定を更新
     * @param tableId - テーブルID
     * @param config - 新しい設定
     */
    public updateTableConfig(tableId: string, config: Partial<TableBuilderConfig>): void {
        const tableInfo = this.tables.get(tableId);
        if (tableInfo) {
            tableInfo.config = { ...tableInfo.config, ...config };
            tableInfo.updatedAt = new Date();
            Logger.debug(`テーブル ${tableId} の設定を更新しました`);
        } else {
            Logger.debug(`テーブル ${tableId} は存在しません`);
        }
    }
}
