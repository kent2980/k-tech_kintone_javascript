import { Logger } from "../utils";
import { ExcelImporter, TableDataFrame } from "./ExcelImporter";

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
    ): TableDataFrame {
        if (!this.hasSheet(sheetName)) {
            throw new Error(`シート "${sheetName}" が見つかりません`);
        }

        Logger.debug(`生産実績データを読み込んでいます: ${sheetName}`);
        return this.getTableDataAsDataFrame(
            startColumn,
            endColumn,
            headerRow,
            dataStartRow,
            sheetName
        );
    }

    /**
     * PL管理用の経費計算データを読み込む
     * @param sheetName - シート名（例: "経費計算"）
     * @param headerColumn - カラム列（例: "A"）
     * @param dataStartColumn - データ開始列（例: "B"）
     * @param dataEndColumn - データ終了列（例: "M"）
     * @param startRow - データ開始行（デフォルト: 2）
     * @param endRow - データ終了行（デフォルト: 100）
     * @returns DataFrame形式の経費計算データ
     */
    getExpenseCalculationData(
        sheetName: string = "ＰＬ (日毎) (計画反映版)",
        headerColumn: string | number = "B",
        dataStartColumn: string | number = "G",
        dataEndColumn: string | number = "AK",
        startRow: number = 26,
        endRow: number = 58
    ): TableDataFrame {
        if (!this.hasSheet(sheetName)) {
            throw new Error(`シート "${sheetName}" が見つかりません`);
        }

        Logger.debug(`経費計算データを読み込んでいます: ${sheetName}`);
        return this.getTableDataAsDataFrameTransposed(
            headerColumn,
            dataStartColumn,
            dataEndColumn,
            startRow,
            endRow,
            sheetName
        );
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
}
