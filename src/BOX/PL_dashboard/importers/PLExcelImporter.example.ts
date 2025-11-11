/**
 * PLExcelImporter 使用例
 */

import { ExcelImporter } from "./ExcelImporter";

/**
 * PL管理Excelファイルからデータを読み込む例
 */
async function exampleUsage(file: File) {
    // 1. インポーターを作成
    const importer = new ExcelImporter(file);

    try {
        // 2. ファイルを読み込み
        await importer.load();

        // 3. シート名を取得
        const sheetNames = importer.getSheetNames();
        console.log("利用可能なシート:", sheetNames);

        // 4. 特定のセルから値を取得
        const targetSheet = "生産履歴（Assy）"; // シート名を指定

        // セルアドレスで直接取得
        const companyName = importer.getCellValueAsString("B2", targetSheet);
        const yearMonth = importer.getCellValueAsString("D2", targetSheet);
        const revenue = importer.getCellValueAsNumber("E10", targetSheet);

        console.log("会社名:", companyName);
        console.log("年月:", yearMonth);
        console.log("売上:", revenue);

        // 5. 範囲指定で複数セルを取得
        const dataRange = importer.getRangeValues("A5:E15", targetSheet);
        console.log("範囲データ:", dataRange);

        // 6. 行番号・列番号からセルアドレスを生成して取得
        const row = 5; // 6行目（0始まり）
        const col = 2; // C列（0始まり）
        const cellAddress = ExcelImporter.getCellAddress(row, col);
        const cellValue = importer.getCellValue(cellAddress, targetSheet);
        console.log(`セル ${cellAddress} の値:`, cellValue);

        // 7. 日付セルの取得
        const date = importer.getCellValueAsDate("A10", targetSheet);
        console.log("日付:", date);

        // 8. データの加工例
        const plData = {
            companyName,
            yearMonth,
            revenue,
            costs: importer.getCellValueAsNumber("E11", targetSheet),
            profit: importer.getCellValueAsNumber("E12", targetSheet),
            profitRate: importer.getCellValueAsNumber("E13", targetSheet),
        };

        console.log("PL管理データ:", plData);

        return plData;
    } catch (error) {
        console.error("データ読み込みエラー:", error);
        throw error;
    } finally {
        // 9. 使用後はリソースを解放
        importer.dispose();
    }
}

/**
 * 複数シートから異なるセルを読み込む例
 */
async function exampleMultiSheet(file: File) {
    const importer = new ExcelImporter(file);

    try {
        await importer.load();

        // シート1からデータ取得
        const sheet1Data = {
            value1: importer.getCellValueAsNumber("B5", "Sheet1"),
            value2: importer.getCellValueAsString("C5", "Sheet1"),
        };

        // シート2からデータ取得
        const sheet2Data = {
            value1: importer.getCellValueAsNumber("B5", "Sheet2"),
            value2: importer.getCellValueAsString("C5", "Sheet2"),
        };

        return { sheet1Data, sheet2Data };
    } finally {
        importer.dispose();
    }
}

/**
 * ファイル選択イベントハンドラー例
 */
function setupFileInput() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx,.xls";

    fileInput.addEventListener("change", async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            try {
                const data = await exampleUsage(file);
                console.log("読み込み成功:", data);
            } catch (error) {
                console.error("読み込み失敗:", error);
                alert("Excelファイルの読み込みに失敗しました");
            }
        }
    });

    return fileInput;
}

export { exampleMultiSheet, exampleUsage, setupFileInput };
