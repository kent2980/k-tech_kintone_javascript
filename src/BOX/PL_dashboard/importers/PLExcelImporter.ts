/// <reference path="../../../../kintone.d.ts" />
/// <reference path="../../../../globals.d.ts" />
/// <reference path="../fields/daily_fields.d.ts" />
/// <reference path="../fields/line_daily_fields.d.ts" />
/// <reference path="../fields/month_fields.d.ts" />
/// <reference path="../fields/model_master_fields.d.ts" />

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Logger } from "../utils";
import { ExcelImporter, TableDataFrame } from "./ExcelImporter";

// プラグインを拡張
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * PL管理Excel専用インポーターラッパークラス
 * ExcelImporterを拡張し、PL管理に特化したメソッドを提供
 */
export class PLExcelImporter {
    private importer: ExcelImporter;
    private isLoaded: boolean = false;

    /**
     * コンストラクタ
     * @param file - インポートするExcelファイル
     */
    constructor(file: File) {
        this.importer = new ExcelImporter(file);
    }

    /**
     * Excelファイルを読み込む
     */
    async load(): Promise<void> {
        try {
            await this.importer.load();
            this.isLoaded = true;
            Logger.debug("PLExcelファイルを読み込みました");
        } catch (error) {
            Logger.error("PLExcelファイルの読み込みに失敗しました", error);
            throw error;
        }
    }

    /**
     * 使用後はリソースを解放
     */
    dispose(): void {
        this.importer.dispose();
        this.isLoaded = false;
        Logger.debug("PLExcelImporterを破棄しました");
    }

    // ========================================
    // PL管理特化メソッド
    // ========================================

    // ========================================
    // Delegation methods - ExcelImporterの機能を提供
    // ========================================

    /**
     * 全シート名を取得
     */
    getSheetNames(): string[] {
        this.checkLoaded();
        return this.importer.getSheetNames();
    }

    /**
     * 指定されたシートが存在するか確認
     */
    hasSheet(sheetName: string): boolean {
        this.checkLoaded();
        return this.importer.hasSheet(sheetName);
    }

    /**
     * 指定されたセル値を取得
     */
    getCellValue(address: string, sheetName?: string): any {
        this.checkLoaded();
        return this.importer.getCellValue(address, sheetName);
    }

    /**
     * 指定されたセル値を日付として取得
     */
    getCellValueAsDate(address: string, sheetName?: string): Date | null {
        this.checkLoaded();
        return this.importer.getCellValueAsDate(address, sheetName);
    }

    /**
     * テーブルデータを2次元配列で取得
     */
    getTableData(
        startColumn: string | number,
        endColumn: string | number,
        headerRow: number,
        sheetName?: string
    ): string[][] {
        this.checkLoaded();
        return this.importer.getTableData(startColumn, endColumn, headerRow, sheetName);
    }

    /**
     * テーブルデータをDataFrame形式で取得
     */
    getTableDataAsDataFrame(
        startColumn: string | number,
        endColumn: string | number,
        headerRow: number,
        dataStartRow: number,
        sheetName?: string
    ): TableDataFrame {
        this.checkLoaded();
        return this.importer.getTableDataAsDataFrame(
            startColumn,
            endColumn,
            headerRow,
            dataStartRow,
            sheetName
        );
    }

    /**
     * 縦方向テーブル（転置テーブル）をDataFrame形式で取得
     * 左端列がカラム名で、右方向にデータが横並び
     */
    getTableDataAsDataFrameTransposed(
        headerColumn: string | number,
        dataStartColumn: string | number,
        dataEndColumn: string | number,
        startRow: number,
        endRow: number,
        sheetName?: string
    ): TableDataFrame {
        this.checkLoaded();
        return this.importer.getTableDataAsDataFrameTransposed(
            headerColumn,
            dataStartColumn,
            dataEndColumn,
            startRow,
            endRow,
            sheetName
        );
    }

    /**
     * セル範囲の値を取得
     */
    getRangeValues(range: string, sheetName?: string): any[][] {
        this.checkLoaded();
        return this.importer.getRangeValues(range, sheetName);
    }

    /**
     * 複数シートからデータを一括取得
     */
    getMultiSheetData(sheetConfigs: any[]): Record<string, TableDataFrame> {
        this.checkLoaded();
        const result: Record<string, TableDataFrame> = {};
        for (const config of sheetConfigs) {
            result[config.sheetName] = this.importer.getTableDataAsDataFrame(
                config.startColumn,
                config.endColumn,
                config.headerRow,
                config.dataStartRow,
                config.sheetName
            );
        }
        return result;
    }

    // ========================================
    // PL管理特化メソッド
    // ========================================

