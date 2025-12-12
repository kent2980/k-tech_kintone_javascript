import { renderSpace3 } from "./space/space3_desktop";

(function (): void {
    "use strict";

    kintone.events.on("space.portal.show", function (event) {
        const spaceId = event.spaceId;

        if (spaceId === "3") {
            // 非同期処理を実行（エラーハンドリング付き）
            renderSpace3().catch((error) => {
                console.error("スペース3のレンダリングに失敗しました:", error);
            });
        }

        return event;
    });
})();
