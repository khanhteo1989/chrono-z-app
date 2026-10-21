"""
clean_and_build.py — Làm sạch dữ liệu quét OCR và xây dựng kho kiến thức
Lịch sử chuẩn từ SGK 10-11-12, viết lại câu từ rõ ràng, đúng chính tả.
"""
import json, re, os

# ─────────────────────────────────────────────────────────────────────────────
# BƯỚC 1: HÀM LÀM SẠCH VĂN BẢN OCR
# ─────────────────────────────────────────────────────────────────────────────
def clean_text(text: str) -> str:
    """Làm sạch văn bản từ OCR: xóa ký tự thừa, chuẩn hóa câu."""
    if not text:
        return ""
    # Xóa dấu => và ==> thay bằng "→"
    text = re.sub(r'=>+', '→', text)
    text = re.sub(r'=\s*>', '→', text)
    # Xóa ký tự đặc biệt đầu câu (- , +, *, •)
    text = re.sub(r'^[\-\+\*•]\s*', '', text, flags=re.MULTILINE)
    # Chuẩn hóa khoảng trắng
    text = re.sub(r'\s{2,}', ' ', text)
    # Chuẩn hóa dấu câu
    text = re.sub(r'\s+([,\.;:\!\?])', r'\1', text)
    # Xóa các cụm không cần thiết
    noise = [
        "Hệ thống kiến thức lịch sử...", "Bản đọc thử Hệ thống",
        "timdapan.com", "Scanned with AnyScanner",
    ]
    for n in noise:
        text = text.replace(n, "")
    return text.strip()


def clean_period(period: str) -> str:
    """Chuẩn hóa hiển thị mốc thời gian."""
    period = period.strip()
    # "năm 1945" → "Năm 1945"
    period = re.sub(r'^năm\s+', 'Năm ', period, flags=re.IGNORECASE)
    # "thế kỷ xix" → "Thế kỷ XIX"
    period = re.sub(r'^thế kỷ\s+', 'Thế kỷ ', period, flags=re.IGNORECASE)
    # Viết hoa chữ số La Mã
    period = re.sub(r'thế kỷ ([ivxlIVXL]+)', lambda m: 'Thế kỷ ' + m.group(1).upper(), period)
    return period


def make_readable_title(title: str, period: str) -> str:
    """Tạo tiêu đề dễ đọc, loại bỏ ký tự đầu câu."""
    t = clean_text(title)
    # Xóa mốc thời gian lặp lại trong title
    t = re.sub(r'^\(?(\d{1,2}/\d{4}|\d{4})\)?\s*', '', t)
    # Xóa dấu đầu dòng
    t = re.sub(r'^[\-\+\*•\(\)]\s*', '', t).strip()
    if not t or len(t) < 5:
        t = f"Sự kiện {period}"
    return t[:100] + ("…" if len(t) > 100 else "")


