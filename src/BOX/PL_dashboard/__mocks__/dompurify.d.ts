/**
 * DOMPurify型定義（モック用）
 */
declare module "dompurify" {
    export interface Config {
        ALLOWED_TAGS?: string[];
        ALLOWED_ATTR?: string[];
        ALLOW_DATA_ATTR?: boolean;
        KEEP_CONTENT?: boolean;
        [key: string]: unknown;
    }

    export interface DOMPurify {
        sanitize(html: string, config?: Config): string;
        isSupported: boolean;
        setConfig(config: Config): void;
        clearConfig(): void;
        isValidAttribute(tag: string, attr: string, value: string): boolean;
        addHook(hook: string, cb: (currentNode: Node, data: unknown, config: Config) => void): void;
        removeHook(hook: string): void;
        removeAllHooks(): void;
        removeHooks(hook: string): void;
        addTags(tags: string[]): void;
        removeTags(tags: string[]): void;
        addAttrs(attrs: string[]): void;
        removeAttrs(attrs: string[]): void;
        addProtocols(protocols: string[]): void;
        removeProtocols(protocols: string[]): void;
        addAllowedTags(tags: string[]): void;
        removeAllowedTags(tags: string[]): void;
        addAllowedAttrs(attrs: string[]): void;
        removeAllowedAttrs(attrs: string[]): void;
        addAllowedProtocols(protocols: string[]): void;
        removeAllowedProtocols(protocols: string[]): void;
        addAllowedProtocolsByTag(tag: string, protocols: string[]): void;
        removeAllowedProtocolsByTag(tag: string, protocols: string[]): void;
        addAllowedProtocolsByAttr(attr: string, protocols: string[]): void;
        removeAllowedProtocolsByAttr(attr: string, protocols: string[]): void;
        addAllowedProtocolsByTagAndAttr(tag: string, attr: string, protocols: string[]): void;
        removeAllowedProtocolsByTagAndAttr(tag: string, attr: string, protocols: string[]): void;
        addAllowedProtocolsByTagAndAttrAndProtocol(
            tag: string,
            attr: string,
            protocol: string,
            protocols: string[]
        ): void;
        removeAllowedProtocolsByTagAndAttrAndProtocol(
            tag: string,
            attr: string,
            protocol: string,
            protocols: string[]
        ): void;
    }

    const DOMPurify: DOMPurify;
    export default DOMPurify;
}
