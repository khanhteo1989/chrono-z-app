// ============ TIỆN ÍCH CHUNG HISTORLOG-Z ============

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
export function normVN(s) {
  if (!s) return '';
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

// Tìm không dấu trong nhiều trường
export function searchIn(query, ...fields) {
  const q = normVN(query).trim();
  if (!q) return true;
  return fields.some(f => normVN(f).includes(q));
}

// Chấm điểm theo mốc 30/50/100/200/300 (đề tài KHKT)
export const POINT_TIERS = [
  { at: 30,  name: 'Twin thời sử học' },
  { at: 50,  name: 'Người khám phá' },
  { at: 100, name: 'Nhà nghiên cứu trẻ' },
  { at: 200, name: 'Chuyên gia thời gian' },
  { at: 300, name: 'Bậc thầy Lịch sử–Công nghệ' },
];
export function tierFor(points) {
  let t = null;
  for (const tier of POINT_TIERS) if (points >= tier.at) t = tier;
  return t;
}

export const RARITY = {
  basic:   { label: 'Basic',   ring: '#c8b7a6', glow: 'rgba(200,183,166,.45)', count: 7,  minutes: null, points: 10 },
  rare:    { label: 'Rare',    ring: '#3f7fbf', glow: 'rgba(63,127,191,.5)',   count: 9,  minutes: null, points: 20 },
  epic:    { label: 'Epic',    ring: '#8b4fc9', glow: 'rgba(139,79,201,.55)',  count: 11, minutes: 15,   points: 30 },
  legend:  { label: 'Legend',  ring: '#c9a227', glow: 'rgba(201,162,39,.6)',   count: 12, minutes: 15,   points: 50 },
};

export const PERIODS = ['Cổ đại', 'Trung đại', 'Cận đại', 'Hiện đại'];
export const REGIONS = { vietnam: 'Lịch sử Việt Nam', world: 'Lịch sử Thế giới' };

// period của sự kiện legacy dạng "Năm 1226 – Năm 1400" -> [start,end]
export function periodYears(period) {
  if (!period) return null;
  const nums = String(period).match(/\d{3,4}/g);
  if (!nums) return null;
  const a = parseInt(nums[0], 10);
  const b = nums[1] ? parseInt(nums[1], 10) : a;
  return [Math.min(a, b), Math.max(a, b)];
}

// Phân loại thời kỳ tự động khi thiếu
export function autoPeriod(year) {
  if (year == null) return 'Cổ đại';
  if (year < 1858) return year < 405 ? 'Cổ đại' : 'Trung đại';
  if (year < 1930) return 'Cận đại';
  return 'Hiện đại';
}

export function fmtDate(iso) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return iso || ''; }
}

// Trộn mảng (Fisher–Yates)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Escape khi render HTML từ rich text có kiểm soát (admin)
export function safeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

// Xuat CSV (chuẩn Excel tiếng Việt: BOM + phân phôi ;)
export function downloadCSV(filename, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Thống kê cơ bản cho dashboard nghiên cứu KHKT
export function basicStats(values) {
  const v = values.filter(x => typeof x === 'number' && isFinite(x));
  if (!v.length) return { n: 0, mean: 0, sd: 0 };
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const varc = v.length > 1 ? v.reduce((s, x) => s + (x - mean) * (x - mean), 0) / (v.length - 1) : 0;
  return { n: v.length, mean: Math.round(mean * 10) / 10, sd: Math.round(Math.sqrt(varc) * 10) / 10 };
}

// Kiểm định t ghép cặp đơn giản (paired) + Cohen's d — chỉ số tính từ DỮ LIỆU THẬT
export function pairedTTest(pairs) {
  const d = pairs.map(([pre, post]) => post - pre).filter(x => isFinite(x));
  if (d.length < 2) return null;
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) * (x - mean), 0) / (d.length - 1));
  if (sd === 0) return null;
  const t = mean / (sd / Math.sqrt(d.length));
  const df = d.length - 1;
  // xấp xỉ p hai phía bằng chuẩn tắc (đủ cho báo cáo THPT, ghi rõ là xấp xỉ)
  const z = Math.abs(t);
  const p = Math.max(0, Math.min(1, 2 * (1 - 0.5 * (1 + erf(z / Math.SQRT2)))));
  return { n: d.length, meanD: mean, sdD: sd, t, df, p, cohend: mean / sd };
}
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
