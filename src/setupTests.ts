/**
 * Jest テスト環境のセットアップ
 * kintone、jQuery、Chart.jsなどのモックを設定
 */

import {
    mockKintone,
    mockJQuery,
    mockChart,
    mockDOMPurify,
} from "./BOX/PL_dashboard/__mocks__/setup";

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

// Performance APIをモック
// Jest環境では、各テストファイルが実行される前に必ず初期化される
// setupFilesAfterEnvで指定されたファイルは、各テストファイルの前に実行される
const mockPerformance = {
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
};

// グローバルスコープに設定（PerformanceUtilが直接参照するため）
// すべての環境で確実に設定
if (typeof global !== "undefined") {
    (global as any).performance = mockPerformance;
}

if (typeof window !== "undefined") {
    (window as any).performance = mockPerformance;
}

if (typeof globalThis !== "undefined") {
    (globalThis as any).performance = mockPerformance;
}

// グローバル変数としても設定（Node.js環境で直接参照される場合）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).performance = mockPerformance;

// Canvas APIをモック
// jsdom環境ではHTMLCanvasElement.prototype.getContextが実装されていないため、モックを設定
if (typeof HTMLCanvasElement !== "undefined") {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    (HTMLCanvasElement.prototype as any).getContext = function (
        contextId: string,
        ...args: unknown[]
    ): any {
        if (contextId === "2d") {
            // 2Dコンテキストをモック
            return {
                canvas: this,
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                fillText: jest.fn(),
                strokeText: jest.fn(),
                measureText: jest.fn(() => ({
                    width: 0,
                    actualBoundingBoxAscent: 0,
                    actualBoundingBoxDescent: 0,
                    actualBoundingBoxLeft: 0,
                    actualBoundingBoxRight: 0,
                    alphabeticBaseline: 0,
                    emHeightAscent: 0,
                    emHeightDescent: 0,
                    fontBoundingBoxAscent: 0,
                    fontBoundingBoxDescent: 0,
                    hangingBaseline: 0,
                    ideographicBaseline: 0,
                })),
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
                font: "10px sans-serif",
                textAlign: "start",
                textBaseline: "alphabetic",
                save: jest.fn(),
                restore: jest.fn(),
                beginPath: jest.fn(),
                closePath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                arc: jest.fn(),
                arcTo: jest.fn(),
                bezierCurveTo: jest.fn(),
                quadraticCurveTo: jest.fn(),
                rect: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                clip: jest.fn(),
                isPointInPath: jest.fn(() => false),
                isPointInStroke: jest.fn(() => false),
                rotate: jest.fn(),
                scale: jest.fn(),
                translate: jest.fn(),
                transform: jest.fn(),
                setTransform: jest.fn(),
                getImageData: jest.fn(() => ({
                    data: new Uint8ClampedArray(4),
                    width: 1,
                    height: 1,
                })),
                putImageData: jest.fn(),
                createImageData: jest.fn(() => ({
                    data: new Uint8ClampedArray(4),
                    width: 1,
                    height: 1,
                })),
                drawImage: jest.fn(),
                createLinearGradient: jest.fn(() => ({
                    addColorStop: jest.fn(),
                })),
                createRadialGradient: jest.fn(() => ({
                    addColorStop: jest.fn(),
                })),
                createPattern: jest.fn(),
                globalAlpha: 1,
                globalCompositeOperation: "source-over",
                imageSmoothingEnabled: true,
                imageSmoothingQuality: "low",
                shadowBlur: 0,
                shadowColor: "rgba(0, 0, 0, 0)",
                shadowOffsetX: 0,
                shadowOffsetY: 0,
            } as any;
        }
        // その他のコンテキストタイプの場合は元の実装を呼び出す（存在する場合）
        if (originalGetContext) {
            return originalGetContext.call(this, contextId as any, ...args);
        }
        return null;
    };
}

// グローバルログの抑制（必要に応じて）
// (global as any).console = global.console;

export {};
