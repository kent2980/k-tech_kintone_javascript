/**
 * XssProtectionのユニットテスト
 */

import { XssProtection } from "../XssProtection";

// DOMPurifyをモック
jest.mock("dompurify", () => {
    const mockSanitize = jest.fn((html: string) => {
        // 簡単なサニタイズ（scriptタグを削除）
        return html.replace(/<script[^>]*>.*?<\/script>/gi, "");
    });

    return {
        __esModule: true,
        default: {
            sanitize: mockSanitize,
            isSupported: true,
        },
    };
});

describe("XssProtection", () => {
    describe("escapeHtml", () => {
        test("危険な文字をHTMLエンティティに変換", () => {
            const input = '<script>alert("XSS")</script>';
            const result = XssProtection.escapeHtml(input);

            expect(result).toContain("&lt;");
            expect(result).toContain("&gt;");
            expect(result).toContain("&quot;");
            expect(result).not.toContain("<script>");
        });

        test("nullとundefinedを空文字列に変換", () => {
            expect(XssProtection.escapeHtml(null)).toBe("");
            expect(XssProtection.escapeHtml(undefined)).toBe("");
        });

        test("数値を文字列に変換してエスケープ", () => {
            const result = XssProtection.escapeHtml(123);
            expect(result).toBe("123");
        });
    });

    describe("sanitizeHtml", () => {
        test("scriptタグを削除", () => {
            const input = '<div>Hello <script>alert("XSS")</script></div>';
            const result = XssProtection.sanitizeHtml(input);

            expect(result).not.toContain("<script>");
            expect(result).toContain("Hello");
        });

        test("許可されたタグは保持", () => {
            const input = "<div><p>Test</p><strong>Bold</strong></div>";
            const result = XssProtection.sanitizeHtml(input);

            expect(result).toContain("<div>");
            expect(result).toContain("<p>");
            expect(result).toContain("<strong>");
        });

        test("空文字列の場合は空文字列を返す", () => {
            expect(XssProtection.sanitizeHtml("")).toBe("");
        });
    });

    describe("escapeAttribute", () => {
        test("属性値として使用するテキストをエスケープ", () => {
            const input = '"><script>alert("XSS")</script>';
            const result = XssProtection.escapeAttribute(input);

            expect(result).toContain("&quot;");
            expect(result).toContain("&lt;");
            expect(result).toContain("&gt;");
        });

        test("nullとundefinedを空文字列に変換", () => {
            expect(XssProtection.escapeAttribute(null)).toBe("");
            expect(XssProtection.escapeAttribute(undefined)).toBe("");
        });
    });

    describe("sanitizeUrl", () => {
        test("javascript:プロトコルを拒否", () => {
            const input = 'javascript:alert("XSS")';
            const result = XssProtection.sanitizeUrl(input);

            expect(result).toBe("");
        });

        test("httpプロトコルを許可", () => {
            const input = "http://example.com";
            const result = XssProtection.sanitizeUrl(input);

            expect(result).toBe("http://example.com/");
        });

        test("httpsプロトコルを許可", () => {
            const input = "https://example.com";
            const result = XssProtection.sanitizeUrl(input);

            expect(result).toBe("https://example.com/");
        });

        test("mailtoプロトコルを許可", () => {
            const input = "mailto:test@example.com";
            const result = XssProtection.sanitizeUrl(input);

            expect(result).toBe("mailto:test@example.com");
        });

        test("data:text/htmlプロトコルを拒否", () => {
            const input = 'data:text/html,<script>alert("XSS")</script>';
            const result = XssProtection.sanitizeUrl(input);

            expect(result).toBe("");
        });

        test("相対URLは許可（危険なパターンがない場合）", () => {
            const input = "/path/to/page";
            const result = XssProtection.sanitizeUrl(input);

            // 相対URLはベースURLと結合される（Jest環境ではhttps://example.cybozu.comがベースURL）
            expect(result).toBe("https://example.cybozu.com/path/to/page");
        });

        test("空文字列の場合は空文字列を返す", () => {
            expect(XssProtection.sanitizeUrl("")).toBe("");
        });
    });

    describe("setTextContent", () => {
        test("textContentに安全に設定", () => {
            const element = document.createElement("div");
            XssProtection.setTextContent(element, '<script>alert("XSS")</script>');

            // textContentは自動的にエスケープされるため、そのまま表示される
            expect(element.textContent).toBe('<script>alert("XSS")</script>');
        });

        test("nullとundefinedを空文字列に設定", () => {
            const element = document.createElement("div");
            XssProtection.setTextContent(element, null);
            expect(element.textContent).toBe("");

            XssProtection.setTextContent(element, undefined);
            expect(element.textContent).toBe("");
        });
    });

    describe("setInnerHtml", () => {
        test("innerHTMLにサニタイズして設定", () => {
            const element = document.createElement("div");
            XssProtection.setInnerHtml(element, '<div>Hello <script>alert("XSS")</script></div>');

            expect(element.innerHTML).not.toContain("<script>");
            expect(element.innerHTML).toContain("Hello");
        });

        test("許可されたタグは保持", () => {
            const element = document.createElement("div");
            XssProtection.setInnerHtml(element, "<div><p>Test</p></div>");

            expect(element.innerHTML).toContain("<div>");
            expect(element.innerHTML).toContain("<p>");
        });
    });
});
