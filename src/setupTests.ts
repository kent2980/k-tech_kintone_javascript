// Jest 初期化: テスト環境で必要なグローバルを設定します
// kintone の簡易モック
(global as any).kintone = {};

// 最低限の jQuery スタブを用意（モジュールが存在すればそれを使用）
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jq = require("jquery");
    (global as any).$ = jq;
    (global as any).jQuery = jq;
} catch (e) {
    const jqStub: any = function () {
        return { length: 0 };
    };
    jqStub.fn = {};
    jqStub.fn.DataTable = function () {
        return {
            clear: () => {},
            rows: { add: () => {} },
            draw: () => {},
        };
    };
    (global as any).$ = jqStub;
    (global as any).jQuery = jqStub;
}

// グローバルログの抑制
(global as any).console = global.console;

export {};
