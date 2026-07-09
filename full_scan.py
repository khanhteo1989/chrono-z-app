"""
master_scan.py — Quét TOÀN BỘ dữ liệu từ:
  1. Tất cả PDF text-based (PyMuPDF)
  2. File docx (python-docx)
  3. File txt trong database_raw/
Không cắt bớt, không giới hạn mốc, xuất src/scannedData.js
"""
import re, json, os, sys

# ─── PyMuPDF ───────────────────────────────────────────────────────────────
try:
    import fitz
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

# ─── python-docx ───────────────────────────────────────────────────────────
try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

# ─── CẤU HÌNH ──────────────────────────────────────────────────────────────
PDF_DIR    = "/Users/leekhanh/Desktop/sách"
TXT_DIR    = "database_raw"
OUT_FILE   = "src/scannedData.js"
MIN_CHARS_PER_PAGE = 80   # phân biệt PDF text vs scan ảnh

SPAM_LINES = {
    "Scanned with AnyScanner", "timdapan.com", "thuvienhoclieu.com",
    "hoclieu.vn", "[Monash", "Hệ thống kiến thức lịch sử..."
}

VN_KW = [
    'việt nam', 'đảng', 'hồ chí minh', 'đông dương', 'đại việt',
    'bắc thuộc', 'kháng chiến', 'sài gòn', 'hà nội', 'cộng hòa xã hội',
    'dân chủ cộng hòa', 'cách mạng tháng tám', 'điện biên', 'đổi mới',
    'phan bội châu', 'phan châu trinh', 'lê lợi', 'trần hưng đạo',
    'quân dân', 'miền nam', 'miền bắc', 'pháp thuộc', 'nhà nguyễn',
    'nhà trần', 'nhà lê', 'nhà lý', 'võ nguyên giáp', 'đinh', 'lý',
    'triều đình huế', 'chiến khu việt bắc', 'tây bắc', 'cách mạng vô sản'
]

# Regex mốc thời gian phong phú hơn
PERIOD_RE = re.compile(
    r'('
    # năm XXXX hoặc năm XXXX - XXXX (TCN tuỳ chọn)
    r'(?:Năm|năm)\s+\d{2,4}(?:\s*[-–]\s*\d{2,4})?(?:\s*TCN)?'
    r'|'
    # thế kỷ La Mã
    r'(?:Thế|thế)\s+kỷ\s+(?:I{1,4}|IV|V?I{0,3}|IX|X?I{0,3}|XL|L?X{0,3}|XC|C?X{0,3})'
        r'(?:\s*[-–]\s*(?:I{1,4}|IV|V?I{0,3}|IX|X?I{0,3}|XL|L?X{0,3}|XC|C?X{0,3}))?'
        r'(?:\s*TCN)?'
    r'|'
    # MM/YYYY
    r'\d{1,2}/\d{4}'
    r')'
)

# ─── HELPERS ───────────────────────────────────────────────────────────────
def is_spam(line: str) -> bool:
    s = line.strip()
    return not s or len(s) < 3 or any(sp in s for sp in SPAM_LINES)

def clean(s: str) -> str:
    for sp in SPAM_LINES:
        s = s.replace(sp, "")
    return re.sub(r'\s{2,}', ' ', s).strip()

def classify(text: str) -> str:
    low = text.lower()
    return 'vietnam' if any(k in low for k in VN_KW) else 'world'

def make_title(text: str, maxlen=100) -> str:
    t = re.sub(r'\s+', ' ', text.split('.')[0]).strip()
    return (t[:maxlen-3] + "…") if len(t) > maxlen else (t or text[:maxlen])

def extract_period(line: str):
    m = PERIOD_RE.search(line)
    return m.group(1).strip() if m else None

# ─── BUILD EVENTS TỪ DANH SÁCH DÒNG ───────────────────────────────────────
def build_events(lines: list, source: str, start_id: int) -> list:
    events = []
    eid = start_id
    cur_period = None
    cur_lines  = []

    def flush():
        nonlocal eid, cur_period, cur_lines
        if not cur_period or not cur_lines:
            cur_period = None; cur_lines = []; return
        full = ' '.join(cur_lines)
        full = re.sub(r'\s{2,}', ' ', full).strip()
        if len(full) < 50:
            cur_period = None; cur_lines = []; return

        sents  = [s.strip() for s in re.split(r'(?<=[.!?])\s+', full) if s.strip()]
        basic  = ' '.join(sents[:4])
        adv    = ' '.join(sents[:15])

        events.append({
            "id":        eid,
            "period":    cur_period,
            "source":    source,
            "category":  classify(full),
            "title":     make_title(full),
            "basic":     basic,
            "advanced":  adv,
            "full_wiki": full,
            "wikiLinks": {}
        })
        eid += 1
        cur_period = None; cur_lines = []

    for line in lines:
        if is_spam(line): continue
        c = clean(line)
        if not c: continue
        p = extract_period(c)
        if p:
            flush()
            cur_period = p
            cur_lines  = [c]
        elif cur_period is not None:
            cur_lines.append(c)

    flush()
    return events

