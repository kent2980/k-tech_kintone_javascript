/**
 * 自動生成されたフィールド定義
 * ⚠️ このファイルは自動生成されます。直接編集しないでください。
 *
 * 生成日時: 2025-11-11T12:17:06.790Z
 * 生成コマンド: npm run generate:fields
 */

export const GENERATED_FIELDS = {
  monthly: [
    'direct',
    'dispatch',
    'indirect',
    'inside_unit',
    'month',
    'outside_unit',
    'year',
    'year_month',
  ],

  daily: [
    'date',
    'direct_personnel',
    'indirect_holiday_work',
    'indirect_material_costs',
    'indirect_overtime',
    'indirect_personnel',
    'inside_holiday_expenses',
    'inside_overtime_cost',
    'labor_costs',
    'night_shift_allowance',
    'other_added_value',
    'other_indirect_material_costs',
    'outside_holiday_expenses',
    'outside_overtime_cost',
    'temporary_employees',
    'total_sub_cost',
  ],

  line_daily: [
    'actual_number',
    'added_value',
    'chg_o_text',
    'date',
    'deflist_text',
    'inside_overtime',
    'inside_time',
    'line_name',
    'man_hours_text',
    'model_code',
    'model_name',
    'outside_overtime',
    'outside_time',
    'production_number',
    'productivity',
    'target_number',
    'user_name',
    'ラジオボタン_1',
    'ルックアップ',
  ],

  model_master: [
    'added_value',
    'customer',
    'line_name',
    'model_code',
    'model_name',
    'number_of_people',
    'time',
  ],

  holiday: [
    'date',
    'holiday_type',
  ],

} as const;

/**
 * フィールド定義へのアクセサー
 */
export class GeneratedFieldsUtil {
  static getMonthlyFields(): readonly string[] {
    return GENERATED_FIELDS.monthly;
  }

  static getDailyFields(): readonly string[] {
    return GENERATED_FIELDS.daily;
  }

  static getLineDailyFields(): readonly string[] {
    return GENERATED_FIELDS.line_daily;
  }

  static getModelMasterFields(): readonly string[] {
    return GENERATED_FIELDS.model_master;
  }

  static getHolidayFields(): readonly string[] {
    return GENERATED_FIELDS.holiday;
  }

  static getAllFields(): typeof GENERATED_FIELDS {
    return GENERATED_FIELDS;
  }
}
