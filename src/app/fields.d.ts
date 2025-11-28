declare namespace aoiDefect {
  interface Fields {
    current_board_index: kintone.fieldTypes.Number;
    defect_name: kintone.fieldTypes.SingleLineText;
    aoi_user: kintone.fieldTypes.SingleLineText;
    lot_number: kintone.fieldTypes.SingleLineText;
    reference: kintone.fieldTypes.SingleLineText;
    board_number_label: kintone.fieldTypes.SingleLineText;
    board_label: kintone.fieldTypes.SingleLineText;
    line_name: kintone.fieldTypes.SingleLineText;
    unique_id: kintone.fieldTypes.SingleLineText;
    insert_datetime: kintone.fieldTypes.DateTime;
    parts_type: kintone.fieldTypes.SingleLineText;
    defect_number: kintone.fieldTypes.Number;
    model_code: kintone.fieldTypes.SingleLineText;
    serial: kintone.fieldTypes.SingleLineText;
    x: kintone.fieldTypes.Number;
    y: kintone.fieldTypes.Number;
    model_label: kintone.fieldTypes.SingleLineText;

    defect_image: kintone.fieldTypes.File;
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
