/// <reference path="../../../../../kintone.d.ts" />
/// <reference path="../../../../../globals.d.ts" />

/**
 * DOM要素情報を管理する基底インターフェース
 *
 * @category Components
 */
export interface BaseDomElementInfo {
    /** 要素ID */
    id: string;
    /** DOM要素 */
    element: HTMLElement;
    /** 作成日時 */
    createdAt: Date;
}

/**
 * DOM構築の基底クラス
 * 汎用的なDOM要素管理機能を提供
 */
export abstract class BaseDomBuilder {
    /** 作成されたDOM要素のマップ */
    protected elements: Map<string, BaseDomElementInfo> = new Map();

    /**
     * コンストラクタ
     */
    constructor() {
        // 初期化処理（必要に応じて）
    }

    /**
     * DOM要素情報を登録
     * @param id - 要素ID
     * @param element - DOM要素
     */
    protected registerElement(id: string, element: HTMLElement): void {
        const elementInfo: BaseDomElementInfo = {
            id,
            element,
            createdAt: new Date(),
        };
        this.elements.set(id, elementInfo);
    }

    /**
     * DOM要素情報を取得
     * @param id - 要素ID
     * @returns DOM要素情報、存在しない場合はnull
     */
    public getElementInfo(id: string): BaseDomElementInfo | null {
        return this.elements.get(id) || null;
    }

    /**
     * DOM要素を取得
     * @param id - 要素ID
     * @returns DOM要素、存在しない場合はnull
     */
    public getElement(id: string): HTMLElement | null {
        const elementInfo = this.elements.get(id);
        return elementInfo?.element || null;
    }

    /**
     * すべての要素IDを取得
     * @returns 要素IDの配列
     */
    public getAllElementIds(): string[] {
        return Array.from(this.elements.keys());
    }

    /**
     * 要素が存在するかチェック
     * @param id - 要素ID
     * @returns 存在するかどうか
     */
    public hasElement(id: string): boolean {
        return this.elements.has(id);
    }

    /**
     * 指定された要素を削除
     * @param id - 要素ID
     */
    public removeElement(id: string): void {
        const elementInfo = this.elements.get(id);
        if (elementInfo && elementInfo.element.parentNode) {
            elementInfo.element.parentNode.removeChild(elementInfo.element);
        }
        this.elements.delete(id);
    }

    /**
     * すべての要素を削除
     */
    public removeAllElements(): void {
        const ids = Array.from(this.elements.keys());
        ids.forEach((id) => {
            this.removeElement(id);
        });
    }
}
