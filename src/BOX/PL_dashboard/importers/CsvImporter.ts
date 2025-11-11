import { Logger } from "../utils";
import { FileImporter } from "./FileImporter";

/**
 * CSVファイルインポーター
 */
export class CsvImporter<T> extends FileImporter<T> {
    private delimiter: string;
    private hasHeader: boolean;
    private mapper: (row: string[]) => T;

    /**
     * コンストラクタ
     * @param mapper - CSVの行をオブジェクトに変換する関数
     * @param options - オプション設定
     */
    constructor(
        mapper: (row: string[]) => T,
        options: {
            delimiter?: string;
            hasHeader?: boolean;
        } = {}
    ) {
        super();
        this.mapper = mapper;
        this.delimiter = options.delimiter || ",";
        this.hasHeader = options.hasHeader !== false;
    }

    /**
     * CSVファイルをインポート
     * @param file - CSVファイル
     * @returns パース済みのデータ配列
     */
    async importFile(file: File): Promise<T[]> {
        // ファイル拡張子をチェック
        if (!this.validateFileExtension(file, ["csv", "txt"])) {
            throw new Error("CSVファイルまたはテキストファイルを選択してください");
        }

        // ファイルサイズをチェック
        if (!this.validateFileSize(file, 50)) {
            throw new Error("ファイルサイズは50MB以下にしてください");
        }

        try {
            const content = await this.readFileAsText(file);
            return this.parseCSV(content);
        } catch (error) {
            Logger.error("CSVファイルの読み込みに失敗しました", error);
            throw error;
        }
    }

    /**
     * CSV文字列をパース
     * @param content - CSVの内容
     * @returns パース済みのデータ配列
     */
    private parseCSV(content: string): T[] {
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

        if (lines.length === 0) {
            throw new Error("CSVファイルが空です");
        }

        // ヘッダー行をスキップ
        const dataLines = this.hasHeader ? lines.slice(1) : lines;

        const results: T[] = [];
        dataLines.forEach((line, index) => {
            try {
                const row = this.parseLine(line);
                const item = this.mapper(row);
                results.push(item);
            } catch (error) {
                Logger.warn(`行 ${index + (this.hasHeader ? 2 : 1)} の解析に失敗しました`, error);
            }
        });

        return results;
    }

    /**
     * CSV行をパース（ダブルクォートで囲まれた値も考慮）
     * @param line - CSV行
     * @returns パース済みの配列
     */
    private parseLine(line: string): string[] {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // エスケープされたダブルクォート
                    current += '"';
                    i++;
                } else {
                    // クォートの開始/終了
                    inQuotes = !inQuotes;
                }
            } else if (char === this.delimiter && !inQuotes) {
                // 区切り文字
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }

        // 最後の値を追加
        result.push(current.trim());

        return result;
    }
}
