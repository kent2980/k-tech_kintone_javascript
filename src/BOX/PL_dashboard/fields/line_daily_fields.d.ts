declare namespace line_daily {
    interface Fields {
        /** 日付 - Production date (YYYY-MM-DD) */
        date: kintone.fieldTypes.Date;
        /** 社外定時時間 - Outside contractor working hours */
        outside_time: kintone.fieldTypes.Number;
        /** 工数テキスト - Man-hours text summary */
        man_hours_text: kintone.fieldTypes.SingleLineText;
        /** 名前 - User name who created the report */
        user_name: kintone.fieldTypes.SingleLineText;
        /** 付加価値 - Added value per unit (円) */
        added_value: kintone.fieldTypes.Number;
        /** 目標台数 - Target production quantity */
        target_number: kintone.fieldTypes.Number;
        /** 機種名 - Model name */
        model_name: kintone.fieldTypes.SingleLineText;
        /** 社内残業 - Inside overtime hours */
        inside_overtime: kintone.fieldTypes.Number;
        /** 予定台数 - Production quantity achieved */
        production_number: kintone.fieldTypes.Number;
        /** ライン名 - Production line name */
        line_name: kintone.fieldTypes.SingleLineText;
        /** ルックアップ - Lookup field */
        ルックアップ: kintone.fieldTypes.SingleLineText;
        /** 社内時間 - Inside employee working hours */
        inside_time: kintone.fieldTypes.Number;
        /** 実績台数 - Actual production number */
        actual_number: kintone.fieldTypes.Number;
        /** 不良一覧テキスト - Defect list text summary */
        deflist_text: kintone.fieldTypes.SingleLineText;
        /** ラジオボタン_1 - Radio button option 1 */
        ラジオボタン_1: kintone.fieldTypes.RadioButton;
        /** 4M変更 - Changeover text summary */
        chg_o_text: kintone.fieldTypes.SingleLineText;
        /** 社外残業 - Outside contractor overtime hours */
        outside_overtime: kintone.fieldTypes.Number;
        /** BKC - Model code */
        model_code: kintone.fieldTypes.SingleLineText;
        /** 生産性 - Productivity (calculated field) */
        productivity: kintone.fieldTypes.Calc;
        /** 不良一覧テーブル - Defect list subtable */
        deflist_table: {
            type: "SUBTABLE";
            value: Array<{
                id: string;
                value: {
                    /** 文字列__1行__4 - Single line text field 4 */
                    文字列__1行__4: kintone.fieldTypes.SingleLineText;
                    /** 文字列__1行__16 - Single line text field 16 */
                    文字列__1行__16: kintone.fieldTypes.SingleLineText;
                    /** 文字列__1行__15 - Single line text field 15 */
                    文字列__1行__15: kintone.fieldTypes.SingleLineText;
                    /** 文字列__1行__11 - Single line text field 11 */
                    文字列__1行__11: kintone.fieldTypes.SingleLineText;
                    /** ドロップダウン - Dropdown selection */
                    ドロップダウン: kintone.fieldTypes.DropDown;
                    /** 文字列__1行__18 - Single line text field 18 */
                    文字列__1行__18: kintone.fieldTypes.SingleLineText;
                    /** 文字列__1行__17 - Single line text field 17 */
                    文字列__1行__17: kintone.fieldTypes.SingleLineText;
                    /** 数値_1 - Number field 1 */
                    数値_1: kintone.fieldTypes.Number;
                };
            }>;
        };
        /** 工数テーブル - Man-hours subtable */
        man_hours_table: {
            type: "SUBTABLE";
            value: Array<{
                id: string;
                value: {
                    /** 数値_4 - Number field 4 */
                    数値_4: kintone.fieldTypes.Number;
                    /** 作業種別 - Work type (radio button) */
                    work_type: kintone.fieldTypes.RadioButton;
                    /** 人員種別 - Personnel type (radio button) */
                    personnel_type: kintone.fieldTypes.RadioButton;
                    /** 数値_2 - Number field 2 */
                    数値_2: kintone.fieldTypes.Number;
                    /** 工数 - Man-hours (calculated field) */
                    man_hours: kintone.fieldTypes.Calc;
                };
            }>;
        };
        /** 段替テーブル - Changeover subtable */
        chg_o_table: {
            type: "SUBTABLE";
            value: Array<{
                id: string;
                value: {
                    /** 文字列__1行__5 - Single line text field 5 */
                    文字列__1行__5: kintone.fieldTypes.SingleLineText;
                    /** ドロップダウン_0 - Dropdown selection 0 */
                    ドロップダウン_0: kintone.fieldTypes.DropDown;
                    /** 文字列__1行__6 - Single line text field 6 */
                    文字列__1行__6: kintone.fieldTypes.SingleLineText;
                };
            }>;
        };
    }
    interface SavedFields extends Fields {
        $id: kintone.fieldTypes.Id;
        $revision: kintone.fieldTypes.Revision;
        更新者: kintone.fieldTypes.Modifier;
        作成者: kintone.fieldTypes.Creator;
        レコード番号: kintone.fieldTypes.RecordNumber;
        更新日時: kintone.fieldTypes.UpdatedTime;
        作成日時: kintone.fieldTypes.CreatedTime;
    }
}
