(function () {
    "use strict";

    // 一覧画面を表示したときにイベント発火
    kintone.events.on("app.record.index.show", async function (event) {
        console.log("app.record.index.show");
    });
})();
