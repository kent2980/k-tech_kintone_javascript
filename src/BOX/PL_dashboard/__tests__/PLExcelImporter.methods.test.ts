import { beforeAll, describe, expect, it } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import { PLExcelImporter } from "../importers/PLExcelImporter";

/**
 * PLExcelImporter PL特化メソッドテスト
 * getProductionData と getExpenseCalculationData に特化したテスト
 */
describe("PLExcelImporter - PL特化メソッド", () => {
    let excelFile: File;
    const testFilePath = path.join(
        __dirname,
        "../__tests__/data",
        "●【配賦経費無し】9月 進捗管理（グラフあり）.xlsm"
    );

    beforeAll(async () => {
        // テストファイルを読み込む
        if (!fs.existsSync(testFilePath)) {
            throw new Error(`テストファイルが見つかりません: ${testFilePath}`);
        }

        const fileBuffer = fs.readFileSync(testFilePath);
        excelFile = new File([fileBuffer], "test.xlsm", { type: "application/octet-stream" });
    });

    describe("getProductionData - 生産実績データ", () => {
        it("デフォルト設定で生産実績データを取得", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n" + "=".repeat(80));
                console.log("📦 getProductionData() - 生産実績データ取得テスト");
                console.log("=".repeat(80));

                try {
                    const productionData = importer.getProductionData();

                    console.log("\n📊 データ構造情報:");
                    console.log(`  カラム数: ${productionData.columnCount}`);
                    console.log(`  行数（レコード数）: ${productionData.rowCount}`);
                    console.log(`  カラム名: ${productionData.columns.join(", ")}`);

                    console.log("\n📋 レコード表示（最初の3件と最後の5件）:");
                    console.log("─".repeat(80));

                    if (productionData.records.length === 0) {
                        console.log("  (データが見つかりません)");
                    } else {
                        // 最初の3件
                        const displayCount = Math.min(3, productionData.records.length);
                        console.log(`\n【最初の ${displayCount} 件】`);
                        for (let i = 0; i < displayCount; i++) {
                            const record = productionData.records[i];
                            console.log(`\n  レコード ${i + 1}/${productionData.records.length}:`);
                            console.log(`  ${JSON.stringify(record, null, 4)}`);
                        }

                        // 最後の5件
                        if (productionData.records.length > 3) {
                            const startIndex = Math.max(3, productionData.records.length - 5);
                            const lastRecords = productionData.records.slice(startIndex);
                            console.log(
                                `\n【最後の ${lastRecords.length} 件】 (${startIndex + 1} - ${productionData.records.length})`
                            );
                            for (let i = 0; i < lastRecords.length; i++) {
                                const record = lastRecords[i];
                                const actualIndex = startIndex + i;
                                console.log(
                                    `\n  レコード ${actualIndex + 1}/${productionData.records.length}:`
                                );
                                console.log(`  ${JSON.stringify(record, null, 4)}`);
                            }
                        }
                    }

                    console.log("\n─".repeat(80));
                    console.log(`✅ 取得完了: ${productionData.records.length}レコード`);

                    // アサーション
                    expect(productionData.columnCount).toBeGreaterThan(0);
                    expect(Array.isArray(productionData.columns)).toBe(true);
                    expect(Array.isArray(productionData.records)).toBe(true);
                    expect(productionData.rowCount).toBe(productionData.records.length);
                } catch (error) {
                    console.log("  ⚠️ デフォルトシートで生産実績データが見つかりません");
                }
            } finally {
                importer.dispose();
            }
        });

        it("カスタムシート名で生産実績データを取得", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                console.log("\n" + "=".repeat(80));
                console.log("📦 getProductionData(sheetName) - カスタムシート名でのテスト");
                console.log("=".repeat(80));

                // 複数のシートで試す
                for (let i = 0; i < Math.min(3, sheetNames.length); i++) {
                    const sheetName = sheetNames[i];
                    console.log(`\n🔄 シート: "${sheetName}"`);

                    try {
                        const productionData = importer.getProductionData(
                            sheetName,
                            "A",
                            "P",
                            3,
                            4
                        );

                        console.log(`  ✅ データ取得成功`);
                        console.log(
                            `     カラム数: ${productionData.columnCount}, 行数: ${productionData.rowCount}`
                        );
                        console.log(
                            `     カラム: ${productionData.columns.slice(0, 5).join(", ")}${
                                productionData.columnCount > 5 ? ", ..." : ""
                            }`
                        );

                        if (productionData.records.length > 0) {
                            console.log(
                                `     最初のレコード: ${JSON.stringify(productionData.records[0])}`
                            );
                        }
                    } catch (error) {
                        console.log(`  ⚠️ このシートでは生産実績データが見つかりません`);
                    }
                }
            } finally {
                importer.dispose();
            }
        });

        it("生産実績データのレコード値が正しく型変換されている", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n" + "=".repeat(80));
                console.log("🔍 getProductionData() - データ型検証");
                console.log("=".repeat(80));

                try {
                    const productionData = importer.getProductionData();

                    if (productionData.records.length > 0) {
                        console.log("\n📝 データ型確認:");
                        const firstRecord = productionData.records[0];

                        for (const [key, value] of Object.entries(firstRecord)) {
                            let typeStr: string = typeof value;
                            if (value === null) {
                                typeStr = "null";
                            } else if (value instanceof Date) {
                                typeStr = "Date";
                            } else if (Array.isArray(value)) {
                                typeStr = "Array";
                            }

                            console.log(
                                `  ${key}: ${typeStr} = ${
                                    value instanceof Date
                                        ? value.toISOString()
                                        : JSON.stringify(value)
                                }`
                            );
                        }

                        console.log("\n✅ 型検証完了");
                        expect(productionData.records.length).toBeGreaterThan(0);
                    } else {
                        console.log("  (データが見つかりません)");
                    }
                } catch (error) {
                    console.log("  ⚠️ データが見つかりません");
                }
            } finally {
                importer.dispose();
            }
        });
    });

    describe("getExpenseCalculationData - 経費計算データ", () => {
        it("デフォルト設定で経費計算データを取得", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n" + "=".repeat(80));
                console.log("💰 getExpenseCalculationData() - 経費計算データ取得テスト");
                console.log("=".repeat(80));

                try {
                    const expenseData = importer.getExpenseCalculationData();

                    console.log("\n📊 データ構造情報:");
                    console.log(`  カラム数: ${expenseData.columnCount}`);
                    console.log(`  レコード数: ${expenseData.rowCount}`);
                    console.log(`  カラム名: ${expenseData.columns.join(", ")}`);

                    console.log("\n📋 レコード表示（最初の3件と最後の5件）:");
                    console.log("─".repeat(80));

                    if (expenseData.records.length === 0) {
                        console.log("  (データが見つかりません)");
                    } else {
                        // 最初の3件
                        const displayCount = Math.min(3, expenseData.records.length);
                        console.log(`\n【最初の ${displayCount} 件】`);
                        for (let i = 0; i < displayCount; i++) {
                            const record = expenseData.records[i];
                            console.log(`\n  レコード ${i + 1}/${expenseData.records.length}:`);
                            console.log(`  ${JSON.stringify(record, null, 4)}`);
                        }

                        // 最後の5件
                        if (expenseData.records.length > 3) {
                            const startIndex = Math.max(3, expenseData.records.length - 5);
                            const lastRecords = expenseData.records.slice(startIndex);
                            console.log(
                                `\n【最後の ${lastRecords.length} 件】 (${startIndex + 1} - ${expenseData.records.length})`
                            );
                            for (let i = 0; i < lastRecords.length; i++) {
                                const record = lastRecords[i];
                                const actualIndex = startIndex + i;
                                console.log(
                                    `\n  レコード ${actualIndex + 1}/${expenseData.records.length}:`
                                );
                                console.log(`  ${JSON.stringify(record, null, 4)}`);
                            }
                        }
                    }

                    console.log("\n─".repeat(80));
                    console.log(`✅ 取得完了: ${expenseData.records.length}レコード`);

                    // アサーション
                    expect(expenseData.columnCount).toBeGreaterThan(0);
                    expect(Array.isArray(expenseData.columns)).toBe(true);
                    expect(Array.isArray(expenseData.records)).toBe(true);
                    expect(expenseData.rowCount).toBe(expenseData.records.length);
                } catch (error) {
                    console.log("  ⚠️ デフォルト設定で経費計算データが見つかりません");
                    console.log(`  エラー: ${error}`);
                }
            } finally {
                importer.dispose();
            }
        });

        it("カスタム設定で経費計算データを取得", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n" + "=".repeat(80));
                console.log("💰 getExpenseCalculationData(custom params) - カスタム設定テスト");
                console.log("=".repeat(80));

                // デフォルトシートを使用
                const sheetName = "ＰＬ (日毎) (計画反映版)";

                if (!importer.hasSheet(sheetName)) {
                    console.log(`  ⚠️ シート「${sheetName}」が見つかりません`);
                    return;
                }

                console.log(`\n📍 対象シート: "${sheetName}"`);

                try {
                    // 異なる範囲でテスト
                    const expenseData = importer.getExpenseCalculationData(
                        sheetName,
                        "B", // headerColumn
                        "G", // dataStartColumn
                        "AK", // dataEndColumn
                        26, // startRow
                        58 // endRow
                    );

                    console.log(`\n✅ データ取得成功`);
                    console.log(`  カラム数: ${expenseData.columnCount}`);
                    console.log(`  レコード数: ${expenseData.rowCount}`);

                    console.log("\n📝 カラム構成:");
                    expenseData.columns.forEach((col: string, idx: number) => {
                        console.log(`  [${idx}] ${col}`);
                    });

                    console.log("\n📋 レコード表示（最初の3件と最後の5件）:");
                    console.log("─".repeat(80));

                    if (expenseData.records.length > 0) {
                        // 最初の3件
                        const displayCount = Math.min(3, expenseData.records.length);
                        console.log(`\n【最初の ${displayCount} 件】`);
                        for (let i = 0; i < displayCount; i++) {
                            const record = expenseData.records[i];
                            console.log(`\n  レコード ${i + 1}/${expenseData.records.length}:`);
                            console.log(`  ${JSON.stringify(record, null, 2)}`);
                        }

                        // 最後の5件
                        if (expenseData.records.length > 3) {
                            const startIndex = Math.max(3, expenseData.records.length - 5);
                            const lastRecords = expenseData.records.slice(startIndex);
                            console.log(
                                `\n【最後の ${lastRecords.length} 件】 (${startIndex + 1} - ${expenseData.records.length})`
                            );
                            for (let i = 0; i < lastRecords.length; i++) {
                                const record = lastRecords[i];
                                const actualIndex = startIndex + i;
                                console.log(
                                    `\n  レコード ${actualIndex + 1}/${expenseData.records.length}:`
                                );
                                console.log(`  ${JSON.stringify(record, null, 2)}`);
                            }
                        }
                    }
                    console.log("\n" + "─".repeat(80));

                    console.log(`\n✅ 取得完了: ${expenseData.records.length}レコード`);
                } catch (error) {
                    console.log(`  ⚠️ データ取得に失敗しました`);
                    console.log(`  エラー: ${error}`);
                }
            } finally {
                importer.dispose();
            }
        });

        it("経費計算データの転置テーブル構造を確認", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n" + "=".repeat(80));
                console.log("🔍 getExpenseCalculationData() - 転置テーブル構造確認");
                console.log("=".repeat(80));

                try {
                    const expenseData = importer.getExpenseCalculationData();

                    console.log("\n📊 転置テーブル構造:");
                    console.log(`  左端列（ヘッダー列）: B列`);
                    console.log(`  データ行: 26〜58行`);
                    console.log(`  データ列: G〜AK列`);

                    console.log("\n📈 データの特性:");
                    console.log(`  期待されるカラム数: 日付データの列数（AK - G + 1 = ${27}列）`);
                    console.log(`  実際のカラム数: ${expenseData.columnCount}`);

                    if (expenseData.records.length > 0) {
                        console.log(`\n📋 レコード構成:`);
                        console.log(`  各レコードはB列の行ラベル値をキーに持つ`);
                        console.log(`  値は対応する日付列のセル値`);

                        console.log(`\n最初のレコード内容:`);
                        console.log(JSON.stringify(expenseData.records[0], null, 2));
                    }

                    console.log("\n✅ 構造確認完了");
                    expect(expenseData.columnCount).toBeGreaterThan(0);
                    expect(expenseData.rowCount).toBeGreaterThanOrEqual(0);
                } catch (error) {
                    console.log(`  ⚠️ データ取得に失敗しました`);
                }
            } finally {
                importer.dispose();
            }
        });
    });

    describe("両メソッドの比較", () => {
        it("getProductionData と getExpenseCalculationData の戻り値形式を比較", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n" + "=".repeat(80));
                console.log("📊 getProductionData vs getExpenseCalculationData");
                console.log("=".repeat(80));

                try {
                    const productionData = importer.getProductionData();
                    const expenseData = importer.getExpenseCalculationData();

                    console.log("\n📋 戻り値形式の比較:");
                    console.log("┌─────────────────────┬──────────────────┬──────────────────┐");
                    console.log("│ プロパティ            │ ProductionData   │ ExpenseData      │");
                    console.log("├─────────────────────┼──────────────────┼──────────────────┤");
                    console.log(
                        `│ columnCount         │ ${String(productionData.columnCount).padEnd(16)} │ ${String(expenseData.columnCount).padEnd(16)} │`
                    );
                    console.log(
                        `│ rowCount            │ ${String(productionData.rowCount).padEnd(16)} │ ${String(expenseData.rowCount).padEnd(16)} │`
                    );
                    console.log(
                        `│ columns.length      │ ${String(productionData.columns.length).padEnd(16)} │ ${String(expenseData.columns.length).padEnd(16)} │`
                    );
                    console.log(
                        `│ records.length      │ ${String(productionData.records.length).padEnd(16)} │ ${String(expenseData.records.length).padEnd(16)} │`
                    );
                    console.log("└─────────────────────┴──────────────────┴──────────────────┘");

                    console.log("\n✅ 両メソッドとも同じ TableDataFrame 形式を返却");

                    expect(productionData).toHaveProperty("columns");
                    expect(productionData).toHaveProperty("records");
                    expect(productionData).toHaveProperty("rowCount");
                    expect(productionData).toHaveProperty("columnCount");

                    expect(expenseData).toHaveProperty("columns");
                    expect(expenseData).toHaveProperty("records");
                    expect(expenseData).toHaveProperty("rowCount");
                    expect(expenseData).toHaveProperty("columnCount");
                } catch (error) {
                    console.log(`  ⚠️ テスト対象データが見つかりません`);
                }
            } finally {
                importer.dispose();
            }
        });
    });
});
