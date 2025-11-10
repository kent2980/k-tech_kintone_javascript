/**
 * Jest テストセットアップファイル
 * 全テストファイル実行前に実行される設定
 */

// kintone環境のモック
const mockKintone = {
    api: {
        url: () => "/k/v1/records.json",
    },
    app: {
        getId: () => 1,
        getHeaderSpaceElement: () => document.createElement("div"),
    },
    events: {
        on: () => {},
    },
};

// jQuery環境のモック
const mockJQuery = () => ({
    DataTable: () => ({
        destroy: () => {},
    }),
});
(mockJQuery as any).fn = {
    DataTable: {
        isDataTable: () => false,
    },
};

// pdfMake環境のモック
const mockPdfMake = {
    fonts: {},
};

// グローバル変数として設定
(global as any).kintone = mockKintone;
(global as any).jQuery = mockJQuery;
(global as any).$ = mockJQuery;
(global as any).pdfMake = mockPdfMake;

// kintoneフィールド型のモック
(global as any).daily = {};
(global as any).line_daily = {};
(global as any).monthly = {};
(global as any).model_master = {};

// DOM操作のモック
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
    }),
});