# ─── NGUỒN 1: PDF (text-based) ─────────────────────────────────────────────
def scan_pdfs(start_id: int) -> tuple:
    if not HAS_FITZ:
        print("  [SKIP] PyMuPDF chưa cài"); return [], start_id
    pdf_files = sorted(f for f in os.listdir(PDF_DIR) if f.lower().endswith('.pdf'))
    all_ev = []; eid = start_id
    for fname in pdf_files:
        path = os.path.join(PDF_DIR, fname)
        try:
            with fitz.open(path) as doc:
                npage = len(doc)
                lines = []
                total = 0
                for pg in doc:
                    raw = pg.get_text("text"); total += len(raw)
                    for l in raw.split('\n'):
                        if not is_spam(l): lines.append(l)
                avg = total / max(npage, 1)
            if avg < MIN_CHARS_PER_PAGE:
                print(f"  [SCAN-IMG SKIP] {fname} (avg {avg:.0f} chars/page)")
                continue
            evs = build_events(lines, fname, eid)
            eid += len(evs); all_ev.extend(evs)
            print(f"  [PDF OK] {fname} → {len(evs)} mốc")
        except Exception as e:
            print(f"  [PDF ERR] {fname}: {e}")
    return all_ev, eid

# ─── NGUỒN 2: DOCX ─────────────────────────────────────────────────────────
def scan_docx(start_id: int) -> tuple:
    if not HAS_DOCX:
        print("  [SKIP] python-docx chưa cài"); return [], start_id
    docx_files = sorted(f for f in os.listdir(PDF_DIR) if f.lower().endswith('.docx'))
    all_ev = []; eid = start_id
    for fname in docx_files:
        path = os.path.join(PDF_DIR, fname)
        try:
            doc   = Document(path)
            lines = [p.text for p in doc.paragraphs if p.text.strip()]
            evs   = build_events(lines, fname, eid)
            eid  += len(evs); all_ev.extend(evs)
            print(f"  [DOCX OK] {fname} → {len(evs)} mốc")
        except Exception as e:
            print(f"  [DOCX ERR] {fname}: {e}")
    return all_ev, eid

# ─── NGUỒN 3: TXT trong database_raw ──────────────────────────────────────
def scan_txt(start_id: int) -> tuple:
    txt_files = sorted(f for f in os.listdir(TXT_DIR)
                       if f.endswith('.txt') and f != 'big_data.txt')
    all_ev = []; eid = start_id
    for fname in txt_files:
        path = os.path.join(TXT_DIR, fname)
        try:
            with open(path, encoding='utf-8') as f:
                lines = f.readlines()
            evs  = build_events(lines, fname, eid)
            eid += len(evs); all_ev.extend(evs)
            print(f"  [TXT OK] {fname} → {len(evs)} mốc")
        except Exception as e:
            print(f"  [TXT ERR] {fname}: {e}")
    return all_ev, eid

# ─── MAIN ──────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("MASTER SCAN — KHÔNG CẮT BỚT")
    print("=" * 60)

    eid = 1
    all_events = []

    print("\n[NGUỒN 1] Quét PDF text-based...")
    evs, eid = scan_pdfs(eid); all_events.extend(evs)

    print("\n[NGUỒN 2] Quét file DOCX...")
    evs, eid = scan_docx(eid); all_events.extend(evs)

    print("\n[NGUỒN 3] Quét file TXT (database_raw)...")
    evs, eid = scan_txt(eid); all_events.extend(evs)

    # Loại bỏ trùng lặp (same period + source) bằng set
    seen = set()
    unique = []
    for e in all_events:
        key = (e['period'], e['full_wiki'][:80])
        if key not in seen:
            seen.add(key); unique.append(e)
    all_events = unique

    # Phân loại & sắp xếp
    vn  = sorted([e for e in all_events if e['category'] == 'vietnam'],
                 key=lambda x: x['period'])
    wld = sorted([e for e in all_events if e['category'] == 'world'],
                 key=lambda x: x['period'])
    final = vn + wld

    print(f"\n{'=' * 60}")
    print(f"KẾT QUẢ TỔNG")
    print(f"  Lịch sử Việt Nam : {len(vn):>4} mốc")
    print(f"  Lịch sử Thế giới : {len(wld):>4} mốc")
    print(f"  TỔNG CỘNG        : {len(final):>4} mốc (sau dedup)")

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(f"// MASTER SCAN — {len(final)} mốc — KHÔNG CẮT BỚT\n")
        f.write("export const autoTimelineData = ")
        json.dump(final, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    kb = os.path.getsize(OUT_FILE) / 1024
    print(f"  Đã lưu: {OUT_FILE} ({kb:.1f} KB)")
    print("=" * 60)

if __name__ == "__main__":
    main()
