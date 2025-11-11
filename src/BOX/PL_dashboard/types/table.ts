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
