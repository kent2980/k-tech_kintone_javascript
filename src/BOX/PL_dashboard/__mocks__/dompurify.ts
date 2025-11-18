/**
 * DOMPurifyモック
 */
const mockSanitize = jest.fn((html: string) => {
    // 簡単なサニタイズ（scriptタグを削除）
    return html.replace(/<script[^>]*>.*?<\/script>/gi, "");
});

const mockDOMPurify = {
    sanitize: mockSanitize,
    isSupported: true,
    setConfig: jest.fn(),
    clearConfig: jest.fn(),
    isValidAttribute: jest.fn(),
    addHook: jest.fn(),
    removeHook: jest.fn(),
    removeAllHooks: jest.fn(),
    removeHooks: jest.fn(),
    addTags: jest.fn(),
    removeTags: jest.fn(),
    addAttrs: jest.fn(),
    removeAttrs: jest.fn(),
    addProtocols: jest.fn(),
    removeProtocols: jest.fn(),
    addAllowedTags: jest.fn(),
    removeAllowedTags: jest.fn(),
    addAllowedAttrs: jest.fn(),
    removeAllowedAttrs: jest.fn(),
    addAllowedProtocols: jest.fn(),
    removeAllowedProtocols: jest.fn(),
    addAllowedProtocolsByTag: jest.fn(),
    removeAllowedProtocolsByTag: jest.fn(),
    addAllowedProtocolsByAttr: jest.fn(),
    removeAllowedProtocolsByAttr: jest.fn(),
    addAllowedProtocolsByTagAndAttr: jest.fn(),
    removeAllowedProtocolsByTagAndAttr: jest.fn(),
    addAllowedProtocolsByTagAndAttrAndProtocol: jest.fn(),
    removeAllowedProtocolsByTagAndAttrAndProtocol: jest.fn(),
};

export default mockDOMPurify;
export { mockDOMPurify };
