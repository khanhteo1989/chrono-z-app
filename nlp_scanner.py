import re
import json
import os

input_file = "database_raw/big_data.txt"
output_file = "src/scannedData.js"

# ──────────────────────────────────────────────────────────────────────────────
# REGEX PATTERNS cho mốc thời gian
# ──────────────────────────────────────────────────────────────────────────────
PERIOD_PATTERNS = [
    # "năm 1945", "Năm 1975", "năm 221 TCN"...
    r'(?:^|[\s;:,\-–])([Nn]ăm \d{2,4}(?:\s*-\s*\d{2,4})?(?:\s*TCN)?)',
    # "Thế kỷ XVIII", "thế kỷ XX"...
    r'(?:^|[\s;:,\-–])([Tt]hế kỷ [IVXL]{1,6}(?:\s*-\s*[IVXL]{1,6})?(?:\s*TCN)?)',
    # "9/1945", "2/1930" etc
    r'(?:^|[\s;:,\-–])(\d{1,2}/\d{4})',
]

COMPILED_PATTERNS = [re.compile(p) for p in PERIOD_PATTERNS]

# Keywords phân loại Vietnam vs World
VN_KEYWORDS = [
    'việt nam', 'đảng', 'hồ chí minh', 'đông dương', 'nguyễn',
    'đại việt', 'pháp thuộc', 'bắc thuộc', 'trần', 'lê', 'lý', 'nguyễn',
    'chiến khu', 'kháng chiến', 'độc lập dân tộc', 'bình định',
    'sài gòn', 'hà nội', 'huế', 'dân chủ cộng hòa', 'cộng hòa xã hội'
]


def extract_period(line: str):
    """Trả về chuỗi mốc thời gian đầu tiên tìm thấy trong line, hoặc None."""
    for pat in COMPILED_PATTERNS:
        m = pat.search(line)
        if m:
            return m.group(1).strip()
    return None


def classify(text: str) -> str:
    low = text.lower()
    for kw in VN_KEYWORDS:
        if kw in low:
            return 'vietnam'
    return 'world'


def make_title(period: str, text: str) -> str:
    # Lấy câu đầu tiên sau dấu chấm/dấu xuống dòng, tối đa 100 ký tự
    first = text.split('.')[0].strip()
    if not first:
        first = period
    return (first[:97] + "…") if len(first) > 100 else first


def scan_documents():
    if not os.path.exists(input_file):
        print(f"Không tìm thấy file {input_file}")
        return

    print("=== QUÉT TOÀN BỘ BIG DATA – KHÔNG CẮT BỚT ===")
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f"Tổng số dòng: {len(lines)}")

    events: list[dict] = []
    current_period: str | None = None
    current_text_lines: list[str] = []
    event_id = 1

    def flush_event():
        nonlocal event_id
        if not current_period:
            return
        full_text = ' '.join(current_text_lines).strip()
        # Bỏ qua những event cực ngắn (< 30 ký tự) – nhiễu
        if len(full_text) < 30:
            return

        # Tóm tắt basic = 3 câu đầu (tối đa 400 ký tự)
        sents = [s.strip() for s in full_text.split('.') if s.strip()]
        basic = '. '.join(sents[:3])
        if len(basic) > 400:
            basic = basic[:397] + '…'
        
        # Advanced = 8 câu đầu (tối đa 1000 ký tự)
        advanced = '. '.join(sents[:8])
        if len(advanced) > 1000:
            advanced = advanced[:997] + '…'

        events.append({
            "id": event_id,
            "period": current_period,
            "category": classify(full_text),
            "title": make_title(current_period, full_text),
            "basic": basic,
            "advanced": advanced,
            "full_wiki": full_text,   # TOÀN BỘ – không cắt
            "wikiLinks": {}
        })
        event_id += 1

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        period = extract_period(line)

        if period:
            # Kết thúc sự kiện cũ
            flush_event()
            # Bắt đầu sự kiện mới
            current_period = period
            current_text_lines = [line]
        else:
            # Nối tiếp vào sự kiện đang mở
            if current_period is not None:
                current_text_lines.append(line)

    # Flush event cuối cùng
    flush_event()

    print(f"Đã trích xuất: {len(events)} mốc sự kiện")

    # Sắp xếp: Việt Nam trước, rồi Thế giới; trong mỗi nhóm sắp theo period
    vn_events = sorted([e for e in events if e['category'] == 'vietnam'], key=lambda x: x['period'])
    world_events = sorted([e for e in events if e['category'] == 'world'], key=lambda x: x['period'])

    print(f"  → Lịch sử Việt Nam: {len(vn_events)} sự kiện")
    print(f"  → Lịch sử Thế giới: {len(world_events)} sự kiện")

    all_events = vn_events + world_events

    # Ghi ra file JS
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("// FILE ĐƯỢC TẠO TỰ ĐỘNG BỞI NLP_SCANNER.PY – KHÔNG CẮT BỚT\n")
        f.write("// Tổng: {} sự kiện (Vietnam: {} | World: {})\n".format(
            len(all_events), len(vn_events), len(world_events)))
        f.write("export const autoTimelineData = ")
        json.dump(all_events, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    size_kb = os.path.getsize(output_file) / 1024
    print(f"Đã lưu: {output_file} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    scan_documents()
