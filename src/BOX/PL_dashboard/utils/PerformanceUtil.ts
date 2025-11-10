/**
 * パフォーマンス最適化ユーティリティ
 */
export class PerformanceUtil {
    private static cache = new Map<string, unknown>();
    private static observers = new Map<string, IntersectionObserver>();

    /**
     * キャッシュからデータを取得する
     * @param key - キャッシュキー
     * @returns キャッシュされたデータ
     */
    static getFromCache<T>(key: string): T | null {
        const value = this.cache.get(key);
        return value ? (value as T) : null;
    }

    /**
     * データをキャッシュに保存する
     * @param key - キャッシュキー
     * @param data - 保存するデータ
     * @param ttl - TTL（ミリ秒、オプション）
     */
    static setCache<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, data);

        if (ttl) {
            setTimeout(() => {
                this.cache.delete(key);
            }, ttl);
        }
    }

    /**
     * キャッシュをクリアする
     * @param pattern - クリアするキーのパターン（オプション）
     */
    static clearCache(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        const regex = new RegExp(pattern);
        Array.from(this.cache.keys())
            .filter((key) => regex.test(key))
            .forEach((key) => this.cache.delete(key));
    }

    /**
     * 遅延実行（デバウンス）
     * @param func - 実行する関数
     * @param delay - 遅延時間（ミリ秒）
     * @returns デバウンスされた関数
     */
    static debounce<T extends (...functionArgs: unknown[]) => unknown>(
        func: T,
        delay: number
    ): (...functionArgs: Parameters<T>) => void {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (...functionArgs: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, functionArgs), delay);
        };
    }

    /**
     * スロットリング（一定間隔で実行）
     * @param func - 実行する関数
     * @param limit - 実行間隔（ミリ秒）
     * @returns スロットリングされた関数
     */
    static throttle<T extends (...functionArgs: unknown[]) => unknown>(
        func: T,
        limit: number
    ): (...functionArgs: Parameters<T>) => void {
        let inThrottle = false;
        return (...functionArgs: Parameters<T>) => {
            if (!inThrottle) {
                func.apply(null, functionArgs);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    /**
     * Intersection Observer を設定してビューポート監視する
     * @param element - 監視対象要素
     * @param callback - 交差時のコールバック
     * @param options - オブザーバーのオプション
     * @returns オブザーバーのキー
     */
    static observeViewport(
        element: Element,
        callback: (observerEntry: IntersectionObserverEntry) => void,
        options: IntersectionObserverInit = {}
    ): string {
        const key = `viewport-${Date.now()}-${Math.random()}`;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(callback);
        }, options);

        observer.observe(element);
        this.observers.set(key, observer);

        return key;
    }

    /**
     * Intersection Observer を停止する
     * @param key - オブザーバーのキー
     */
    static unobserveViewport(key: string): void {
        const observer = this.observers.get(key);
        if (observer) {
            observer.disconnect();
            this.observers.delete(key);
        }
    }

    /**
     * 仮想スクロールのためのチャンク分割
     * @param data - 分割するデータ配列
     * @param chunkSize - チャンクサイズ
     * @returns 分割されたデータチャンク
     */
    static chunkArray<T>(data: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * メモリ使用量を監視する
     * @returns メモリ使用量情報（利用可能な場合）
     */
    static getMemoryUsage(): {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    } | null {
        if ("memory" in performance) {
            return (
                performance as {
                    memory: {
                        usedJSHeapSize: number;
                        totalJSHeapSize: number;
                        jsHeapSizeLimit: number;
                    };
                }
            ).memory;
        }
        return null;
    }

    /**
     * DOM要素を遅延作成する
     * @param factory - 要素作成関数
     * @returns Promise<HTMLElement>
     */
    static async createElementLazy(factory: () => HTMLElement): Promise<HTMLElement> {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                resolve(factory());
            });
        });
    }

    /**
     * 大量データを非同期処理で分割処理する
     * @param data - 処理するデータ
     * @param processor - 処理関数
     * @param batchSize - バッチサイズ
     * @returns 処理結果
     */
    static async processBatches<T, R>(
        data: T[],
        processor: (processingBatch: T[]) => R[],
        batchSize: number = 100
    ): Promise<R[]> {
        const results: R[] = [];
        const chunks = this.chunkArray(data, batchSize);

        for (const chunk of chunks) {
            const batchResults = processor(chunk);
            results.push(...batchResults);

            // 次のバッチ前に少し待機してブラウザをブロックしない
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        return results;
    }

    /**
     * パフォーマンス測定を開始する
     * @param name - 測定名
     */
    static startMeasure(name: string): void {
        performance.mark(`${name}-start`);
    }

    /**
     * パフォーマンス測定を終了する
     * @param name - 測定名
     * @returns 測定時間（ミリ秒）
     */
    static endMeasure(name: string): number {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        const measure = performance.getEntriesByName(name)[0];
        return measure.duration;
    }

    /**
     * リソースのプリロード
     * @param url - リソースURL
     * @param type - リソースタイプ
     */
    static preloadResource(url: string, type: "script" | "style" | "image"): void {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = url;

        switch (type) {
            case "script":
                link.as = "script";
                break;
            case "style":
                link.as = "style";
                break;
            case "image":
                link.as = "image";
                break;
        }

        document.head.appendChild(link);
    }
}
