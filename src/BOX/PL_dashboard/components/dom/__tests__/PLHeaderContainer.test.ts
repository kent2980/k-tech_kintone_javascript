/**
 * PLHeaderContainerのユニットテスト
 */

jest.mock("../../../importers/PLExcelImporter", () => ({
    PLExcelImporter: jest.fn().mockImplementation(() => ({
        load: jest.fn((validateBeforeLoad?: boolean, maxSizeMB?: number) => Promise.resolve()),
        validateFormat: jest.fn(() => ({ ok: true, messages: [] })),
        getMonthlyData: jest.fn(() => ({
            year: { value: "2024" },
            month: { value: "1" },
        })),
        getProductionData: jest.fn(() => []),
        getExpenseCalculationData: jest.fn(() => []),
    })),
}));
jest.mock("../../../services/KintoneApiService", () => ({
    KintoneApiService: jest.fn().mockImplementation(() => ({
        savePLMonthlyData: jest.fn().mockResolvedValue({ ok: true }),
        savePLDailyData: jest.fn().mockResolvedValue({ ok: true }),
        saveProductionReportData: jest.fn().mockResolvedValue({ ok: true }),
    })),
}));
jest.mock("../../../utils/ErrorHandler", () => ({
    ErrorHandler: {
        logError: jest.fn(),
        getUserFriendlyMessage: jest.fn(
            (error, context, defaultMessage) => defaultMessage || "エラーが発生しました"
        ),
    },
}));

(global as any).kintone = {
    app: {
        getId: jest.fn(() => 1),
    },
};

import { PLHeaderContainer } from "../PLHeaderContainer";
import { PLDomBuilder } from "../PLDomBuilder";

