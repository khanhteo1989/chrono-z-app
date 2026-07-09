import re
import json

# 1. Đọc data.js
with open('src/data.js', 'r', encoding='utf-8') as f:
    data_content = f.read()

# Lấy timelineData từ data.js
timeline_match = re.search(r'export const timelineData = (\[[\s\S]*?\]);\s*// Combine', data_content)
if timeline_match:
    try:
        # Xóa các newline và spaces lạ nếu cần, nhưng js obj ko phải json
        # Ta có thể chỉ cần chép chuỗi này sang scannedData.js
        manual_timeline_str = timeline_match.group(1)
    except:
        manual_timeline_str = "[]"
else:
    manual_timeline_str = "[]"

# Lấy characterData
char_match = re.search(r'(export const characterData = \[[\s\S]*\];)', data_content)
char_data_str = char_match.group(1) if char_match else ""

# Tạo file data.js mới chỉ chứa characterData
new_data_js = f"""// Dữ liệu Nhân vật Lịch sử
{char_data_str}
"""
with open('src/data.js', 'w', encoding='utf-8') as f:
    f.write(new_data_js)

print("Đã tách timelineData khỏi data.js")

