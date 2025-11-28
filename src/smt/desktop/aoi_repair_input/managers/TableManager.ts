/**
 * テーブル管理クラス
 * kintoneのテーブルフィールドの作成・更新を担当
 */

import { FIELD_CODES } from "../types";

/**
 * テーブル行のデータ型
 */
export interface TableRowData {
    [fieldCode: string]: {
        value: string | number | null;
    };
}

/**
 * テーブル管理クラス
 * kintoneのテーブルフィールドの操作を一元管理
 */
export class TableManager {
    /** テーブルフィールドコード */
    private readonly fieldCode: string;

    /**
     * コンストラクタ
     * @param fieldCode - テーブルフィールドコード（デフォルト: RelatedRecords）
     */
    constructor(fieldCode: string = FIELD_CODES.RELATED_RECORDS) {
        this.fieldCode = fieldCode;
    }

    /**
     * 現在のレコードからテーブルフィールドを取得
     * @param record - kintoneレコードオブジェクト（省略時は現在のレコード）
     * @returns テーブルフィールドの値（行の配列）
     */
    getTable(record?: any): Array<{
        id: string;
        value: TableRowData;
    }> {
        const targetRecord = record || kintone.app.record.get();
        const tableField = targetRecord[this.fieldCode] as any;

        if (!tableField || !tableField.value) {
            return [];
        }

        return tableField.value;
    }

    /**
     * テーブルフィールドを設定
     * @param rows - テーブル行のデータ配列
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     */
    setTable(
        rows: Array<{
            id?: string;
            value: TableRowData;
        }>,
        record?: any
    ): void {
        const targetRecord = record || kintone.app.record.get();

        // テーブル行をkintone形式に変換
        const tableRows = rows.map((row) => {
            const rowData: { id?: string; value: TableRowData } = {
                value: row.value,
            };

            // idが指定されている場合は追加
            if (row.id) {
                rowData.id = row.id;
            }

            return rowData;
        });

        // テーブルフィールドを設定
        (targetRecord[this.fieldCode] as any).value = tableRows;
    }

    /**
     * テーブルに行を追加
     * @param rowData - 追加する行のデータ
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     * @returns 追加された行のID
     */
    addRow(rowData: TableRowData, record?: any): string {
        const targetRecord = record || kintone.app.record.get();
        const tableField = targetRecord[this.fieldCode] as any;

        // 新しい行IDを生成
        const newRowId = this.generateRowId();

        // 新しい行を作成
        const newRow = {
            id: newRowId,
            value: rowData,
        };

        // テーブルに行を追加
        if (!tableField.value) {
            tableField.value = [];
        }
        tableField.value.push(newRow as any);

        return newRowId;
    }

    /**
     * テーブル行を更新
     * @param rowId - 更新する行のID
     * @param rowData - 更新する行のデータ
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     * @returns 更新に成功したかどうか
     */
    updateRow(rowId: string, rowData: TableRowData, record?: any): boolean {
        const targetRecord = record || kintone.app.record.get();
        const tableField = targetRecord[this.fieldCode] as any;

        if (!tableField.value) {
            return false;
        }

        // 指定されたIDの行を検索
        const rowIndex = tableField.value.findIndex((row: any) => row.id === rowId);

        if (rowIndex === -1) {
            return false;
        }

        // 行を更新
        tableField.value[rowIndex].value = rowData as any;

        return true;
    }

    /**
     * テーブル行を削除
     * @param rowId - 削除する行のID
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     * @returns 削除に成功したかどうか
     */
    deleteRow(rowId: string, record?: any): boolean {
        const targetRecord = record || kintone.app.record.get();
        const tableField = targetRecord[this.fieldCode] as any;

        if (!tableField.value) {
            return false;
        }

        // 指定されたIDの行を検索
        const rowIndex = tableField.value.findIndex((row: any) => row.id === rowId);

        if (rowIndex === -1) {
            return false;
        }

        // 行を削除
        tableField.value.splice(rowIndex, 1);

        return true;
    }

    /**
     * テーブルをクリア（すべての行を削除）
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     */
    clearTable(record?: any): void {
        const targetRecord = record || kintone.app.record.get();
        const tableField = targetRecord[this.fieldCode] as any;

        if (tableField.value) {
            tableField.value = [];
        }
    }

    /**
     * テーブル行数を取得
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     * @returns テーブル行数
     */
    getRowCount(record?: any): number {
        const table = this.getTable(record);
        return table.length;
    }

    /**
     * 指定されたIDの行を取得
     * @param rowId - 行のID
     * @param record - レコードオブジェクト（省略時は現在のレコード）
     * @returns 行のデータ、存在しない場合はnull
     */
    getRowById(rowId: string, record?: any): { id: string; value: TableRowData } | null {
        const table = this.getTable(record);
        const row = table.find((r) => r.id === rowId);

        return row || null;
    }

    /**
     * テーブル行のIDを生成
     * @returns 新しい行ID
     */
    private generateRowId(): string {
        // kintoneの行IDは通常、タイムスタンプベースの文字列
        // 新規作成時は空文字列を返すとkintoneが自動生成
        return "";
    }

    /**
     * レコードを保存（kintone.app.record.setを使用）
     * @param record - 保存するレコードオブジェクト（省略時は現在のレコード）
     */
    saveRecord(record?: any): void {
        const targetRecord = record || kintone.app.record.get();
        kintone.app.record.set(targetRecord);
    }
}