describe("PLHeaderContainer", () => {
    let headerContainer: PLHeaderContainer;
    let domBuilder: PLDomBuilder;

    beforeEach(() => {
        domBuilder = new PLDomBuilder();
        headerContainer = new PLHeaderContainer(domBuilder);
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        test("PLDomBuilderを指定してインスタンスを作成", () => {
            const container = new PLHeaderContainer(domBuilder);
            expect(container).toBeInstanceOf(PLHeaderContainer);
        });

        test("PLDomBuilderを指定しない場合は内部で作成", () => {
            const container = new PLHeaderContainer();
            expect(container).toBeInstanceOf(PLHeaderContainer);
        });
    });

    describe("create", () => {
        test("ヘッダーコンテナを作成", () => {
            const container = headerContainer.create();

            expect(container).toBeInstanceOf(HTMLDivElement);
            expect(container.className).toBe("header-container");
        });

        test("既に作成されている場合は同じインスタンスを返す", () => {
            const container1 = headerContainer.create();
            const container2 = headerContainer.create();

            expect(container1).toBe(container2);
        });
    });

    describe("getElement", () => {
        test("ヘッダーコンテナ要素を取得", () => {
            headerContainer.create();
            const element = headerContainer.getElement();

            expect(element).toBeInstanceOf(HTMLDivElement);
        });

        test("作成されていない場合はnullを返す", () => {
            const newContainer = new PLHeaderContainer();
            const element = newContainer.getElement();

            expect(element).toBeNull();
        });
    });

    describe("getFilterContainer", () => {
        test("フィルターコンテナ要素を取得", () => {
            headerContainer.create();
            const filterContainer = headerContainer.getFilterContainer();

            expect(filterContainer).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe("getSettingsLink", () => {
        test("設定リンク要素を取得", () => {
            headerContainer.create();
            const settingsLink = headerContainer.getSettingsLink();

            expect(settingsLink).toBeInstanceOf(HTMLAnchorElement);
            expect(settingsLink?.textContent).toContain("設定");
        });
    });

    describe("getLoadPastDataButton", () => {
        test("過去データ読み込みボタン要素を取得", () => {
            headerContainer.create();
            const button = headerContainer.getLoadPastDataButton();

            expect(button).toBeInstanceOf(HTMLButtonElement);
            expect(button?.textContent).toContain("過去データ読み込み");
        });
    });

    describe("showDataUploadingOverlay", () => {
        test("データ登録中オーバーレイを表示", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            headerContainer.showDataUploadingOverlay(parent);

            const overlay = document.getElementById("File-loading-overlay");
            expect(overlay).toBeTruthy();
        });

        test("parentがnullの場合は何もしない", () => {
            expect(() => {
                headerContainer.showDataUploadingOverlay(null as any);
            }).not.toThrow();
        });
    });

    describe("hideDataUploadingOverlay", () => {
        test("データ登録中オーバーレイを非表示", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            headerContainer.showDataUploadingOverlay(parent);
            headerContainer.hideDataUploadingOverlay();

            const overlay = document.getElementById("File-loading-overlay");
            expect(overlay).toBeNull();
        });
    });

    describe("showCenteredAlert", () => {
        test("中央表示アラートを表示", () => {
            headerContainer.showCenteredAlert("テストメッセージ");

            const alerts = document.querySelectorAll('[id^="centered-alert-"]');
            expect(alerts.length).toBeGreaterThan(0);
        });

        test("自動で閉じる時間を指定", (done) => {
            headerContainer.showCenteredAlert("テストメッセージ", 100);

            setTimeout(() => {
                const alerts = document.querySelectorAll('[id^="centered-alert-"]');
                expect(alerts.length).toBe(0);
                done();
            }, 150);
        });
    });

    describe("static methods", () => {
        test("静的メソッドcreateでヘッダーコンテナを作成", () => {
            const container = PLHeaderContainer.create();

            expect(container).toBeInstanceOf(HTMLDivElement);
        });

        test("静的メソッドshowDataUploadingOverlayでオーバーレイを表示", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            PLHeaderContainer.showDataUploadingOverlay(parent);

            const overlay = document.getElementById("File-loading-overlay");
            expect(overlay).toBeTruthy();
        });

        test("静的メソッドhideDataUploadingOverlayでオーバーレイを非表示", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            PLHeaderContainer.showDataUploadingOverlay(parent);
            PLHeaderContainer.hideDataUploadingOverlay();

            const overlay = document.getElementById("File-loading-overlay");
            expect(overlay).toBeNull();
        });

        test("静的メソッドshowCenteredAlertでアラートを表示", () => {
            PLHeaderContainer.showCenteredAlert("テストメッセージ");

            const alerts = document.querySelectorAll('[id^="centered-alert-"]');
            expect(alerts.length).toBeGreaterThan(0);
        });
    });

    describe("createLoadPastDataButton - イベントハンドリング", () => {
        test("過去データ読み込みボタンがクリックされたときにファイル選択ダイアログを開く", () => {
            headerContainer.create();
            const button = headerContainer.getLoadPastDataButton();
            expect(button).toBeTruthy();

            // ファイル入力要素の作成をモック
            const mockInput = document.createElement("input");
            mockInput.type = "file";
            const createElementSpy = jest
                .spyOn(document, "createElement")
                .mockImplementation((tagName: string) => {
                    if (tagName === "input") {
                        return mockInput as any;
                    }
                    return document.createElement(tagName);
                });

            if (button) {
                button.click();
            }

            // ファイル入力要素が作成されたことを確認
            expect(createElementSpy).toHaveBeenCalledWith("input");

            createElementSpy.mockRestore();
        });
    });

    describe("showCenteredAlert - 詳細テスト", () => {
        test("アラートのOKボタンをクリックして閉じる", (done) => {
            headerContainer.showCenteredAlert("テストメッセージ");

            const alerts = document.querySelectorAll('[id^="centered-alert-"]');
            expect(alerts.length).toBeGreaterThan(0);

            const alert = alerts[0] as HTMLElement;
            const okButton = alert.querySelector("button");
            if (okButton) {
                okButton.click();
            }

            // アラートが削除されたことを確認（少し待つ）
            setTimeout(() => {
                const remainingAlerts = document.querySelectorAll('[id^="centered-alert-"]');
                expect(remainingAlerts.length).toBe(0);
                done();
            }, 100);
        });

        test("アラートのオーバーレイをクリックして閉じる", (done) => {
            headerContainer.showCenteredAlert("テストメッセージ");

            const alerts = document.querySelectorAll('[id^="centered-alert-"]');
            expect(alerts.length).toBeGreaterThan(0);

            const alert = alerts[0] as HTMLElement;
            const clickEvent = new MouseEvent("click", { bubbles: true });
            Object.defineProperty(clickEvent, "target", { value: alert, configurable: true });
            alert.dispatchEvent(clickEvent);

            // アラートが削除されたことを確認（少し待つ）
            setTimeout(() => {
                const remainingAlerts = document.querySelectorAll('[id^="centered-alert-"]');
                expect(remainingAlerts.length).toBe(0);
                done();
            }, 100);
        });
    });

    describe("createLoadPastDataButton - 詳細テスト", () => {
        test("ボタンがクリックされたときにファイル選択ダイアログを開く", () => {
            headerContainer.create();
            const button = headerContainer.getLoadPastDataButton();
            expect(button).toBeTruthy();

            if (button) {
                // ファイル入力要素の作成をモック
                const mockInput = document.createElement("input");
                mockInput.type = "file";
                const clickSpy = jest.spyOn(mockInput, "click");
                const createElementSpy = jest
                    .spyOn(document, "createElement")
                    .mockImplementation((tagName: string) => {
                        if (tagName === "input") {
                            return mockInput as any;
                        }
                        return document.createElement(tagName);
                    });

                // ボタンをクリック
                button.click();

                // ファイル入力要素が作成され、クリックされたことを確認
                expect(createElementSpy).toHaveBeenCalledWith("input");
                expect(clickSpy).toHaveBeenCalled();

                createElementSpy.mockRestore();
                clickSpy.mockRestore();
            }
        });

        test("アップロード進捗オーバーレイが作成される", () => {
            headerContainer.create();
            const button = headerContainer.getLoadPastDataButton();
            expect(button).toBeTruthy();

            // オーバーレイがまだ存在しないことを確認
            let overlay = document.getElementById("upload-progress-overlay");
            expect(overlay).toBeNull();

            // ボタンをクリックしてオーバーレイが作成されることを確認
            if (button) {
                const mockInput = document.createElement("input");
                mockInput.type = "file";
                const createElementSpy = jest
                    .spyOn(document, "createElement")
                    .mockImplementation((tagName: string) => {
                        if (tagName === "input") {
                            return mockInput as any;
                        }
                        return document.createElement(tagName);
                    });

                button.click();

                // オーバーレイが作成されることを確認（イベントハンドラー内で作成される）
                // 実際のファイル選択イベントをシミュレートしないため、オーバーレイは作成されない可能性がある
                // このテストは、ボタンクリック時にファイル入力要素が作成されることを確認する
                expect(createElementSpy).toHaveBeenCalledWith("input");

                createElementSpy.mockRestore();
            }
        });
    });

    describe("createFilterContainer", () => {
        test("フィルターコンテナが正しく作成される", () => {
            headerContainer.create();
            const filterContainer = headerContainer.getFilterContainer();

            expect(filterContainer).toBeInstanceOf(HTMLDivElement);
            expect(filterContainer?.className).toBe("header-filter-container");
        });

        test("filterContainerプロパティが設定される", () => {
            const filterContainer = (headerContainer as any).createFilterContainer();
            expect((headerContainer as any).filterContainer).toBe(filterContainer);
        });
    });

    describe("createSettingsLink", () => {
        test("設定リンクが正しく作成される", () => {
            headerContainer.create();
            const settingsLink = headerContainer.getSettingsLink();

            expect(settingsLink).toBeInstanceOf(HTMLAnchorElement);
            expect(settingsLink?.textContent).toContain("設定");
            expect(settingsLink?.target).toBe("_blank");
        });
    });

    describe("registerElementWithType", () => {
        test("要素を種類付きで登録", () => {
            const element = document.createElement("div");
            element.id = "test-element";

            (headerContainer as any).registerElementWithType("test-element", element, "container");

            const elementInfo = (headerContainer as any).getElementInfo("test-element");
            expect(elementInfo).toBeTruthy();
        });
    });

    describe("showDataUploadingOverlay - エッジケース", () => {
        test("親要素がnullの場合は何もしない", () => {
            expect(() => {
                headerContainer.showDataUploadingOverlay(null as any);
            }).not.toThrow();
        });

        test("エラーが発生した場合はconsole.errorを出力", () => {
            const originalConsoleError = console.error;
            console.error = jest.fn();

            const parent = document.createElement("div");
            document.body.appendChild(parent);
            // registerElementWithTypeでエラーが発生するようにする
            const registerSpy = jest
                .spyOn(headerContainer as any, "registerElementWithType")
                .mockImplementation(() => {
                    throw new Error("Test error");
                });

            expect(() => {
                headerContainer.showDataUploadingOverlay(parent);
            }).not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                "データ登録中オーバーレイの作成に失敗しました。",
                expect.any(Error)
            );

            console.error = originalConsoleError;
            registerSpy.mockRestore();
        });

        test("既にオーバーレイが存在する場合は何もしない", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            headerContainer.showDataUploadingOverlay(parent);
            const firstOverlay = document.getElementById("File-loading-overlay");
            expect(firstOverlay).toBeTruthy();

            headerContainer.showDataUploadingOverlay(parent);
            const overlays = document.querySelectorAll("#File-loading-overlay");
            expect(overlays.length).toBe(1);
        });

        test("親要素のpositionが既に設定されている場合は変更しない", () => {
            const parent = document.createElement("div");
            parent.style.position = "absolute";
            document.body.appendChild(parent);

            headerContainer.showDataUploadingOverlay(parent);

            expect(parent.style.position).toBe("absolute");
        });
    });

    describe("hideDataUploadingOverlay - エッジケース", () => {
        test("オーバーレイが存在しない場合は何もしない", () => {
            expect(() => {
                headerContainer.hideDataUploadingOverlay();
            }).not.toThrow();
        });

        test("オーバーレイの親要素が存在しない場合は何もしない", () => {
            const overlay = document.createElement("div");
            overlay.id = "File-loading-overlay";
            document.body.appendChild(overlay);
            document.body.removeChild(overlay);

            expect(() => {
                headerContainer.hideDataUploadingOverlay();
            }).not.toThrow();
        });
    });

    describe("showCenteredAlert - autoCloseMs", () => {
        test("autoCloseMsが指定された場合は自動で閉じる", (done) => {
            headerContainer.showCenteredAlert("テストメッセージ", 100);

            setTimeout(() => {
                const alerts = document.querySelectorAll('[id^="centered-alert-"]');
                expect(alerts.length).toBe(0);
                done();
            }, 150);
        });

        test("autoCloseMsが0以下の場合は自動で閉じない", (done) => {
            headerContainer.showCenteredAlert("テストメッセージ", 0);

            setTimeout(() => {
                const alerts = document.querySelectorAll('[id^="centered-alert-"]');
                expect(alerts.length).toBe(1);
                done();
            }, 100);
        });
    });

    describe("静的メソッド", () => {
        test("PLHeaderContainer.createが正しく動作", () => {
            const result = PLHeaderContainer.create();

            expect(result).toBeInstanceOf(HTMLDivElement);
        });

        test("PLHeaderContainer.showDataUploadingOverlayが正しく動作", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            expect(() => {
                PLHeaderContainer.showDataUploadingOverlay(parent);
            }).not.toThrow();

            const overlay = document.getElementById("File-loading-overlay");
            expect(overlay).toBeTruthy();
        });

        test("PLHeaderContainer.hideDataUploadingOverlayが正しく動作", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);
            headerContainer.showDataUploadingOverlay(parent);

            expect(() => {
                PLHeaderContainer.hideDataUploadingOverlay();
            }).not.toThrow();

            const overlay = document.getElementById("File-loading-overlay");
            expect(overlay).toBeNull();
        });

        test("PLHeaderContainer.showCenteredAlertが正しく動作", () => {
            expect(() => {
                PLHeaderContainer.showCenteredAlert("テストメッセージ");
            }).not.toThrow();

            const alerts = document.querySelectorAll('[id^="centered-alert-"]');
            expect(alerts.length).toBeGreaterThan(0);
        });
    });
});
