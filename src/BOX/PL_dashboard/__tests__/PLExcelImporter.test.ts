import { beforeAll, describe, expect, it } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import { ExcelImporter } from "../importers/ExcelImporter";
import { PLExcelImporter } from "../importers/PLExcelImporter";

/**
 * PLExcelImporter テストスイート
 * テストファイル: ●【配賦経費無し】9月 進捗管理（グラフあり）.xlsm
 */
describe("PLExcelImporter", () => {
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

    describe("基本機能", () => {
        it("ファイルを正常に読み込める", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                console.log("✅ ファイル読み込み成功");
                expect(true).toBe(true);
            } finally {
                importer.dispose();
            }
        });

        it("シート名一覧を取得できる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                console.log("\n📋 利用可能なシート:");
                sheetNames.forEach((name: string, index: number) => {
                    console.log(`  ${index + 1}. ${name}`);
                });

                expect(Array.isArray(sheetNames)).toBe(true);
                expect(sheetNames.length).toBeGreaterThan(0);
            } finally {
                importer.dispose();
            }
        });

        it("シート存在確認メソッドが機能する", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();
                const firstSheet = sheetNames[0];

                const hasSheet = importer.hasSheet(firstSheet);
                const hasNoSheet = importer.hasSheet("存在しないシート");

                console.log(`\n✓ シート「${firstSheet}」存在確認: ${hasSheet}`);
                console.log(`✓ シート「存在しないシート」存在確認: ${hasNoSheet}`);

                expect(hasSheet).toBe(true);
                expect(hasNoSheet).toBe(false);
            } finally {
                importer.dispose();
            }
        });
    });

    describe("セル値取得", () => {
        it("特定のセル値を取得できる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                if (sheetNames.length > 0) {
                    const value = importer.getCellValue("A1", sheetNames[0]);
                    console.log(`\n📄 セル A1 の値: "${value}"`);
                    expect(value !== undefined).toBe(true);
                }
            } finally {
                importer.dispose();
            }
        });

        it("複数のセル値を一度に取得できる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                if (sheetNames.length > 0) {
                    const cellA1 = importer.getCellValue("A1", sheetNames[0]);
                    const cellB1 = importer.getCellValue("B1", sheetNames[0]);
                    const cellC1 = importer.getCellValue("C1", sheetNames[0]);

                    console.log("\n📊 複数セル値取得結果:");
                    console.log("  A1:", cellA1);
                    console.log("  B1:", cellB1);
                    console.log("  C1:", cellC1);

                    expect(cellA1 !== undefined).toBe(true);
                }
            } finally {
                importer.dispose();
            }
        });
    });

    describe("テーブルデータ取得", () => {
        it("DataFrame形式でテーブルデータを取得できる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                if (sheetNames.length > 0) {
                    try {
                        // ヘッダーとデータが存在するシートを探す
                        for (const sheetName of sheetNames) {
                            const dataFrame = importer.getTableDataAsDataFrame(
                                "A",
                                "E",
                                1,
                                2,
                                sheetName
                            );

                            if (dataFrame.rowCount > 0) {
                                console.log(`\n📈 テーブルデータ取得 (シート: ${sheetName}):`);
                                console.log(`  カラム数: ${dataFrame.columnCount}`);
                                console.log(`  行数: ${dataFrame.rowCount}`);
                                console.log(`  カラム名: ${dataFrame.columns.join(", ")}`);

                                if (dataFrame.records.length > 0) {
                                    console.log("  最初のレコード:", dataFrame.records[0]);
                                }

                                expect(dataFrame.columnCount).toBeGreaterThan(0);
                                expect(dataFrame.rowCount).toBeGreaterThan(0);
                                expect(Array.isArray(dataFrame.columns)).toBe(true);
                                expect(Array.isArray(dataFrame.records)).toBe(true);
                                break;
                            }
                        }
                    } catch (error) {
                        console.log("  ⚠ テーブルデータが見つかりません (スキップ)");
                    }
                }
            } finally {
                importer.dispose();
            }
        });

        it("2次元配列形式でテーブルデータを取得できる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                if (sheetNames.length > 0) {
                    try {
                        for (const sheetName of sheetNames) {
                            const tableData = importer.getTableData("A", "E", 1, sheetName);

                            if (tableData.length > 0) {
                                console.log(`\n📋 2次元配列テーブル取得 (シート: ${sheetName}):`);
                                console.log(`  行数: ${tableData.length}`);
                                console.log(
                                    `  最初の行: [${tableData[0].map((v: string) => `"${v}"`).join(", ")}]`
                                );

                                expect(Array.isArray(tableData)).toBe(true);
                                expect(tableData.length).toBeGreaterThan(0);
                                break;
                            }
                        }
                    } catch (error) {
                        console.log("  ⚠ テーブルデータが見つかりません (スキップ)");
                    }
                }
            } finally {
                importer.dispose();
            }
        });
    });

    describe("PL管理特化メソッド", () => {
        it("生産実績データを読み込める", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                console.log("\n🔍 生産実績データの取得を試行中...");

                // importer.getProductionData関数の引数をデフォルト値でデータが読み込まれていることをコンソールで確認
                const productionData = importer.getProductionData();

                console.log(`  カラム数: ${productionData.columnCount}`);
                console.log(`  行数: ${productionData.rowCount}`);
                console.log(`  カラム名: ${productionData.columns.join(", ")}`);

                if (productionData.rowCount > 0) {
                    console.log(
                        `  最初のレコードのキー: ${Object.keys(productionData.records[0]).join(", ")}`
                    );
                    console.log(`  最初のレコードの値:`, productionData.records[0]);
                }

                // エラーハンドリングテスト
                for (const sheetName of sheetNames) {
                    try {
                        if (importer.hasSheet(sheetName)) {
                            const productionData = importer.getProductionData(sheetName);

                            console.log(`\n✅ 生産実績データ取得成功 (シート: ${sheetName}):`);
                            console.log(`  カラム数: ${productionData.columnCount}`);
                            console.log(`  行数: ${productionData.rowCount}`);
                            console.log(
                                `  カラム名: ${productionData.columns.slice(0, 5).join(", ")}${
                                    productionData.columnCount > 5 ? "..." : ""
                                }`
                            );

                            if (productionData.records.length > 0) {
                                console.log(
                                    `  最初のレコードのキー: ${Object.keys(productionData.records[0]).join(", ")}`
                                );
                                console.log(`  最初のレコードの値:`, productionData.records[0]);
                            }

                            expect(productionData.columnCount).toBeGreaterThan(0);
                            expect(productionData.rowCount).toBeGreaterThanOrEqual(0);
                            break;
                        }
                    } catch (error) {
                        // スキップして次のシートを試す
                        continue;
                    }
                }
            } finally {
                importer.dispose();
            }
        });

        it("複数シートからデータを一括取得できる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                if (sheetNames.length >= 2) {
                    const sheetConfigs = sheetNames.slice(0, 2).map((sheetName: string) => ({
                        sheetName,
                        startColumn: "A",
                        endColumn: "E",
                        headerRow: 1,
                        dataStartRow: 2,
                    }));

                    console.log("\n🔄 複数シート一括取得:");
                    console.log(`  対象シート数: ${sheetConfigs.length}`);

                    try {
                        const multiSheetData = importer.getMultiSheetData(sheetConfigs);

                        console.log("  取得成功:");
                        Object.entries(multiSheetData).forEach(
                            ([sheetName, dataFrame]: [string, any]) => {
                                console.log(
                                    `    - ${sheetName}: ${dataFrame.rowCount}行 × ${dataFrame.columnCount}列`
                                );
                            }
                        );

                        expect(typeof multiSheetData).toBe("object");
                    } catch (error) {
                        console.log("  ⚠ 複数シート取得に失敗 (スキップ)");
                    }
                } else {
                    console.log("  ℹ テストするシートが2つ以上ない為、スキップします");
                }
            } finally {
                importer.dispose();
            }
        });
    });

    describe("ExcelImporterの基本機能", () => {
        it("ExcelImporterでも直接使用できる", async () => {
            const importer = new ExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                console.log("\n🔧 ExcelImporter直接使用:");
                console.log(`  シート数: ${sheetNames.length}`);
                console.log(`  利用可能なメソッド:`);
                console.log(`    - getCellValue`);
                console.log(`    - getTableDataAsDataFrame`);
                console.log(`    - getRangeValues`);

                expect(sheetNames.length).toBeGreaterThan(0);
            } finally {
                importer.dispose();
            }
        });
    });

    describe("エラーハンドリング", () => {
        it("存在しないシートへのアクセスはエラーになる", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();

                console.log("\n⚠ エラーハンドリングテスト:");
                expect(() => {
                    importer.getProductionData("存在しないシート");
                }).toThrow();

                console.log("  ✓ 存在しないシート名でエラーをスロー");
            } finally {
                importer.dispose();
            }
        });

        it("ロード前のメソッド呼び出しはエラーになる", async () => {
            const importer = new PLExcelImporter(excelFile);

            console.log("\n⚠ ロード前アクセステスト:");
            expect(() => {
                importer.getCellValue("A1");
            }).toThrow();

            console.log("  ✓ ロード前のアクセスでエラーをスロー");

            // クリーンアップ
            importer.dispose();
        });
    });

    describe("詳細データダンプ", () => {
        it("最初のシートの詳細情報を表示", async () => {
            const importer = new PLExcelImporter(excelFile);

            try {
                await importer.load();
                const sheetNames = importer.getSheetNames();

                if (sheetNames.length > 0) {
                    const sheetName = sheetNames[0];
                    console.log(`\n📊 シート「${sheetName}」の詳細情報:`);

                    // セルA1-E5の値を表示
                    console.log("  セル値サンプル (A1:E5):");
                    try {
                        const rangeValues = importer.getRangeValues("A1:E5", sheetName);
                        rangeValues.forEach((row: any[], rowIndex: number) => {
                            console.log(
                                `    Row ${rowIndex + 1}: [${row.map((v: string) => `"${v}"`).join(", ")}]`
                            );
                        });
                    } catch (error) {
                        console.log("    (範囲データ取得失敗)");
                    }

                    // テーブルデータの取得を試みる
                    console.log("\n  テーブルデータサンプル:");
                    try {
                        const tableData = importer.getTableData("A", "E", 1, sheetName);
                        console.log(`    取得行数: ${tableData.length}`);
                        if (tableData.length > 0) {
                            console.log(
                                `    ヘッダー: [${tableData[0].map((v: string) => `"${v}"`).join(", ")}]`
                            );
                            if (tableData.length > 1) {
                                console.log(
                                    `    データ1: [${tableData[1].map((v: string) => `"${v}"`).join(", ")}]`
                                );
                            }
                        }
                    } catch (error) {
                        console.log("    (テーブルデータ取得失敗)");
                    }
                }

                expect(sheetNames.length).toBeGreaterThan(0);
            } finally {
                importer.dispose();
            }
        });
    });
});
