/**
 * テスト環境のセットアップ
 * kintone、jQuery、Chart.jsなどのモックを設定
 */

import { mockKintone } from "./kintone";

// kintoneモックを設定
if (typeof global !== "undefined") {
    (global as any).kintone = mockKintone;
}

if (typeof window !== "undefined") {
    (window as any).kintone = mockKintone;
}

// jQueryモック
const mockJQuery = jest.fn((selector?: string) => {
    const elements = selector
        ? Array.from(document.querySelectorAll(selector))
        : [];
    const jqObject = Object.assign(elements, {
        length: elements.length,
        DataTable: jest.fn(() => ({
            clear: jest.fn().mockReturnThis(),
            rows: {
                add: jest.fn().mockReturnThis(),
            },
            draw: jest.fn().mockReturnThis(),
            destroy: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
        })),
        on: jest.fn(),
        off: jest.fn(),
        click: jest.fn(),
        change: jest.fn(),
        append: jest.fn().mockReturnThis(),
        appendTo: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        empty: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        val: jest.fn(),
        attr: jest.fn(),
        removeAttr: jest.fn(),
        addClass: jest.fn().mockReturnThis(),
        removeClass: jest.fn().mockReturnThis(),
        hasClass: jest.fn().mockReturnValue(false),
        css: jest.fn().mockReturnThis(),
        show: jest.fn().mockReturnThis(),
        hide: jest.fn().mockReturnThis(),
        find: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
    });

    (mockJQuery as any).fn = {
        DataTable: {
            isDataTable: jest.fn().mockReturnValue(false),
        },
    };

    return jqObject;
});

(mockJQuery as any).fn = {
    DataTable: {
        isDataTable: jest.fn().mockReturnValue(false),
    },
};

if (typeof global !== "undefined") {
    (global as any).$ = mockJQuery;
    (global as any).jQuery = mockJQuery;
}

if (typeof window !== "undefined") {
    (window as any).$ = mockJQuery;
    (window as any).jQuery = mockJQuery;
}

// Chart.jsモック
const mockChart = jest.fn().mockImplementation((ctx, config) => {
    return {
        destroy: jest.fn(),
        update: jest.fn(),
        render: jest.fn(),
        reset: jest.fn(),
        toBase64Image: jest.fn().mockReturnValue("data:image/png;base64,"),
        canvas: ctx,
        config,
    };
});

if (typeof global !== "undefined") {
    (global as any).Chart = mockChart;
}

if (typeof window !== "undefined") {
    (window as any).Chart = mockChart;
}

// DOMPurifyモック
const mockDOMPurify = {
    sanitize: jest.fn((html: string) => html),
    isSupported: true,
};

if (typeof global !== "undefined") {
    (global as any).DOMPurify = mockDOMPurify;
}

export { mockKintone, mockJQuery, mockChart, mockDOMPurify };

