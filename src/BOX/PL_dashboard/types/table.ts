import { DataTablesOptions } from "./dataTables";

/**
 * テーブル関連の型定義
 */

export type TableCellValue = string | number | null;
export type TableRowData = TableCellValue[];
export type TableData = TableRowData[];

export interface TableOptions {
    stickyHeader?: boolean;
    className?: string;
    bodyClassName?: string;
}

/**
 * テーブルビルダーの設定オプション
 */
export interface TableBuilderConfig {
    /** 固定ヘッダーを有効にするか */
    stickyHeader: boolean;

    /** DataTables機能を有効にするか */
    enableDataTables: boolean;

    /** 休日の色分けを有効にするか */
    holidayColoring: boolean;

    /** DataTablesのカスタムオプション */
    dataTablesOptions?: Partial<DataTablesOptions>;

    /** テーブルのカスタムクラス名 */
    className?: string;

    /** テーブルボディのカスタムクラス名 */
    bodyClassName?: string;

    /** ページサイズ（DataTables使用時） */
    pageLength?: number;

    /** ソート設定 */
    defaultSort?: {
        columnIndex: number;
        direction: "asc" | "desc";
    };
}
