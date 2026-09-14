import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tanctyrxvntvpxnamwdt.supabase.co';
const supabaseAnonKey = 'sb_publishable_1PAAzv5bhcdwMqFUPIToPw_svSyPQOR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper hàm lưu và lấy dữ liệu
export const getAppData = async (key, fallbackData) => {
  try {
    const { data, error } = await supabase
      .from('app_storage')
      .select('data')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase] Lỗi khi tải key "${key}":`, error.message);
      return fallbackData;
    }
    if (data && data.data) {
      return data.data;
    }
    return fallbackData;
  } catch (err) {
    console.error(`[Supabase] Ngoại lệ khi tải key "${key}":`, err);
    return fallbackData;
  }
};

export const saveAppData = async (key, dataValue) => {
  try {
    const { error } = await supabase
      .from('app_storage')
      .upsert({
        key,
        data: dataValue,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }
    return { success: true };
  } catch (err) {
    console.error(`[Supabase] Lỗi khi lưu key "${key}":`, err);
    return { success: false, error: err.message };
  }
};
