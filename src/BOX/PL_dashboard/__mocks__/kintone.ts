/**
 * kintone APIモック
 * テスト環境でkintone APIをモック化する
 */

/**
 * kintone APIレスポンスのモック
 */
export const mockKintoneApiResponse = {
    records: [],
    totalCount: 0,
};

/**
 * kintone APIエラーのモック
 */
export const mockKintoneApiError = {
    message: "kintone API error",
    id: "CB_AU01",
    code: "GAIA_IL23",
};

/**
 * kintone APIのモック実装
 */
export const mockKintoneApi = {
    url: jest.fn((path: string, detectGuestSpace?: boolean) => {
        return `https://example.cybozu.com${path}`;
    }),
    get: jest.fn().mockResolvedValue(mockKintoneApiResponse),
    post: jest.fn().mockResolvedValue(mockKintoneApiResponse),
    put: jest.fn().mockResolvedValue(mockKintoneApiResponse),
    delete: jest.fn().mockResolvedValue(mockKintoneApiResponse),
    /**
     * バッチリクエスト用のモック
     */
    batch: jest.fn().mockResolvedValue({
        results: [mockKintoneApiResponse],
    }),
};

/**
 * kintoneグローバルオブジェクトのモック
 */
export const mockKintone = {
    api: mockKintoneApi,
    app: {
        getId: jest.fn().mockReturnValue(1),
        getHeaderSpaceElement: jest.fn().mockReturnValue(document.createElement("div")),
        getRelatedRecordsTargetAppId: jest.fn().mockReturnValue(1),
        getLookupTargetAppId: jest.fn().mockReturnValue(1),
    },
    events: {
        on: jest.fn(),
        off: jest.fn(),
    },
    proxy: {
        upload: jest.fn().mockResolvedValue({ fileKey: "test-file-key" }),
        download: jest.fn().mockResolvedValue(new Blob()),
    },
    /**
     * レコード取得用のモック
     */
    record: {
        get: jest.fn().mockResolvedValue({ record: {} }),
        set: jest.fn(),
    },
};

// グローバルにkintoneを設定
if (typeof global !== "undefined") {
    (global as any).kintone = mockKintone;
}

if (typeof window !== "undefined") {
    (window as any).kintone = mockKintone;
}

export default mockKintone;