# ─────────────────────────────────────────────────────────────────────────────
# BƯỚC 2: KHO DỮ LIỆU LỊCH SỬ CHUẨN (viết tay, đúng chính tả)
# ─────────────────────────────────────────────────────────────────────────────
CURATED_EVENTS = [
    # ========================================================================
    # LỊCH SỬ VIỆT NAM
    # ========================================================================

    # --- Thời kỳ cổ đại ---
    {
        "period": "Thế kỷ III TCN – Thế kỷ X",
        "category": "vietnam",
        "title": "Nghìn năm Bắc thuộc – Ý chí bất khuất",
        "basic": (
            "Từ năm 179 TCN đến năm 938, Việt Nam trải qua hơn 1.000 năm chịu sự đô hộ của các triều đại phong kiến phương Bắc. "
            "Nhân dân Việt Nam liên tục nổi dậy đấu tranh với hơn 20 cuộc khởi nghĩa lớn nhỏ, tiêu biểu là khởi nghĩa Hai Bà Trưng (40–43), "
            "khởi nghĩa Bà Triệu (248), khởi nghĩa Lý Bí (541–544)."
        ),
        "advanced": (
            "Dù bị đô hộ lâu dài, người Việt vẫn bảo tồn được bản sắc văn hóa, tiếng nói và ý thức dân tộc. "
            "Chính quyền đô hộ tuy áp đặt văn hóa Hán nhưng không thể đồng hóa hoàn toàn, bởi cộng đồng làng xã Việt Nam đã trở thành "
            "pháo đài bảo vệ văn hóa. Đây là bài học về sức mạnh mềm của bản sắc dân tộc."
        ),
        "full_wiki": (
            "Giai đoạn Bắc thuộc kéo dài hơn 1.000 năm (179 TCN – 938), bao gồm các thời kỳ: nhà Triệu (179–111 TCN), nhà Hán (111 TCN–220), "
            "Lục triều (220–589), nhà Tùy – Đường (589–938).\n\n"
            "Chính sách cai trị: Chính quyền đô hộ thực hiện chính sách bóc lột nặng nề (tô thuế, lao dịch), áp đặt văn hóa Hán (chữ Hán, Nho giáo), "
            "đàn áp mọi mầm mống nổi dậy và cưỡng bức di dân người Hán vào Giao Châu.\n\n"
            "Các cuộc khởi nghĩa tiêu biểu:\n"
            "• Hai Bà Trưng (40–43 SCN): Trưng Trắc và Trưng Nhị lãnh đạo khởi nghĩa, đánh đuổi thái thú Tô Định, lập chính quyền độc lập tồn tại 3 năm.\n"
            "• Bà Triệu (248 SCN): Triệu Thị Trinh với câu nói bất hủ \"Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ...\".\n"
            "• Lý Bí (541–544): Lập nước Vạn Xuân, đặt nền móng đầu tiên cho nhà nước độc lập Việt Nam.\n"
            "• Khúc Thừa Dụ (905): Nhân lúc nhà Đường suy yếu, nổi dậy chiếm thành Tống Bình (Hà Nội), xưng Tiết độ sứ, thực chất độc lập.\n"
            "• Ngô Quyền (938): Chiến thắng Bạch Đằng kết thúc 1.000 năm Bắc thuộc.\n\n"
            "Ý nghĩa: Giai đoạn này chứng minh sức sống mãnh liệt và ý chí bất khuất của dân tộc Việt Nam."
        ),
    },
    {
        "period": "Năm 938",
        "category": "vietnam",
        "title": "Chiến thắng Bạch Đằng – Ngô Quyền mở ra kỷ nguyên tự chủ",
        "basic": (
            "Năm 938, Ngô Quyền lãnh đạo quân dân Việt Nam đánh tan đoàn thuyền chiến Nam Hán trên sông Bạch Đằng. "
            "Ông sáng tạo chiến thuật đóng cọc gỗ bịt sắt nhọn dưới lòng sông, nhử địch vào rồi phản công khi thủy triều rút. "
            "Chiến thắng này chấm dứt hơn 1.000 năm Bắc thuộc."
        ),
        "advanced": (
            "Chiến thắng Bạch Đằng 938 là một trong những trang sử hào hùng nhất của dân tộc. "
            "Nghệ thuật quân sự của Ngô Quyền thể hiện tư duy sáng tạo: lợi dụng địa hình tự nhiên (thủy triều, lòng sông), "
            "kết hợp giữa phòng thủ chiến lược và phản công chủ động. Sau chiến thắng, Ngô Quyền xưng vương, đóng đô tại Cổ Loa, "
            "mở ra thời kỳ độc lập tự chủ lâu dài của dân tộc."
        ),
        "full_wiki": (
            "Bối cảnh: Sau khi nhà Đường sụp đổ (907), Trung Quốc bước vào thời kỳ Ngũ đại Thập quốc hỗn loạn. "
            "Tại Giao Châu, nhà Tĩnh Hải quân (họ Khúc, họ Dương) cai trị tự chủ. "
            "Năm 931, Nam Hán xâm lược và giết Dương Đình Nghệ. Ngô Quyền là con rể Dương Đình Nghệ đã khởi binh báo thù.\n\n"
            "Diễn biến trận chiến (cuối năm 938):\n"
            "1. Ngô Quyền cho đóng cọc gỗ bịt sắt nhọn ngầm dưới lòng sông Bạch Đằng, tính toán theo thủy triều.\n"
            "2. Khi thủy triều lên cao, thuyền nhỏ của ta nhử đoàn thuyền lớn của Nam Hán vào sâu.\n"
            "3. Thủy triều rút, thuyền Nam Hán bị mắc cọc, không cơ động được.\n"
            "4. Quân ta từ hai bờ đồng loạt tấn công, tiêu diệt toàn bộ, Hoằng Tháo tử trận.\n\n"
            "Kết quả và ý nghĩa:\n"
            "• Chấm dứt vĩnh viễn ách đô hộ của phong kiến phương Bắc kéo dài hơn 1.000 năm.\n"
            "• Ngô Quyền xưng vương, xây dựng chính quyền độc lập tại Cổ Loa.\n"
            "• Mở ra thời kỳ độc lập, tự chủ của các triều đại Đinh – Tiền Lê – Lý – Trần – Lê.\n"
            "• Trận Bạch Đằng trở thành biểu tượng về tư duy quân sự sáng tạo, phát huy điều kiện tự nhiên."
        ),
    },
    {
        "period": "Năm 1010 – Năm 1225",
        "category": "vietnam",
        "title": "Nhà Lý – Xây dựng nhà nước phong kiến độc lập vững mạnh",
        "basic": (
            "Năm 1010, Lý Công Uẩn dời đô từ Hoa Lư về Thăng Long (Hà Nội ngày nay), mở ra thời kỳ nhà Lý (1009–1225). "
            "Đây là triều đại đầu tiên xây dựng nhà nước phong kiến Việt Nam trên quy mô lớn, với Thăng Long là trung tâm chính trị, "
            "kinh tế, văn hóa trong suốt nhiều thế kỷ."
        ),
        "advanced": (
            "Nhà Lý đạt được nhiều thành tựu nổi bật: Ban hành Hình thư (bộ luật thành văn đầu tiên, 1042), "
            "xây dựng Văn Miếu – Quốc Tử Giám (1070–1076), tổ chức khoa thi đầu tiên (1075). "
            "Năm 1075–1077, Lý Thường Kiệt chỉ huy đánh bại quân Tống, bảo vệ vững chắc nền độc lập. "
            "Bài thơ \"Nam quốc sơn hà\" (Lý Thường Kiệt) được coi là bản Tuyên ngôn độc lập đầu tiên của Việt Nam."
        ),
        "full_wiki": (
            "Nhà Lý (1009–1225) trải qua 9 đời vua với 216 năm trị vì. Những thành tựu chính:\n\n"
            "1. Chính trị – Hành chính:\n"
            "• 1010: Lý Công Uẩn ban \"Chiếu dời đô\" và chuyển đô về Thăng Long – quyết định mang tầm nhìn chiến lược.\n"
            "• Xây dựng bộ máy nhà nước trung ương tập quyền, chia cả nước thành 24 lộ.\n"
            "• 1042: Ban hành bộ Hình thư – bộ luật thành văn đầu tiên của Việt Nam.\n\n"
            "2. Giáo dục – Văn hóa:\n"
            "• 1070: Xây dựng Văn Miếu thờ Khổng Tử tại Thăng Long.\n"
            "• 1076: Thành lập Quốc Tử Giám – trường đại học đầu tiên của Việt Nam.\n"
            "• 1075: Tổ chức khoa thi Minh kinh bác học lần đầu tiên.\n\n"
            "3. Quân sự – Đối ngoại:\n"
            "• Chiến tranh Lý – Tống (1075–1077): Lý Thường Kiệt chủ trương \"tiên phát chế nhân\", "
            "tấn công phủ đầu vào các căn cứ hậu cần của Tống ở Ung Châu, Khâm Châu, Liêm Châu (1075). "
            "Sau đó phòng thủ trên phòng tuyến sông Cầu (Như Nguyệt), đánh tan quân Tống (1077).\n"
            "• Bài thơ \"Nam quốc sơn hà\" khẳng định chủ quyền lãnh thổ và ý chí bảo vệ đất nước.\n\n"
            "4. Kinh tế – Xã hội:\n"
            "• Phát triển nông nghiệp (đắp đê, đào kênh), thủ công nghiệp và thương mại.\n"
            "• Chính sách \"Ngụ binh ư nông\": lính đồng thời là nông dân, vừa sản xuất vừa sẵn sàng chiến đấu."
        ),
    },
    {
        "period": "Năm 1226 – Năm 1400",
        "category": "vietnam",
        "title": "Nhà Trần – Ba lần kháng chiến chống Mông – Nguyên",
        "basic": (
            "Nhà Trần (1226–1400) lập nên kỳ tích ba lần đánh thắng quân Mông – Nguyên (1258, 1285, 1287–1288) – đế quốc hùng mạnh nhất thế giới lúc bấy giờ. "
            "Chiến lược \"vườn không nhà trống\", tiêu hao sinh lực địch, rồi phản công quyết liệt là bài học quân sự vô giá."
        ),
        "advanced": (
            "Ba lần kháng chiến chống Mông – Nguyên là minh chứng cho đường lối \"chiến tranh toàn dân\". "
            "Đại hội Diên Hồng (1285) thể hiện sức mạnh đoàn kết: khi vua Trần hỏi \"Nên đánh hay nên hòa?\", "
            "toàn bộ bô lão đồng thanh đáp \"Quyết đánh!\". Hưng Đạo Vương Trần Quốc Tuấn soạn \"Hịch tướng sĩ\" "
            "– một áng hùng văn khích lệ tinh thần quyết chiến quyết thắng."
        ),
        "full_wiki": (
            "Nhà Trần (1226–1400) – 175 năm với 13 đời vua. Ba cuộc kháng chiến chống Mông – Nguyên:\n\n"
            "Lần 1 (1258):\n"
            "• 1/1258: Quân Mông Cổ (Uriyangkhadai) tiến vào Thăng Long. Vua Trần Thái Tông thực hiện \"vườn không nhà trống\".\n"
            "• Quân ta phản công tại Đông Bộ Đầu (Hà Nội), quân Mông Cổ thua, rút lui.\n\n"
            "Lần 2 (1285):\n"
            "• Khoảng 50 vạn quân Nguyên do Thoát Hoan chỉ huy từ phía Bắc và Toa Đô từ phía Nam kẹp vào.\n"
            "• Đại hội Diên Hồng (1/1285): Vua Trần Nhân Tông hội kiến các bô lão, toàn dân quyết tâm kháng chiến.\n"
            "• Trần Quốc Tuấn soạn \"Hịch tướng sĩ\" cổ vũ quân sĩ.\n"
            "• Phản công: Tây Kết, Hàm Tử, Chương Dương, Thăng Long. Toa Đô bị giết, Thoát Hoan chạy về nước.\n\n"
            "Lần 3 (1287–1288):\n"
            "• Nguyên Thế Tổ lại sai Thoát Hoan xâm lược lần thứ ba.\n"
            "• Trận Vân Đồn (cuối 1287): Trần Khánh Dư đánh chặn đoàn thuyền lương của Trương Văn Hổ.\n"
            "• Trận Bạch Đằng (4/1288): Trần Quốc Tuấn tái sử dụng chiến thuật cọc gỗ của Ngô Quyền, "
            "tiêu diệt toàn bộ đoàn thuyền của Ô Mã Nhi.\n\n"
            "Bài học lịch sử:\n"
            "• Đoàn kết toàn dân là nguồn sức mạnh tổng hợp không thể vượt qua.\n"
            "• Chiến thuật linh hoạt: lùi để bảo toàn lực lượng, phản công khi địch suy yếu.\n"
            "• Kết hợp chiến tranh du kích với tiêu diệt sinh lực địch quy mô lớn."
        ),
    },
    {
        "period": "Năm 1428 – Năm 1527",
        "category": "vietnam",
        "title": "Nhà Lê Sơ – Đỉnh cao của nhà nước phong kiến Việt Nam",
        "basic": (
            "Sau 10 năm kháng chiến (1418–1428), Lê Lợi đánh đuổi quân Minh, lập nhà Lê Sơ. "
            "Dưới thời Lê Thánh Tông (1460–1497), đất nước phát triển hưng thịnh nhất: "
            "ban hành Bộ luật Hồng Đức (1483), tổ chức bộ máy nhà nước hoàn chỉnh, thực hiện nhiều cuộc Nam tiến mở rộng lãnh thổ."
        ),
        "advanced": (
            "Bộ luật Hồng Đức (Quốc triều hình luật, 1483) là thành tựu pháp lý xuất sắc nhất của phong kiến Việt Nam: "
            "bảo vệ quyền lợi của phụ nữ (quyền ly hôn, thừa kế), quy định rõ trách nhiệm quan lại, xử lý tham nhũng nghiêm minh. "
            "Bộ luật này tiến bộ hơn nhiều so với luật pháp phong kiến đương thời ở châu Á."
        ),
        "full_wiki": (
            "Nhà Lê Sơ (1428–1527) – 100 năm với 10 đời vua. Những thành tựu nổi bật:\n\n"
            "1. Chính trị – Pháp luật:\n"
            "• Lê Thái Tổ (Lê Lợi): Xây dựng nhà nước sau chiến tranh, ban \"Bình Ngô đại cáo\" (1428) – Tuyên ngôn độc lập thứ hai.\n"
            "• Lê Thánh Tông: Cải cách hành chính toàn diện, chia đất nước thành 13 đạo thừa tuyên, "
            "tập trung quyền lực vào tay vua, xóa bỏ chức tể tướng và các vương hầu.\n"
            "• Bộ luật Hồng Đức (1483): Bảo vệ quyền lợi của người dân, đặc biệt là phụ nữ (quyền thừa kế, ly hôn khi bị bạo hành).\n\n"
            "2. Giáo dục – Khoa cử:\n"
            "• Phát triển hệ thống giáo dục từ trung ương đến địa phương.\n"
            "• Định kỳ tổ chức thi Hội, thi Đình 3 năm/lần. Dựng bia Tiến sĩ tại Văn Miếu từ 1484.\n"
            "• Thành lập Hội Tao Đàn (1495) – tập hợp 28 nhà thơ giỏi, Lê Thánh Tông làm Tao Đàn nguyên súy.\n\n"
            "3. Kinh tế – Xã hội:\n"
            "• Phép quân điền: Chia đều ruộng đất cho nông dân theo định kỳ 6 năm.\n"
            "• Khuyến khích khai hoang, phát triển thủ công nghiệp và buôn bán.\n\n"
            "4. Đối ngoại – Quân sự:\n"
            "• Năm 1471: Lê Thánh Tông thân chinh đánh Chiêm Thành, mở mang bờ cõi đến Bình Định.\n"
            "• Năm 1479: Đánh thắng Lào, bảo vệ vùng Tây Bắc.\n"
            "• Bản đồ Hồng Đức (1490) vẽ toàn bộ lãnh thổ Đại Việt – tác phẩm địa lý học xuất sắc."
        ),
    },

    # --- Cận đại – Pháp thuộc ---
    {
        "period": "Năm 1858 – Năm 1884",
        "category": "vietnam",
        "title": "Thực dân Pháp xâm lược và nhà Nguyễn đầu hàng",
        "basic": (
            "Ngày 1/9/1858, liên quân Pháp – Tây Ban Nha nổ súng tấn công Đà Nẵng, mở đầu cuộc xâm lược Việt Nam. "
            "Triều đình Nguyễn từng bước nhượng bộ và ký các hiệp ước: Nhâm Tuất (1862), Giáp Tuất (1874), Nhâm Thân (1883), Giáp Thân (1884), "
            "chính thức thừa nhận quyền bảo hộ của Pháp trên toàn Việt Nam."
        ),
        "advanced": (
            "Sự thất bại của nhà Nguyễn xuất phát từ nhiều nguyên nhân: chính sách \"bế quan tỏa cảng\" lạc hậu, "
            "không tiếp thu khoa học kỹ thuật phương Tây, không có đường lối kháng chiến nhất quán. "
            "Sự hèn nhát của triều đình tương phản hoàn toàn với tinh thần chiến đấu kiên cường của nhân dân tại các phòng tuyến Đà Nẵng, Gia Định, "
            "qua các lãnh tụ như Nguyễn Tri Phương, Hoàng Diệu, Trương Định."
        ),
        "full_wiki": (
            "Nguyên nhân Pháp xâm lược Việt Nam:\n"
            "• Kinh tế: Tư bản Pháp cần thị trường tiêu thụ hàng hóa và nguyên liệu cho công nghiệp.\n"
            "• Địa chính trị: Việt Nam là cửa ngõ vào vùng Nam Á và Trung Quốc.\n"
            "• Tôn giáo: Lấy cớ bảo vệ các giáo sĩ và tín đồ Thiên Chúa giáo bị nhà Nguyễn đàn áp.\n\n"
            "Quá trình xâm lược:\n"
            "• 1/9/1858: Tấn công Đà Nẵng – thất bại do quân dân ta chống cự mạnh mẽ.\n"
            "• 2/1859: Pháp chuyển hướng, đánh thành Gia Định.\n"
            "• 5/6/1862: Hòa ước Nhâm Tuất – triều đình nhường 3 tỉnh miền Đông Nam Kỳ.\n"
            "• 1867: Pháp chiếm nốt 3 tỉnh miền Tây Nam Kỳ.\n"
            "• 1882–1883: Pháp tấn công ra Bắc Kỳ (chiếm Hà Nội lần 2).\n"
            "• 25/8/1883: Hòa ước Quý Mùi (Harmand) – triều đình chấp nhận quyền bảo hộ của Pháp.\n"
            "• 6/6/1884: Hòa ước Giáp Thân (Patenôtre) – Việt Nam mất độc lập hoàn toàn.\n\n"
            "Phong trào kháng chiến của nhân dân:\n"
            "• Trương Định: Chống lệnh bãi binh của triều đình, tiếp tục chiến đấu ở Gò Công đến 1864.\n"
            "• Nguyễn Trung Trực: Đốt cháy tàu Espérance (1861), bị bắt và hy sinh anh dũng (1868).\n"
            "• Phong trào Cần Vương (1885–1896): Vua Hàm Nghi ban chiếu Cần Vương, kêu gọi sĩ phu và nhân dân giúp vua chống Pháp."
        ),
    },
    {
        "period": "Năm 1919 – Năm 1930",
        "category": "vietnam",
        "title": "Phong trào yêu nước và sự ra đời của Đảng Cộng sản Việt Nam",
        "basic": (
            "Sau Chiến tranh thế giới thứ nhất, phong trào yêu nước Việt Nam phát triển mạnh mẽ với hai khuynh hướng: "
            "tư sản (Phan Bội Châu, Phan Châu Trinh) và vô sản (Nguyễn Ái Quốc). "
            "Ngày 3/2/1930, Đảng Cộng sản Việt Nam được thành lập tại Hương Cảng (Hồng Kông) dưới sự chủ trì của Nguyễn Ái Quốc, "
            "đánh dấu bước ngoặt lịch sử trong phong trào giải phóng dân tộc."
        ),
        "advanced": (
            "Sự ra đời của Đảng Cộng sản Việt Nam chấm dứt tình trạng khủng hoảng về đường lối và giai cấp lãnh đạo. "
            "Cương lĩnh chính trị đầu tiên (do Nguyễn Ái Quốc soạn thảo) xác định: làm cách mạng tư sản dân quyền và thổ địa cách mạng, "
            "đi đến xã hội cộng sản. Lực lượng cách mạng là công nhân, nông dân cùng với các tầng lớp tiểu tư sản và tư sản dân tộc."
        ),
        "full_wiki": (
            "Bối cảnh lịch sử (1919–1930):\n"
            "Sau Chiến tranh thế giới thứ nhất, mâu thuẫn xã hội Việt Nam ngày càng gay gắt. Pháp tăng cường bóc lột thuộc địa, "
            "giai cấp công nhân và nông dân cực khổ. Hàng loạt phong trào yêu nước nổ ra.\n\n"
            "Các khuynh hướng cứu nước:\n"
            "1. Khuynh hướng tư sản:\n"
            "• Phan Bội Châu (1867–1940): Phong trào Đông Du (1905–1909) đưa thanh niên sang Nhật học. "
            "Thành lập Việt Nam Quang Phục Hội (1912) theo chủ nghĩa dân chủ cộng hòa.\n"
            "• Phan Châu Trinh (1872–1926): Chủ trương cải cách, dựa vào Pháp để đánh đổ phong kiến. "
            "Phong trào Duy Tân ở Trung Kỳ (1906–1908).\n"
            "• Hạn chế: Cả hai đều thất bại vì thiếu một giai cấp lãnh đạo tiên phong và đường lối cách mạng đúng đắn.\n\n"
            "2. Khuynh hướng vô sản (Nguyễn Ái Quốc):\n"
            "• 1911: Nguyễn Tất Thành (Hồ Chí Minh) rời Việt Nam tìm đường cứu nước.\n"
            "• 1919: Gửi Bản yêu sách 8 điểm đến Hội nghị Versailles.\n"
            "• 1920: Đọc \"Sơ thảo luận cương về vấn đề dân tộc và thuộc địa\" của Lenin → Tìm ra con đường cứu nước đúng đắn.\n"
            "• 1924–1927: Tại Quảng Châu, sáng lập Hội Việt Nam Cách mạng Thanh niên, đào tạo cán bộ cách mạng.\n"
            "• 1930: Hợp nhất 3 tổ chức cộng sản, thành lập Đảng Cộng sản Việt Nam (3/2/1930).\n\n"
            "Phong trào 1930–1931 và Xô viết Nghệ – Tĩnh:\n"
            "• Dưới sự lãnh đạo của Đảng, phong trào công – nông bùng nổ rầm rộ, đỉnh cao là Xô viết Nghệ – Tĩnh.\n"
            "• Lần đầu tiên chính quyền công nông xuất hiện ở một số huyện Nghệ An và Hà Tĩnh.\n"
            "• Tuy thất bại nhưng đây là \"cuộc diễn tập đầu tiên\" của Đảng và quần chúng."
        ),
    },
    {
        "period": "Năm 1939 – Năm 1945",
        "category": "vietnam",
        "title": "Cách mạng tháng Tám 1945 – Nước Việt Nam Dân chủ Cộng hòa ra đời",
        "basic": (
            "Cách mạng tháng Tám 1945 là một cuộc cách mạng vĩ đại, mang tính nhân dân sâu sắc. "
            "Trong vòng 15 ngày (14–28/8/1945), nhân dân Việt Nam dưới sự lãnh đạo của Đảng và Mặt trận Việt Minh đã "
            "nổi dậy giành chính quyền trên cả nước. Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, "
            "khai sinh nước Việt Nam Dân chủ Cộng hòa."
        ),
        "advanced": (
            "Thành công của Cách mạng tháng Tám xuất phát từ: đường lối cách mạng đúng đắn của Đảng, "
            "lực lượng cách mạng được chuẩn bị qua nhiều năm, và thời cơ chín muồi (Nhật đầu hàng Đồng minh ngày 15/8/1945). "
            "Đây là cuộc cách mạng \"long trời lở đất\", đưa Việt Nam từ địa vị thuộc địa thành quốc gia độc lập, "
            "nhân dân từ thân phận nô lệ trở thành người làm chủ đất nước."
        ),
        "full_wiki": (
            "Bối cảnh:\n"
            "• Chiến tranh thế giới thứ hai bước vào giai đoạn cuối (1944–1945).\n"
            "• Phát xít Nhật đảo chính Pháp (9/3/1945), độc chiếm Đông Dương.\n"
            "• 7/5/1945: Đức đầu hàng. 15/8/1945: Nhật đầu hàng Đồng minh vô điều kiện → thời cơ ngàn năm có một.\n\n"
            "Chuẩn bị cách mạng:\n"
            "• 1941: Hồ Chí Minh về nước, thành lập Mặt trận Việt Minh.\n"
            "• Xây dựng căn cứ địa Việt Bắc, lực lượng vũ trang (Cứu quốc quân, Việt Nam tuyên truyền giải phóng quân).\n"
            "• Cao trào \"Kháng Nhật cứu nước\" (3/1945).\n\n"
            "Diễn biến Tổng khởi nghĩa (14–28/8/1945):\n"
            "• 13/8/1945: Ủy ban Khởi nghĩa toàn quốc ban bố lệnh Tổng khởi nghĩa.\n"
            "• 19/8/1945: Hà Nội giành chính quyền thắng lợi.\n"
            "• 23/8/1945: Huế giành chính quyền, vua Bảo Đại thoái vị.\n"
            "• 25/8/1945: Sài Gòn giành chính quyền.\n"
            "• 2/9/1945: Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình, Hà Nội.\n\n"
            "Ý nghĩa lịch sử:\n"
            "• Chấm dứt hơn 80 năm thực dân Pháp thống trị, gần 5 năm quân phiệt Nhật chiếm đóng.\n"
            "• Khai sinh nhà nước Việt Nam Dân chủ Cộng hòa – nhà nước dân chủ nhân dân đầu tiên ở Đông Nam Á.\n"
            "• Mở ra kỷ nguyên mới: độc lập dân tộc gắn liền với chủ nghĩa xã hội.\n"
            "• Cổ vũ mạnh mẽ phong trào giải phóng dân tộc trên toàn thế giới."
        ),
    },
    {
        "period": "Năm 1945 – Năm 1954",
        "category": "vietnam",
        "title": "Kháng chiến chống Pháp – Chiến thắng Điện Biên Phủ lừng lẫy năm châu",
        "basic": (
            "Ngay sau khi độc lập, Pháp quay lại xâm lược Việt Nam. "
            "Nhân dân Việt Nam tiến hành cuộc kháng chiến toàn quốc (19/12/1946) với đường lối: toàn dân, toàn diện, lâu dài, dựa vào sức mình là chính. "
            "Kết thúc bằng Chiến dịch Điện Biên Phủ (13/3–7/5/1954), đập tan tập đoàn cứ điểm Điện Biên Phủ, buộc Pháp ký Hiệp định Giơnevơ."
        ),
        "advanced": (
            "Chiến thắng Điện Biên Phủ là đỉnh cao của cuộc kháng chiến chống Pháp, mang ý nghĩa toàn cầu. "
            "Đại tướng Võ Nguyên Giáp quyết định thay đổi chiến thuật từ \"đánh nhanh thắng nhanh\" sang \"đánh chắc tiến chắc\", "
            "đây là quyết định sáng suốt, kiên quyết và chính xác. Chiến thắng này chấn động địa cầu, "
            "đặt dấu chấm hết cho chủ nghĩa thực dân kiểu cũ."
        ),
        "full_wiki": (
            "Giai đoạn 1945–1946 – Đấu tranh bảo vệ chính quyền cách mạng non trẻ:\n"
            "• Ở miền Nam: Pháp nổ súng tái chiếm (23/9/1945). Nhân dân Nam Bộ kháng chiến.\n"
            "• Ở miền Bắc: Quân Tưởng kéo vào (25 vạn quân). Ta dùng sách lược hòa với Tưởng, tập trung đánh Pháp.\n"
            "• 6/3/1946: Ký Hiệp định Sơ bộ, thỏa hiệp tạm thời với Pháp.\n\n"
            "Kháng chiến toàn quốc (1946–1954):\n"
            "• 19/12/1946: Hồ Chủ tịch ra Lời kêu gọi toàn quốc kháng chiến.\n"
            "• 1947: Chiến dịch Việt Bắc Thu – Đông. Pháp bất ngờ tấn công căn cứ Việt Bắc nhưng thất bại.\n"
            "• 1950: Chiến dịch Biên giới Thu – Đông. Ta chủ động tấn công, giải phóng đường biên giới Việt – Trung, "
            "khai thông liên lạc quốc tế.\n"
            "• 1951–1953: Các chiến dịch lớn trên khắp chiến trường, tiêu hao sinh lực địch.\n\n"
            "Chiến dịch Điện Biên Phủ (13/3–7/5/1954):\n"
            "• Pháp xây dựng tập đoàn cứ điểm Điện Biên Phủ (49 cứ điểm, 16.000 quân) được coi là \"pháo đài bất khả xâm phạm\".\n"
            "• Chiến lược của ta: Kéo pháo vào trận địa (đưa 200 khẩu pháo vượt núi cao).\n"
            "• 13/3/1954: Mở màn chiến dịch, tấn công Him Lam, Độc Lập, Bản Kéo.\n"
            "• 7/5/1954: Toàn bộ tập đoàn cứ điểm sụp đổ, tướng De Castries ra hàng.\n\n"
            "Hiệp định Giơnevơ (21/7/1954):\n"
            "• Công nhận độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam, Lào, Campuchia.\n"
            "• Tạm thời chia đôi Việt Nam tại vĩ tuyến 17. Tổng tuyển cử thống nhất vào 7/1956.\n"
            "• Pháp phải rút toàn bộ quân trong 300 ngày."
        ),
    },
    {
        "period": "Năm 1954 – Năm 1975",
        "category": "vietnam",
        "title": "Kháng chiến chống Mỹ – Giải phóng miền Nam, thống nhất đất nước",
        "basic": (
            "Sau 1954, Mỹ thay Pháp can thiệp vào miền Nam Việt Nam. Nhân dân Việt Nam tiến hành cuộc kháng chiến chống Mỹ cứu nước. "
            "Đỉnh cao là Chiến dịch Hồ Chí Minh (26/4–30/4/1975), giải phóng Sài Gòn, kết thúc 21 năm kháng chiến, "
            "thống nhất đất nước sau 20 năm chia cắt."
        ),
        "advanced": (
            "Cuộc kháng chiến chống Mỹ là cuộc chiến tranh nhân dân vĩ đại nhất trong lịch sử. "
            "Mỹ đã sử dụng hơn 50% lực lượng không quân chiến lược, 31% hải quân, và hơn 500.000 quân nhưng vẫn thất bại. "
            "Bài học \"Đánh cho Mỹ cút, đánh cho ngụy nhào\" (Hồ Chí Minh) thể hiện tư duy chiến lược thiên tài: "
            "kết hợp đấu tranh quân sự, chính trị và ngoại giao."
        ),
        "full_wiki": (
            "Giai đoạn 1954–1965 – Đấu tranh chống chế độ Mỹ – Diệm:\n"
            "• 1954–1960: Mỹ dựng chính quyền Ngô Đình Diệm, phá hoại Hiệp định Giơnevơ, \"tố Cộng diệt Cộng\".\n"
            "• 20/12/1960: Mặt trận Dân tộc giải phóng miền Nam Việt Nam ra đời.\n"
            "• 1963: Đảo chính lật đổ Ngô Đình Diệm. Mỹ tăng cường can thiệp.\n\n"
            "Giai đoạn 1965–1968 – Chiến tranh cục bộ:\n"
            "• Mỹ ào ạt đưa quân chiến đấu vào miền Nam (đến 1968: hơn 500.000 quân Mỹ).\n"
            "• Chiến lược \"Chiến tranh cục bộ\": tìm và diệt lực lượng chủ lực Việt Cộng.\n"
            "• Tổng tiến công và nổi dậy Mậu Thân (1–2/1968): Làm lung lay ý chí của Mỹ, buộc Mỹ phải ngồi vào bàn đàm phán.\n\n"
            "Giai đoạn 1969–1973 – Việt Nam hóa chiến tranh:\n"
            "• Mỹ rút dần quân chiến đấu, sử dụng quân đội Sài Gòn làm công cụ chiến tranh.\n"
            "• Chiến dịch phòng thủ đường 9 – Nam Lào (1971): Đánh bại chiến lược \"Việt Nam hóa chiến tranh\".\n"
            "• Hiệp định Paris (27/1/1973): Mỹ cam kết rút quân, chấm dứt chiến tranh.\n\n"
            "Giai đoạn 1973–1975 – Tổng tấn công và nổi dậy:\n"
            "• Từ 1973–1974: Quân và dân ta liên tục tấn công, giải phóng nhiều vùng đất.\n"
            "• 10/3/1975: Chiến dịch Tây Nguyên bắt đầu (giải phóng Buôn Ma Thuột).\n"
            "• Tháng 3–4/1975: Quét sạch miền Trung, miền Đông Nam Bộ.\n"
            "• 26/4–30/4/1975: Chiến dịch Hồ Chí Minh – Giải phóng Sài Gòn.\n"
            "• 11 giờ 30 phút ngày 30/4/1975: Lá cờ giải phóng tung bay trên Dinh Độc Lập, kết thúc chiến tranh."
        ),
    },
    {
        "period": "Năm 1986",
        "category": "vietnam",
        "title": "Đại hội Đảng VI – Bước ngoặt Đổi Mới toàn diện đất nước",
        "basic": (
            "Đại hội Đảng toàn quốc lần thứ VI (12/1986) đề ra đường lối Đổi mới toàn diện đất nước. "
            "Trọng tâm là đổi mới kinh tế, chuyển từ cơ chế kế hoạch hóa tập trung, quan liêu, bao cấp "
            "sang nền kinh tế hàng hóa nhiều thành phần, vận hành theo cơ chế thị trường có sự quản lý của Nhà nước."
        ),
        "advanced": (
            "Đổi mới là \"nhìn thẳng vào sự thật, đánh giá đúng sự thật, nói rõ sự thật\". "
            "Đây là quyết định sáng suốt và dũng cảm của Đảng, xuất phát từ nhận thức khách quan về thực trạng đất nước "
            "và xu thế phát triển của thế giới. Sau Đổi mới, Việt Nam thoát khỏi khủng hoảng kinh tế – xã hội, "
            "đạt tốc độ tăng trưởng GDP bình quân 7–8%/năm trong nhiều thập kỷ."
        ),
        "full_wiki": (
            "Bối cảnh trước Đổi mới:\n"
            "• Sau 1975, Việt Nam thống nhất trong điều kiện chiến tranh tàn phá nặng nề, cô lập về kinh tế (Mỹ cấm vận).\n"
            "• Nền kinh tế kế hoạch hóa tập trung bộc lộ nhiều yếu kém: thiếu hàng hóa, lạm phát phi mã, đời sống nhân dân rất khó khăn.\n"
            "• Chiến tranh biên giới Tây Nam (1978–1979) và biên giới phía Bắc (1979) làm kiệt sức thêm.\n"
            "• Đại hội V (1982) và VI (1986): Đảng nhận ra sai lầm, quyết định đổi mới tư duy.\n\n"
            "Nội dung Đổi mới:\n"
            "1. Về kinh tế:\n"
            "• Xóa bỏ cơ chế kế hoạch hóa tập trung, quan liêu, bao cấp.\n"
            "• Phát triển kinh tế hàng hóa nhiều thành phần: nhà nước, tập thể, tư nhân, có vốn đầu tư nước ngoài.\n"
            "• Thực hiện chính sách mở cửa, thu hút đầu tư nước ngoài (Luật Đầu tư nước ngoài 1987).\n"
            "• Khoán 10 (1988): Giao quyền sử dụng đất cho hộ nông dân, giải phóng sức lao động nông thôn.\n\n"
            "2. Về chính trị – xã hội:\n"
            "• Dân chủ hóa đời sống xã hội, phát huy quyền làm chủ của nhân dân.\n"
            "• Đổi mới hệ thống pháp luật, cải cách hành chính.\n\n"
            "3. Về đối ngoại:\n"
            "• Thực hiện đường lối đối ngoại độc lập, tự chủ, đa dạng hóa, đa phương hóa.\n"
            "• 1995: Gia nhập ASEAN, bình thường hóa quan hệ với Mỹ.\n\n"
            "Kết quả:\n"
            "• Thoát khỏi khủng hoảng kinh tế – xã hội trầm trọng.\n"
            "• GDP tăng trưởng mạnh, đời sống nhân dân cải thiện rõ rệt.\n"
            "• Vị thế Việt Nam trên trường quốc tế được nâng cao."
        ),
    },

    # ========================================================================
    # LỊCH SỬ THẾ GIỚI
    # ========================================================================
    {
        "period": "Năm 1917",
        "category": "world",
        "title": "Cách mạng tháng Mười Nga – Nhà nước Xã hội chủ nghĩa đầu tiên ra đời",
        "basic": (
            "Ngày 7/11/1917 (25/10 theo lịch cũ), cuộc Cách mạng tháng Mười Nga thắng lợi. "
            "Giai cấp vô sản Nga do Đảng Bônsêvích lãnh đạo lật đổ chính phủ tư sản lâm thời, "
            "thiết lập chính quyền Xô viết – nhà nước Xã hội chủ nghĩa đầu tiên trên thế giới."
        ),
        "advanced": (
            "Cách mạng tháng Mười Nga có ý nghĩa lịch sử toàn cầu: phá vỡ mắt xích yếu nhất trong sợi dây đế quốc chủ nghĩa, "
            "mở ra con đường giải phóng cho các dân tộc bị áp bức trên toàn thế giới. "
            "Lý luận \"Chủ nghĩa đế quốc là giai đoạn tột cùng của chủ nghĩa tư bản\" (Lenin) được kiểm chứng trong thực tiễn."
        ),
        "full_wiki": (
            "Bối cảnh:\n"
            "• Nước Nga tham gia Chiến tranh thế giới thứ nhất (1914–1917), chịu thất bại nặng nề, kinh tế kiệt quệ.\n"
            "• 3/1917: Cách mạng tháng Hai lật đổ chế độ Nga hoàng, lập Chính phủ lâm thời tư sản.\n"
            "• Chính phủ lâm thời tiếp tục chiến tranh → nhân dân bất mãn.\n\n"
            "Hai giai đoạn cách mạng:\n"
            "• Cách mạng tháng Hai (3/1917): Lật đổ Nga hoàng Nicolas II. Nước Nga có hai chính quyền song song: "
            "Chính phủ lâm thời tư sản và các Xô viết công – nông – binh.\n"
            "• Cách mạng tháng Mười (7/11/1917): Lenin về nước lãnh đạo, Đảng Bônsêvích tổ chức khởi nghĩa vũ trang. "
            "Cung điện Mùa Đông bị chiếm, Chính phủ lâm thời sụp đổ.\n\n"
            "Ý nghĩa:\n"
            "• Đối với nước Nga: Mở ra kỷ nguyên xây dựng xã hội chủ nghĩa, đưa đất nước thoát khỏi chiến tranh đế quốc.\n"
            "• Đối với thế giới: Cổ vũ mạnh mẽ phong trào cách mạng vô sản và phong trào giải phóng dân tộc trên toàn cầu. "
            "Mở ra xu thế phát triển mới của lịch sử thế giới.\n"
            "• Đối với Việt Nam: Năm 1920, Nguyễn Ái Quốc đọc Sơ thảo luận cương của Lenin, "
            "tìm ra con đường cứu nước đúng đắn – đi theo con đường Cách mạng tháng Mười."
        ),
    },
    {
        "period": "Năm 1939 – Năm 1945",
        "category": "world",
        "title": "Chiến tranh thế giới thứ hai – Thảm họa nhân loại và bài học lịch sử",
        "basic": (
            "Chiến tranh thế giới thứ hai (1/9/1939 – 2/9/1945) là cuộc chiến tranh quy mô lớn nhất trong lịch sử nhân loại. "
            "Khởi đầu từ việc phát xít Đức tấn công Ba Lan, chiến tranh lan rộng ra toàn cầu với 2 phe: "
            "khối phát xít (Đức, Ý, Nhật) và khối Đồng minh (Anh, Pháp, Liên Xô, Mỹ). "
            "Kết thúc với sự thất bại hoàn toàn của phe phát xít."
        ),
        "advanced": (
            "Chiến tranh thế giới thứ hai gây ra 70 triệu người chết (2/3 là dân thường), "
            "hàng triệu người bị tàn phế, nhiều thành phố châu Âu và châu Á bị san bằng. "
            "Tội ác Holocaust (tiêu diệt 6 triệu người Do Thái) là vết nhơ không thể xóa bỏ trong lịch sử nhân loại. "
            "Sau chiến tranh, trật tự thế giới hai cực Yalta hình thành, mở ra thời kỳ Chiến tranh lạnh."
        ),
        "full_wiki": (
            "Nguyên nhân:\n"
            "• Nguyên nhân sâu xa: Mâu thuẫn giữa các cường quốc tư bản về thị trường và thuộc địa sau Chiến tranh thế giới thứ nhất.\n"
            "• Nguyên nhân trực tiếp: Sự trỗi dậy của chủ nghĩa phát xít (Đức, Ý, Nhật) và chính sách \"dung túng\" của Anh, Pháp.\n"
            "• Mầm mống: Hòa ước Versailles (1919) áp đặt các điều kiện khắc nghiệt lên Đức → Đức phục thù.\n\n"
            "Diễn biến chính:\n"
            "• 1/9/1939: Đức tấn công Ba Lan → Anh, Pháp tuyên chiến với Đức.\n"
            "• 5–6/1940: Đức chiếm Bỉ, Hà Lan, Pháp đầu hàng.\n"
            "• 22/6/1941: Đức tấn công Liên Xô (Chiến dịch Barbarossa) → Liên Xô gia nhập Đồng minh.\n"
            "• 7/12/1941: Nhật tấn công Trân Châu Cảng → Mỹ gia nhập chiến tranh.\n"
            "• 2/2/1943: Trận Stalingrad kết thúc – Đức đại bại, bước ngoặt của chiến tranh.\n"
            "• 6/6/1944: Mặt trận thứ hai mở ở Tây Âu (Đổ bộ Normandy).\n"
            "• 5/1945: Đức đầu hàng vô điều kiện.\n"
            "• 6 và 9/8/1945: Mỹ ném bom nguyên tử xuống Hiroshima và Nagasaki.\n"
            "• 2/9/1945: Nhật đầu hàng vô điều kiện – Chiến tranh thế giới thứ hai kết thúc.\n\n"
            "Hậu quả và ý nghĩa:\n"
            "• Khoảng 70 triệu người thiệt mạng, kinh tế thế giới bị tàn phá nặng nề.\n"
            "• Liên Hợp Quốc được thành lập (24/10/1945) để duy trì hòa bình thế giới.\n"
            "• Trật tự Yalta hình thành: Thế giới phân chia thành hai cực Mỹ – Xô.\n"
            "• Phong trào giải phóng dân tộc được cổ vũ mạnh mẽ sau sự suy yếu của các đế quốc thực dân."
        ),
    },
    {
        "period": "Năm 1945 – Năm 1991",
        "category": "world",
        "title": "Chiến tranh lạnh – Cuộc đối đầu hai cực Đông – Tây",
        "basic": (
            "Chiến tranh lạnh (1947–1991) là cuộc đối đầu toàn diện (chính trị, kinh tế, quân sự, ý thức hệ) "
            "giữa hai siêu cường Mỹ và Liên Xô, đứng đầu hai hệ thống tư bản chủ nghĩa và xã hội chủ nghĩa. "
            "Mặc dù không có chiến tranh trực tiếp giữa hai nước, nhưng nhiều cuộc chiến tranh cục bộ đã nổ ra tại Triều Tiên, Việt Nam, Trung Đông..."
        ),
        "advanced": (
            "Chiến tranh lạnh định hình toàn bộ nền chính trị thế giới trong gần nửa thế kỷ. "
            "Cuộc chạy đua vũ trang hạt nhân đẩy nhân loại đến bờ vực của sự hủy diệt (Khủng hoảng tên lửa Cuba, 1962). "
            "Kết thúc Chiến tranh lạnh (1991) với sự tan rã của Liên Xô đã thay đổi hoàn toàn bản đồ địa chính trị toàn cầu."
        ),
        "full_wiki": (
            "Nguồn gốc Chiến tranh lạnh:\n"
            "• Sau Chiến tranh thế giới thứ hai, Mỹ và Liên Xô có lợi ích xung đột ở châu Âu.\n"
            "• 1947: Học thuyết Truman (Mỹ viện trợ cho các nước chống Cộng) và Kế hoạch Marshall (viện trợ kinh tế châu Âu).\n"
            "• Liên Xô lập Cominform (Cục Thông tin Cộng sản, 1947) và Comecon (Hội đồng Tương trợ Kinh tế, 1949).\n\n"
            "Các sự kiện tiêu biểu:\n"
            "• 1949: NATO thành lập (liên minh quân sự phương Tây). Liên Xô thử bom nguyên tử.\n"
            "• 1950–1953: Chiến tranh Triều Tiên – cuộc đối đầu đầu tiên giữa hai cực.\n"
            "• 1955: Khối Warszawa thành lập (liên minh quân sự phía Đông).\n"
            "• 1961: Bức tường Berlin xây dựng chia đôi thành phố.\n"
            "• 1962: Khủng hoảng tên lửa Cuba – thế giới gần như bùng nổ chiến tranh hạt nhân.\n"
            "• 1964–1975: Chiến tranh Việt Nam – Mỹ thất bại.\n"
            "• 1969–1979: Hòa hoãn (Détente) – Mỹ – Xô thương lượng kiểm soát vũ khí hạt nhân.\n"
            "• 1979–1989: Liên Xô xâm lược Afghanistan – Chiến tranh lạnh trở nên căng thẳng trở lại.\n"
            "• 1985: Gorbachev lên cầm quyền, cải tổ (Glasnost và Perestroika).\n"
            "• 11/1989: Bức tường Berlin sụp đổ.\n"
            "• 12/1991: Liên Xô giải thể – Chiến tranh lạnh kết thúc.\n\n"
            "Hệ quả:\n"
            "• Thế giới đơn cực: Mỹ trở thành siêu cường duy nhất.\n"
            "• Liên bang Nga thay thế Liên Xô, gặp nhiều khó khăn kinh tế – chính trị.\n"
            "• Xu thế hòa bình, hợp tác trở thành xu thế chủ đạo nhưng vẫn còn nhiều điểm nóng."
        ),
    },
    {
        "period": "Năm 1947 – Năm 1991",
        "category": "world",
        "title": "Phong trào giải phóng dân tộc – Châu Á, châu Phi, Mỹ Latinh",
        "basic": (
            "Sau Chiến tranh thế giới thứ hai, phong trào giải phóng dân tộc bùng nổ mạnh mẽ. "
            "Đến năm 1960 được gọi là \"Năm châu Phi\" với 17 quốc gia giành độc lập. "
            "Hệ thống thuộc địa của các nước đế quốc châu Âu về cơ bản sụp đổ vào cuối những năm 1970."
        ),
        "advanced": (
            "Phong trào giải phóng dân tộc là một trong những xu thế lớn của thế giới sau Chiến tranh thế giới thứ hai. "
            "Điểm chung của các cuộc cách mạng giải phóng dân tộc: đấu tranh chống chủ nghĩa thực dân, "
            "giành độc lập chủ quyền, phát triển kinh tế. Chiến thắng Điện Biên Phủ (1954) có tác động lớn, "
            "cổ vũ tinh thần các dân tộc bị áp bức trên thế giới."
        ),
        "full_wiki": (
            "Phong trào giải phóng dân tộc (sau 1945):\n\n"
            "Châu Á:\n"
            "• 1945: Nhiều nước Đông Nam Á tuyên bố độc lập (Việt Nam, Indonesia, Philippin).\n"
            "• 1947: Ấn Độ và Pakistan giành độc lập từ Anh.\n"
            "• 1949: Cộng hòa Nhân dân Trung Hoa ra đời.\n"
            "• 1954: Hiệp định Giơnevơ công nhận độc lập của Việt Nam, Lào, Campuchia.\n\n"
            "Châu Phi:\n"
            "• 1952: Ai Cập cách mạng, lật đổ vua Farouk. 1956: Nasser quốc hữu hóa kênh đào Suez.\n"
            "• 1960: Năm châu Phi – 17 nước giành độc lập (trong đó có Cộng hòa Congo, Nigeria, Senegal...).\n"
            "• 1962: Angiêri giành độc lập sau 8 năm chiến tranh với Pháp.\n"
            "• 1975: Angola và Mozambique độc lập, kết thúc chủ nghĩa thực dân Bồ Đào Nha.\n"
            "• 1990: Namibia độc lập.\n"
            "• 1994: Nelson Mandela được bầu làm Tổng thống Nam Phi – xóa bỏ chế độ Apartheid.\n\n"
            "Mỹ Latinh:\n"
            "• 1959: Cách mạng Cuba thắng lợi (Fidel Castro).\n"
            "• Phong trào đấu tranh chống can thiệp của Mỹ ở nhiều nước.\n\n"
            "Đặc điểm chung:\n"
            "• Hình thức đấu tranh đa dạng: vũ trang, chính trị, ngoại giao.\n"
            "• Sự ủng hộ của Liên Xô, Trung Quốc và phong trào tiến bộ thế giới.\n"
            "• Sau khi giành độc lập, phải đối mặt với chủ nghĩa thực dân mới (Neocolonialism)."
        ),
    },
    {
        "period": "Năm 1991 – Năm 2000",
        "category": "world",
        "title": "Trật tự thế giới sau Chiến tranh lạnh – Toàn cầu hóa và xu thế hòa bình",
        "basic": (
            "Sau khi Chiến tranh lạnh kết thúc (1991), thế giới chuyển sang trật tự đa cực phức tạp. "
            "Xu thế hòa bình và hợp tác trở thành chủ đạo, nhưng nhiều điểm nóng vẫn tồn tại (Nam Tư cũ, Trung Đông, Triều Tiên). "
            "Toàn cầu hóa kinh tế và Cách mạng khoa học – công nghệ lần thứ tư tạo ra sự kết nối sâu sắc giữa các quốc gia."
        ),
        "advanced": (
            "Toàn cầu hóa là một quá trình khách quan, vừa tạo ra cơ hội phát triển to lớn vừa đặt ra thách thức gay gắt "
            "cho các nước đang phát triển. Xu thế: hòa bình, hợp tác, phát triển; cạnh tranh kinh tế thay thế chạy đua vũ trang; "
            "vai trò của các tổ chức quốc tế (LHQ, WTO, IMF) ngày càng tăng. "
            "Các quốc gia phải vừa hội nhập vừa bảo vệ độc lập chủ quyền."
        ),
        "full_wiki": (
            "Trật tự thế giới sau Chiến tranh lạnh:\n\n"
            "Đặc điểm:\n"
            "• Thế giới đơn cực nhưng dần chuyển sang đa cực.\n"
            "• Mỹ là siêu cường duy nhất nhưng không thể áp đặt ý chí lên toàn thế giới.\n"
            "• Trung Quốc, Nga, EU ngày càng có vai trò quan trọng.\n\n"
            "Xu thế hòa bình và hợp tác:\n"
            "• Liên Hợp Quốc đóng vai trò quan trọng trong giải quyết xung đột.\n"
            "• Các tổ chức kinh tế quốc tế mở rộng: WTO (thành lập 1995), APEC, G7, G20...\n"
            "• Xu thế liên kết kinh tế khu vực: EU (1993), NAFTA, ASEAN+3...\n\n"
            "Những điểm nóng còn tồn tại:\n"
            "• Chiến tranh vùng Vịnh (1991): Mỹ dẫn đầu liên quân đẩy Iraq khỏi Kuwait.\n"
            "• Xung đột ở Nam Tư cũ (Bosnia, Kosovo, 1992–1999).\n"
            "• Xung đột Trung Đông (Israel – Palestine chưa có giải pháp).\n"
            "• Vụ tấn công khủng bố 11/9/2001: Mỹ phát động \"Cuộc chiến chống khủng bố toàn cầu\".\n\n"
            "Toàn cầu hóa:\n"
            "• Internet và công nghệ thông tin kết nối thế giới.\n"
            "• Thương mại và đầu tư quốc tế bùng nổ.\n"
            "• Môi trường, biến đổi khí hậu trở thành vấn đề toàn cầu cấp bách."
        ),
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# BƯỚC 3: ĐỌC DỮ LIỆU SCANNED, LÀM SẠCH VÀ LỌC RA NHỮNG SỰ KIỆN CÓ CHẤT LƯỢNG
# ─────────────────────────────────────────────────────────────────────────────
SCANNED_FILE = "src/scannedData.js"

def load_scanned_events():
    if not os.path.exists(SCANNED_FILE):
        return []
    with open(SCANNED_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    # Tìm và parse JSON
    match = re.search(r'export const autoTimelineData = (\[[\s\S]*?\]);\s*$', content, re.MULTILINE)
    if not match:
        return []
    return json.loads(match.group(1))


def is_quality_event(event: dict) -> bool:
    """Kiểm tra xem sự kiện có đủ chất lượng không."""
    fw = event.get('full_wiki', '')
    title = event.get('title', '')
    # Lọc bỏ những sự kiện:
    # - Quá ngắn (< 80 ký tự full_wiki)
    if len(fw) < 80:
        return False
    # - Toàn chữ viết tắt hoặc ký tự đặc biệt
    if re.search(r'^[\W\d\s]+$', title):
        return False
    # - Có nhiều ký tự nhiễu (số trang, OCR lỗi)
    noise_ratio = len(re.findall(r'[A-Z]{3,}|\d{3,}', fw)) / max(len(fw.split()), 1)
    if noise_ratio > 0.3:
        return False
    # - Nội dung về đề thi, bản quyền sách
    skip_words = ['mã 301', 'đề thi THPT', 'In xong và nộp', 'Chịu trách nhiệm', 'nộp lưu chiểu',
                  'CHRONO-Z FRAMEWORK', 'bài luận', 'Portfolio', 'Monash', 'timdapan']
    if any(w.lower() in fw.lower() for w in skip_words):
        return False
    return True


def clean_event(event: dict, new_id: int) -> dict:
    """Làm sạch và chuẩn hóa một sự kiện."""
    fw   = clean_text(event.get('full_wiki', ''))
    basic = clean_text(event.get('basic', ''))
    adv   = clean_text(event.get('advanced', ''))

    return {
        "id":        new_id,
        "period":    clean_period(event.get('period', '')),
        "source":    event.get('source', 'Sách giáo khoa'),
        "category":  event.get('category', 'vietnam'),
        "title":     make_readable_title(event.get('title', ''), event.get('period', '')),
        "basic":     basic,
        "advanced":  adv,
        "full_wiki": fw,
        "wikiLinks": {}
    }


# ─────────────────────────────────────────────────────────────────────────────
# BƯỚC 4: KẾT HỢP VÀ XUẤT RA FILE
# ─────────────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("CLEAN & BUILD — Xây dựng kho dữ liệu sạch")
    print("=" * 60)

    # Chuẩn bị dữ liệu được biên soạn thủ công (chất lượng cao)
    curated_with_id = []
    for i, ev in enumerate(CURATED_EVENTS, start=1):
        ev_copy = dict(ev)
        ev_copy['id'] = i
        ev_copy['source'] = 'Biên soạn chuẩn – SGK 10/11/12'
        ev_copy['wikiLinks'] = {}
        curated_with_id.append(ev_copy)
    print(f"\n[Biên soạn chuẩn] {len(curated_with_id)} sự kiện")

    # Đọc và lọc dữ liệu quét tự động
    scanned = load_scanned_events()
    qualified = [e for e in scanned if is_quality_event(e)]
    print(f"[Quét tự động] {len(scanned)} sự kiện → sau lọc: {len(qualified)} sự kiện")

    cleaned_scanned = [clean_event(e, i + len(curated_with_id) + 1)
                       for i, e in enumerate(qualified)]

    # Gộp lại
    all_events = curated_with_id + cleaned_scanned

    # Phân loại và sắp xếp
    vn  = sorted([e for e in all_events if e['category'] == 'vietnam'], key=lambda x: x['period'])
    wld = sorted([e for e in all_events if e['category'] == 'world'],   key=lambda x: x['period'])
    final = vn + wld

    print(f"\nKẾT QUẢ:")
    print(f"  Lịch sử Việt Nam : {len(vn):>3} sự kiện")
    print(f"  Lịch sử Thế giới : {len(wld):>3} sự kiện")
    print(f"  TỔNG CỘNG        : {len(final):>3} sự kiện")

    # Ghi ra file JS
    out_file = "src/scannedData.js"
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(f"// CHRONO-Z BIG DATA – {len(final)} mốc lịch sử – Phiên bản đã làm sạch\n")
        f.write(f"// Biên soạn chuẩn: {len(curated_with_id)} | Quét tự động (đã lọc): {len(cleaned_scanned)}\n")
        f.write("export const autoTimelineData = ")
        json.dump(final, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    kb = os.path.getsize(out_file) / 1024
    print(f"\n  Đã lưu: {out_file} ({kb:.1f} KB)")
    print("=" * 60)


if __name__ == "__main__":
    main()
