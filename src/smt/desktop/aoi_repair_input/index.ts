/**
 * AOI修理情報入力(SMT) - デスクトップ版
 * 関連レコードテーブルの編集機能を提供
 */

import { handleRecordShow, registerEditButtonClickHandler } from "./handlers/events";

/**
 * 初期化処理
 */
function initialize(): void {
    // レコード追加・編集画面表示時のイベントハンドラーを登録
    kintone.events.on(["app.record.create.show", "app.record.edit.show"], handleRecordShow);

    // 編集ボタンクリックイベントを登録
    registerEditButtonClickHandler();
}

// 初期化実行
initialize();
