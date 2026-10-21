import { createClient } from '@supabase/supabase-js';

// Ưu tiên biến môi trường (Vercel / .env). Giá trị hardcode chỉ là fallback
// để site cũ không vỡ khi chưa cấu hình env — publishable key nên vẫn an toàn
// khi có RLS đúng, nhưng KHÔNG bao giờ đặt service-role key ở đây.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://tanctyrxvntvpxnamwdt.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1PAAzv5bhcdwMqFUPIToPw_svSyPQOR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const SUPABASE_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Helper hàm lưu và lấy dữ liệu (legacy app_storage — chỉ Admin ghi được sau migration 001/002)
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