    /**
     * PL管理用の生産実績データを読み込む
     * @param sheetName - シート名（例: "生産履歴（Assy）"）
     * @param startColumn - 開始列（デフォルト: "A"）
     * @param endColumn - 終了列（デフォルト: "P"）
     * @param headerRow - ヘッダー行（デフォルト: 3）
     * @param dataStartRow - データ開始行（デフォルト: 4）
     * @returns DataFrame形式の生産実績データ
     */
    getProductionData(
        sheetName: string = "生産履歴（Assy）",
        startColumn: string | number = "A",
        endColumn: string | number = "P",
        headerRow: number = 3,
        dataStartRow: number = 4
    ): Record<string, any>[] {
        if (!this.hasSheet(sheetName)) {
            throw new Error(`シート "${sheetName}" が見つかりません`);
        }

        Logger.debug(`生産実績データを読み込んでいます: ${sheetName}`);
        const items = this.getTableDataAsDataFrame(
            startColumn,
            endColumn,
            headerRow,
            dataStartRow,
            sheetName
        ).records;

        // console.log(`取得した生産実績データ件数: ${items.length}件`);
        console.log("生産実績データの内容1:", items);
        // itemsのキーをコンソールに出力
        console.log("生産実績データのキー一覧:", Object.keys(items[0] || {}));

        const records: Record<string, any>[] = [];
        items.forEach((item) => {
            const newItem: Record<string, any> = {
                date: {
                    value: dayjs(item["日付\r\n(生産日）"]).format("YYYY-MM-DD"),
                },
                line_name: {
                    value: String(item["ライン"]).replace("【", "").replace("】", ""),
                },
                outside_time: { value: item["派遣工数\r\n（h）"] },
                user_name: { value: "auto" },
                added_value: { value: item["付加価値"] },
                model_name: { value: item["機種名"] },
                inside_overtime: { value: item["【社】残業工数\r\n（h）"] },
                inside_time: { value: item["社員工数\r\n（h）"] },
                actual_number: { value: item["台数"] },
                outside_overtime: { value: item["派残業工数\r\n（h）"] },
                // 必須フィールド
                production_number: { value: "0" },
                target_number: { value: "0" },
                ルックアップ: { value: "auto" },
            };

            records.push(newItem);
        });
        return records;
    }

    /**
     * PL管理用の経費計算データを読み込む
     * @param sheetName - シート名（例: "経費計算"）
     * @param headerColumn - カラム列（例: "A"）
     * @param dataStartColumn - データ開始列（例: "B"）
     * @param dataEndColumn - データ終了列（例: "M"）
     * @param startRow - データ開始行（デフォルト: 2）
     * @param endRow - データ終了行（デフォルト: 100）
     * @returns kintone API形式のレコード配列
     */
    getExpenseCalculationData(
        sheetName: string = "ＰＬ (日毎) (計画反映版)",
        headerColumn: string | number = "B",
        dataStartColumn: string | number = "G",
        dataEndColumn: string | number = "AK",
        startRow: number = 26,
        endRow: number = 66
    ): Record<string, any>[] {
        if (!this.hasSheet(sheetName)) {
            throw new Error(`シート "${sheetName}" が見つかりません`);
        }

        Logger.debug(`経費計算データを読み込んでいます: ${sheetName}`);
        const record = this.getTableDataAsDataFrameTransposed(
            headerColumn,
            dataStartColumn,
            dataEndColumn,
            startRow,
            endRow,
            sheetName
        );

        // カラム名をマッピングして可読性を向上
        this.renameExpenseColumns(record);

        const items: Record<string, any>[] = [];

        record.records.forEach((item, index) => {
            const dateValue = item["日付"];
            let formattedDate = "";
            if (dateValue instanceof Date) {
                formattedDate = dayjs(dateValue).tz("Asia/Tokyo").format("YYYY-MM-DD");
            } else if (dateValue) {
                formattedDate = dateValue.toString();
            }

            if (formattedDate === "") return;
            const newItem: Record<string, any> = {
                date: { value: formattedDate },
                indirect_material_costs: {
                    value: (item["間接材料費"] || 0).toString(),
                },
                inside_overtime_cost: {
                    value: (item["残業経費(社員)"] || 0).toString(),
                },
                outside_overtime_cost: {
                    value: (item["残業経費(派遣)"] || 0).toString(),
                },
                other_added_value: {
                    value: (item["量産外付加価値"] || 0).toString(),
                },
                other_indirect_material_costs: {
                    value: (item["間接材料費,残業休出経費以外"] || "").toString(),
                },
                inside_holiday_expenses: {
                    value: (item["休出経費(社員)"] || 0).toString(),
                },
                outside_holiday_expenses: {
                    value: (item["休出経費(派遣)"] || 0).toString(),
                },
                direct_personnel: { value: (item["直行人員"] || 0).toString() },
                temporary_employees: {
                    value: (item["派遣社員"] || 0).toString(),
                },
                labor_costs: {
                    value: (item["直行/間接人件費(残業・休出含まない）"] || 0).toString(),
                },
                indirect_overtime: { value: (item["間接残業(ｈ)"] || 0).toString() },
                total_sub_cost: { value: (item["工具器具消耗品、荷造運賃"] || 0).toString() },
                indirect_holiday_work: {
                    value: (item["間接休出(ｈ)"] || 0).toString(),
                },
                indirect_personnel: { value: (item["間接人員"] || 0).toString() },
                night_shift_allowance: {
                    value: (item["夜勤手当"] || 0).toString(),
                },
            };
            items.push(newItem);
        });

        // デバッグ: 生成されたレコード数と日付一覧を出力
        console.log(`生成されたレコード数: ${items.length}件`);
        const dates = items.map((item) => item.date.value);
        console.log("日付一覧:", dates);
        console.log(
            "重複している日付:",
            dates.filter((date, index) => dates.indexOf(date) !== index)
        );

        return items;
    }

