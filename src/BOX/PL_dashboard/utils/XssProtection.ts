/**
 * XSS対策ユーティリティ
 * テキストコンテンツのエスケープとHTMLサニタイズを行う
 */

import type { Config } from "dompurify";
import DOMPurify from "dompurify";
import { Logger } from "../../../utils/Logger";

/**
 * HTMLエスケープマップ
 * 危険な文字をHTMLエンティティに変換
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
};

/**
 * XSS対策ユーティリティクラス
 */
export class XssProtection {
    /**
     * テキストコンテンツをHTMLエスケープする
     * textContentで使用する前にエスケープする必要はないが、
     * 他の用途（属性値など）で使用する場合に有効
     *
     *
     * @example
     * ```typescript
     * const userInput = "<script>alert('XSS')</script>";
     * const safe = XssProtection.escapeHtml(userInput);
     * // 結果: "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;&#x2F;script&gt;"
     * ```
     */
    static escapeHtml(text: string | number | null | undefined): string {
        if (text === null || text === undefined) {
            return "";
        }

        const textStr = String(text);
        return textStr.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
    }

    /**
     * HTML文字列をサニタイズする（DOMPurifyを使用）
     * innerHTMLに設定する前に必ず使用すること
     *
     * DOMPurifyのオプションを指定可能（オプション）
     *
     * @example
     * ```typescript
     * const userInput = "<div>Hello <script>alert('XSS')</script></div>";
     * const safe = XssProtection.sanitizeHtml(userInput);
     * // 結果: "<div>Hello </div>"（scriptタグが削除される）
     * ```
     */
    static sanitizeHtml(html: string, options?: Config): string {
        if (!html) {
            return "";
        }

        try {
            // DOMPurifyのデフォルト設定
            const defaultOptions: Config = {
                ALLOWED_TAGS: [
                    "div",
                    "span",
                    "p",
                    "br",
                    "strong",
                    "em",
                    "u",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "ul",
                    "ol",
                    "li",
                    "a",
                    "img",
                    "table",
                    "thead",
                    "tbody",
                    "tr",
                    "th",
                    "td",
                ],
                ALLOWED_ATTR: ["class", "id", "style", "href", "src", "alt", "title"],
                ALLOW_DATA_ATTR: false,
                KEEP_CONTENT: true,
            };

            const finalOptions = { ...defaultOptions, ...options };
            return DOMPurify.sanitize(html, finalOptions) as string;
        } catch (error) {
            Logger.error("HTMLサニタイズでエラーが発生しました", error);
            // エラーが発生した場合は、エスケープのみ実行
            return this.escapeHtml(html);
        }
    }

    /**
     * 属性値として使用するテキストをエスケープする
     * HTML属性に設定する前に使用すること
     *
     *
     * @example
     * ```typescript
     * const userInput = '"><script>alert("XSS")</script>';
     * const safe = XssProtection.escapeAttribute(userInput);
     * element.setAttribute("data-value", safe);
     * ```
     */
    static escapeAttribute(text: string | number | null | undefined): string {
        if (text === null || text === undefined) {
            return "";
        }

        const textStr = String(text);
        // 属性値では特に " と ' をエスケープ
        return textStr
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;");
    }

    /**
     * URLを検証・サニタイズする
     * href属性などに設定する前に使用すること
     *
     * 許可されるプロトコルを指定可能（デフォルト: ["http", "https", "mailto"]）
     * 無効な場合は空文字列を返す
     *
     * @example
     * ```typescript
     * const userInput = "javascript:alert('XSS')";
     * const safe = XssProtection.sanitizeUrl(userInput);
     * // 結果: ""（javascript:プロトコルは許可されない）
     * ```
     */
    static sanitizeUrl(
        url: string,
        allowedProtocols: string[] = ["http", "https", "mailto"]
    ): string {
        if (!url) {
            return "";
        }

        try {
            // URLの検証
            const urlObj = new URL(url, window.location.href);
            const protocol = urlObj.protocol.replace(":", "");

            if (!allowedProtocols.includes(protocol)) {
                Logger.warn(`許可されていないプロトコル: ${protocol}`, { url });
                return "";
            }

            return urlObj.href;
        } catch {
            // 相対URLの場合はそのまま返す（ただし、javascript:などの危険な文字列はチェック）
            if (url.toLowerCase().startsWith("javascript:")) {
                Logger.warn("javascript:プロトコルは許可されていません", { url });
                return "";
            }

            // その他の相対URLは許可（ただし、危険な文字列が含まれていないかチェック）
            const dangerousPatterns = [
                /javascript:/i,
                /data:text\/html/i,
                /vbscript:/i,
                /on\w+\s*=/i, // onclick=, onerror= など
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(url)) {
                    Logger.warn("危険なURLパターンが検出されました", { url, pattern });
                    return "";
                }
            }

            return url;
        }
    }

    /**
     * テキストコンテンツを安全に設定する
     * textContentを使用するためのヘルパー関数
     * （textContentは自動的にエスケープされるため、この関数は主にログ用）
     *
     */
    static setTextContent(element: HTMLElement, text: string | number | null | undefined): void {
        // textContentは自動的にエスケープされるため、そのまま設定
        element.textContent = text === null || text === undefined ? "" : String(text);
    }

    /**
     * HTMLコンテンツを安全に設定する
     * innerHTMLに設定する前にサニタイズを実行
     *
     * DOMPurifyのオプションを指定可能（オプション）
     */
    static setInnerHtml(element: HTMLElement, html: string, options?: Config): void {
        const sanitized = this.sanitizeHtml(html, options);
        element.innerHTML = sanitized;
    }
}
