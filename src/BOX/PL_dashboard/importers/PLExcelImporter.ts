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

/**
 * kintoneレコード形式の型定義
 * { fieldName: { value: string | number } } の形式
 */
type KintoneRecordFormat = Record<string, { value: string | number }>;

// プラグインを拡張
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * PL管理Excel専用インポータークラス
 * ExcelImporterを継承し、PL管理に特化したメソッドを提供
 */
export class PLExcelImporter extends ExcelImporter {
    private isLoaded: boolean = false;

    /**
     * コンストラクタ
     * @param file - インポートするExcelファイル
     */
    constructor(file: File) {
        super(file);
    }

    /**
     * Excelファイルを読み込む
     * @param validateBeforeLoad - 読み込み前に検証を行うか（デフォルト: true）
     * @param maxSizeMB - 最大ファイルサイズ（MB、デフォルト: 10MB）
     */
    async load(validateBeforeLoad: boolean = true, maxSizeMB: number = 10): Promise<void> {
        try {
            await super.load(validateBeforeLoad, maxSizeMB);
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
        super.dispose();
        this.isLoaded = false;
        Logger.debug("PLExcelImporterを破棄しました");
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
    ): KintoneRecordFormat[] {
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

        const records: KintoneRecordFormat[] = [];
        items.forEach((item) => {
            // 日付の値を取得して変換
            const dateValue = item["日付\r\n(生産日）"];
            let formattedDate = "";
            if (dateValue instanceof Date) {
                formattedDate = dayjs(dateValue).format("YYYY-MM-DD");
            } else if (dateValue !== null && dateValue !== undefined) {
                formattedDate = String(dateValue);
            }

            // 数値フィールドの値を取得して変換
            const getNumberValue = (
                val: string | number | boolean | Date | null | undefined
            ): number => {
                if (typeof val === "number") return val;
                if (typeof val === "string") {
                    const num = Number(val);
                    return isNaN(num) ? 0 : num;
                }
                return 0;
            };

            // 文字列フィールドの値を取得して変換
            const getStringValue = (
                val: string | number | boolean | Date | null | undefined
            ): string => {
                if (val === null || val === undefined) return "";
                if (typeof val === "string") return val;
                if (typeof val === "number") return String(val);
                if (val instanceof Date) return dayjs(val).format("YYYY-MM-DD");
                return String(val);
            };

            const newItem: KintoneRecordFormat = {
                date: {
                    value: formattedDate,
                },
                line_name: {
                    value: getStringValue(item["ライン"]).replace("【", "").replace("】", ""),
                },
                outside_time: { value: getNumberValue(item["派遣工数\r\n（h）"]) },
                user_name: { value: "auto" },
                added_value: { value: getNumberValue(item["付加価値"]) },
                model_name: { value: getStringValue(item["機種名"]) },
                inside_overtime: { value: getNumberValue(item["【社】残業工数\r\n（h）"]) },
                inside_time: { value: getNumberValue(item["社員工数\r\n（h）"]) },
                actual_number: { value: getNumberValue(item["台数"]) },
                outside_overtime: { value: getNumberValue(item["派残業工数\r\n（h）"]) },
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
    ): KintoneRecordFormat[] {
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

        const items: KintoneRecordFormat[] = [];

        record.records.forEach((item, index) => {
            const dateValue = item["日付"];
            let formattedDate = "";
            if (dateValue instanceof Date) {
                formattedDate = dayjs(dateValue).tz("Asia/Tokyo").format("YYYY-MM-DD");
            } else if (dateValue) {
                formattedDate = dateValue.toString();
            }

            if (formattedDate === "") return;
            const newItem: KintoneRecordFormat = {
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
        const dates = items.map((item) => {
            const dateField = item.date;
            if (dateField && typeof dateField === "object" && "value" in dateField) {
                return dateField.value;
            }
            return "";
        });
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
    ): KintoneRecordFormat {
        // シートの存在確認
        if (!this.hasSheet(sheetName1)) {
            throw new Error(`シート "${sheetName1}" が見つかりません`);
        }
        if (!this.hasSheet(sheetName2)) {
            throw new Error(`シート "${sheetName2}" が見つかりません`);
        }

        // sheetName1の処理

        /** 社員単価 */
        const inside_unit: number = super.getCellValueAsNumber("G2", sheetName1);
        /** 派遣単価 */
        const outside_unit: number = super.getCellValueAsNumber("I2", sheetName1);

        // sheetName2の処理
        /** 日付 */
        const day: Date | null = super.getCellValueAsDate("G26", sheetName2);
        /** 直行人員単価 */
        const direct: number = super.getCellValueAsNumber("A28", sheetName2);
        /** 派遣人員単価 */
        const dispatch: number = super.getCellValueAsNumber("A30", sheetName2);
        /** 間接人員単価 */
        const indirect: number = super.getCellValueAsNumber("A32", sheetName2);
        /** 直行人員数 */
        const direct_number: number = super.getCellValueAsNumber("C28", sheetName2);
        /** 派遣人員数 */
        const dispatch_number: number = super.getCellValueAsNumber("C30", sheetName2);
        /** 間接人員数 */
        const indirect_number: number = super.getCellValueAsNumber("C32", sheetName2);

        const item = {
            year: { value: day ? day.getFullYear().toString() : "" },
            month: { value: day ? (day.getMonth() + 1).toString() : "" },
            year_month: { value: day ? `${day.getFullYear()}_${day.getMonth() + 1}` : "" },
            inside_unit: { value: inside_unit.toString() },
            outside_unit: { value: outside_unit.toString() },
            direct: { value: direct.toString() },
            dispatch: { value: dispatch.toString() },
            indirect: { value: indirect.toString() },
            direct_number: { value: direct_number.toString() },
            dispatch_number: { value: dispatch_number.toString() },
            indirect_number: { value: indirect_number.toString() },
        };
        return item;
    }

    /**
     * 読み込んだExcelが期待するフォーマットか検証する
     * @param opts - シート名や検証オプションを上書き可能
     * @returns { ok: boolean, messages: string[] }
     */
    validateFormat(opts?: {
        productionSheet?: string;
        expenseSheet?: string;
        monthlySheet1?: string;
        monthlySheet2?: string;
    }): { ok: boolean; messages: string[] } {
        this.checkLoaded();
        const messages: string[] = [];

        const prodSheet = opts?.productionSheet || "生産履歴（Assy）";
        const expenseSheet = opts?.expenseSheet || "ＰＬ (日毎) (計画反映版)";
        const monthlySheet1 = opts?.monthlySheet1 || "生産履歴（Assy）";
        const monthlySheet2 = opts?.monthlySheet2 || "ＰＬ (日毎) (計画反映版)";

        // シート存在チェック
        if (!this.hasSheet(prodSheet)) {
            messages.push(`シート "${prodSheet}" が見つかりません`);
        }
        if (!this.hasSheet(expenseSheet)) {
            messages.push(`シート "${expenseSheet}" が見つかりません`);
        }
        if (!this.hasSheet(monthlySheet1)) {
            messages.push(`シート "${monthlySheet1}" が見つかりません`);
        }
        if (!this.hasSheet(monthlySheet2)) {
            messages.push(`シート "${monthlySheet2}" が見つかりません`);
        }

        // 以降のチェックはシートがある場合のみ実行
        try {
            if (this.hasSheet(prodSheet)) {
                const df = this.getTableDataAsDataFrame("A", "P", 3, 4, prodSheet);
                const keys = Object.keys(df.records[0] || {});
                const need = ["日付", "ライン", "付加価値", "機種名", "台数"];
                const ok = need.some((n) => keys.includes(n));
                if (!ok) {
                    console.log(
                        `生産実績シート(${prodSheet})に必要な列が見つかりません。期待列例: ${need.join(", ")}`
                    );
                    messages.push(
                        `生産実績シート(${prodSheet})に必要な列が見つかりません。期待列例: ${need.join(", ")}`
                    );
                }
            }
        } catch (e) {
            console.log(`生産実績シート(${prodSheet}) の解析に失敗しました: ${String(e)}`);
            messages.push(`生産実績シート(${prodSheet}) の解析に失敗しました: ${String(e)}`);
        }

        try {
            if (this.hasSheet(expenseSheet)) {
                const df = this.getTableDataAsDataFrameTransposed(
                    "B",
                    "G",
                    "AK",
                    26,
                    66,
                    expenseSheet
                );
                const keys = df.columns || [];
                const need = ["実績", "直行残業(ｈ)", "間接材料費", "夜勤手当"];
                const ok = need.some((n) => keys.includes(n));
                if (!ok) {
                    console.log(
                        `経費計算シート(${expenseSheet})に必要な行/列が見つかりません。期待項目例: ${need.join(", ")}⇒実際の項目: ${keys}`
                    );
                    messages.push(
                        `経費計算シート(${expenseSheet})に必要な行/列が見つかりません。期待項目例: ${need.join(", ")}`
                    );
                }
            }
        } catch (e) {
            console.log(`経費計算シート(${expenseSheet}) の解析に失敗しました: ${String(e)}`);
            messages.push(`経費計算シート(${expenseSheet}) の解析に失敗しました: ${String(e)}`);
        }

        try {
            if (this.hasSheet(monthlySheet2)) {
                const day = this.getCellValueAsDate("G26", monthlySheet2);
                if (!day) {
                    console.log(`月次シート(${monthlySheet2})の基準日(G26)が取得できませんでした`);
                    messages.push(
                        `月次シート(${monthlySheet2})の基準日(G26)が取得できませんでした`
                    );
                }
            }
        } catch (e) {
            console.log(`月次シート(${monthlySheet2}) の解析に失敗しました: ${String(e)}`);
            messages.push(`月次シート(${monthlySheet2}) の解析に失敗しました: ${String(e)}`);
        }

        return { ok: messages.length === 0, messages };
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
    private renameExpenseColumns(
        record: TableDataFrame<Record<string, string | number | boolean | Date | null>>
    ): void {
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
