import TableCreateButton from "./components/button/tabeCreateButton";

(function (): void {
    "use strict";
    // createTable関数はTableCreateButtonクラスで管理されるため削除

    async function changeAppSelect(event: Event): Promise<void> {
        const appId = (event.target as HTMLSelectElement).value;
        console.log(appId);
    }

    async function createKintoneAppSelect(): Promise<HTMLSelectElement> {
        if (document.getElementById("test-app-list")) {
            return document.getElementById("test-app-list") as HTMLSelectElement;
        }
        console.log("createKintoneAppList");
        const select = document.createElement("select");
        select.id = "test-app-list";
        select.className = "kintoneplugin-select gaia-argoui-select";

        select.addEventListener("change", (event) => {
            changeAppSelect(event);
        });

        // キントーンアプリの一覧を取得ドロップダウンリストに追加
        try {
            const response = await kintone.api("/k/v1/apps", "GET", {});
            console.log(response);
            response.apps.forEach((app: { appId: string; name: string; description: string }) => {
                const option = document.createElement("option");
                option.value = app.appId;
                option.innerText = app.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error("アプリ一覧の取得に失敗しました:", error);
        }

        return select;
    }

    // 一覧画面を表示したときにイベント発火
    kintone.events.on("app.record.index.show", async function (event): Promise<typeof event> {
        // テーブル作成ボタンをヘッダーに追加
        const headerSpace = kintone.app.getHeaderSpaceElement();
        if (!headerSpace) {
            return event;
        }

        if (!document.getElementById("test-app-list")) {
            const appList = await createKintoneAppSelect();
            headerSpace.appendChild(appList);
        }
        // TableCreateButtonクラスを使用してボタンを作成
        if (!document.getElementById("test-table-create-button")) {
            // TableCreateButtonをインポート（実際の使用時はファイルの先頭でインポート）
            // import TableCreateButton from "./components/button/tabeCreateButton";

            // ボタンインスタンスを作成
            const tableButton = new TableCreateButton(
                "test-table-create-button", // ボタンのID
                "テーブル作成", // ボタンのテキスト
                "kintoneplugin-button-dialog-ok", // ボタンのCSSクラス
                "test-table" // テーブルのID（オプション）
            );

            // ヘッダースペースを設定（必須）
            tableButton.setHeaderSpace(headerSpace);

            // ボタン要素を作成してDOMに追加
            const buttonElement = tableButton.createButton();
            headerSpace.appendChild(buttonElement);
        }

        return event;
    });
})();
