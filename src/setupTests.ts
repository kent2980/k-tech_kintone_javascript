/**
 * Jest テスト環境のセットアップ
 * kintone、jQuery、Chart.jsなどのモックを設定
 */

import { mockKintone, mockJQuery, mockChart, mockDOMPurify } from "./BOX/PL_dashboard/__mocks__/setup";

// kintoneモックを設定
(global as any).kintone = mockKintone;
if (typeof window !== "undefined") {
    (window as any).kintone = mockKintone;
}

// jQueryモックを設定
(global as any).$ = mockJQuery;
(global as any).jQuery = mockJQuery;
if (typeof window !== "undefined") {
    (window as any).$ = mockJQuery;
    (window as any).jQuery = mockJQuery;
}

// Chart.jsモックを設定
(global as any).Chart = mockChart;
if (typeof window !== "undefined") {
    (window as any).Chart = mockChart;
}

// DOMPurifyモックを設定
(global as any).DOMPurify = mockDOMPurify;
if (typeof window !== "undefined") {
    (window as any).DOMPurify = mockDOMPurify;
}

// グローバルログの抑制（必要に応じて）
// (global as any).console = global.console;

export {};