    /**
     * 月次データを取得
     * @param sheetName1 - 生産履歴シート名（デフォルト: "生産履歴（Assy）"）
     * @param sheetName2 - PL日毎シート名（デフォルト: "ＰＬ (日毎) (計画反映版)"）
     * @returns 月次データのオブジェクト
     */
    getMonthlyData(
        sheetName1: string = "生産履歴（Assy）",
        sheetName2: string = "ＰＬ (日毎) (計画反映版)"
    ): Record<string, any> {
        // シートの存在確認
        if (!this.hasSheet(sheetName1)) {
            throw new Error(`シート "${sheetName1}" が見つかりません`);
        }
        if (!this.hasSheet(sheetName2)) {
            throw new Error(`シート "${sheetName2}" が見つかりません`);
        }

        // sheetName1の処理

        /** 社員単価 */
        const inside_unit: number = this.importer.getCellValueAsNumber("G2", sheetName1);
        /** 派遣単価 */
        const outside_unit: number = this.importer.getCellValueAsNumber("I2", sheetName1);

        // sheetName2の処理
        /** 日付 */
        const day: Date | null = this.importer.getCellValueAsDate("G26", sheetName2);
        /** 直行人員単価 */
        const direct: number = this.importer.getCellValueAsNumber("A28", sheetName2);
        /** 派遣人員単価 */
        const dispatch: number = this.importer.getCellValueAsNumber("A30", sheetName2);
        /** 間接人員単価 */
        const indirect: number = this.importer.getCellValueAsNumber("A32", sheetName2);

        const item = {
            year: { value: day ? day.getFullYear().toString() : "" },
            month: { value: day ? (day.getMonth() + 1).toString() : "" },
            year_month: { value: day ? `${day.getFullYear()}_${day.getMonth() + 1}` : "" },
            inside_unit: { value: inside_unit.toString() },
            outside_unit: { value: outside_unit.toString() },
            direct: { value: direct.toString() },
            dispatch: { value: dispatch.toString() },
            indirect: { value: indirect.toString() },
        };
        return item;
    }

    // ========================================
    // Private utilities
    // ========================================

    /**
     * ファイルがロードされているか確認
     */
    private checkLoaded(): void {
        if (!this.isLoaded) {
            throw new Error(
                "Excelファイルがロードされていません。先にload()を呼び出してください。"
            );
        }
    }

    /**
     * 経費計算データのカラム名をマッピング
     * 元のカラム名（Column_XX形式）から日本語名に変換
     * @param records - 変換対象のレコード配列
     */
    private renameExpenseColumns(record: TableDataFrame<Record<string, any>>): void {
        // カラムマッピング定義
        const columnMapping: Record<string, string> = {
            Column_31: "派遣社員経費",
            "　経費": "直行人員経費",
            Column_33: "間接人員経費",
            Column_36: "直行残業休出経費",
            Column_39: "派遣残業休出経費",
            Column_42: "間接残業休出経費",
            実績: "日付",
            Column_66: "量産外付加価値",
        };

        // カラム名を変換
        record.columns = record.columns.map((colName) =>
            columnMapping[colName] ? columnMapping[colName] : colName
        );

        // レコードのキーを変換
        record.records.forEach((item) => {
            Object.entries(columnMapping).forEach(([oldKey, newKey]) => {
                if (oldKey in item) {
                    item[newKey] = item[oldKey];
                    delete item[oldKey];
                }
            });
        });
    }
}
