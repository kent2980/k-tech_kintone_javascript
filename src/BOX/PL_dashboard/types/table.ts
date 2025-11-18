import { DataTablesOptions } from "./dataTables";

/**
 * テーブル関連の型定義
 */

/**
 * テーブルセルの値
 *
 * @category Types
 */
export type TableCellValue = string | number | null;

/**
 * テーブル行データ
 *
 * @category Types
 */
export type TableRowData = TableCellValue[];

/**
 * テーブルデータ
 *
 * @category Types
 */
export type TableData = TableRowData[];

export interface TableOptions {
    stickyHeader?: boolean;
    className?: string;
    bodyClassName?: string;
}

/**
 * テーブルビルダーの設定オプション
 *
 * @category Types
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
