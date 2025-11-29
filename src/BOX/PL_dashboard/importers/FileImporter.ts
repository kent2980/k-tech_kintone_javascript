/**
 * ファイルインポート機能のベースクラス
 */
export abstract class FileImporter<T> {
    /**
     * ファイルを読み込む
     *      * file: インポートするファイル
     * *  パース済みのデータ
     */
    abstract importFile(file: File): Promise<T[]>;

    /**
     * ファイルをテキストとして読み込む
     *      * file: 読み込むファイル
     * *  ファイルの内容
     */
    protected readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === "string") {
                    resolve(result);
                } else {
                    reject(new Error("ファイルの読み込みに失敗しました"));
                }
            };
            reader.onerror = () => reject(new Error("ファイルの読み込みエラー"));
            reader.readAsText(file, "UTF-8");
        });
    }

    /**
     * ファイル拡張子をチェック
     *      * file: チェックするファイル
     *      * allowedExtensions: 許可する拡張子の配列
     * *  拡張子が許可されているかどうか
     */
    protected validateFileExtension(file: File, allowedExtensions: string[]): boolean {
        const extension = file.name.split(".").pop()?.toLowerCase();
        return extension ? allowedExtensions.includes(extension) : false;
    }

    /**
     * ファイルサイズをチェック
     *      * file: チェックするファイル
     *      * maxSizeMB: 最大サイズ
     * *  サイズが許容範囲内かどうか
     */
    protected validateFileSize(file: File, maxSizeMB: number = 10): boolean {
        const maxBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxBytes;
    }
}
