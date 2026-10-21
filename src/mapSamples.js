// 4 bản đồ nền mặc định (theo yêu cầu dự án). Khi Admin tạo bản đồ CMS cùng
// legacy_id, bản đồ CMS sẽ thay thế; dữ liệu ở đây chỉ là khởi điểm an toàn.
// x,y là % trên khung nhìn bản đồ; event_key khớp khóa ổn định của Timeline ('ev-N').
export const LEGACY_MAPS = [
  {
    key: 'map-eu-1914', legacy_id: 'map-eu-1914', title: 'Châu Âu năm 1914', year: 1914,
    description: 'Bản đồ châu Âu trước Chiến tranh thế giới thứ nhất: bloc đối đầu, khủng hoảng tháng Bảy.',
    imageUrl: '',
    markers: [
      { x: 50, y: 47, name: 'Sarajevo', description: 'Vụ ám sát Thái tử Franz Ferdinand ngày 28/6/1914, châm ngòi Chiến tranh thế giới thứ nhất.', event_key: '' },
      { x: 49, y: 30, name: 'Berlin', description: 'Thủ đô Đế quốc Đức — trụ cột Liên minh Tam giác.', event_key: '' },
      { x: 46, y: 39, name: 'Wien (Vienna)', description: 'Kinh đô Đế quốc Áo – Hung.', event_key: '' },
      { x: 43, y: 46, name: 'Roma', description: 'Italy ban đầu trung lập, sang 1915 ngả về phe Hiệp ước.', event_key: '' },
      { x: 43, y: 29, name: 'Saint Petersburg', description: 'Thủ đô Đế quốc Nga — đồng minh chủ lực của phe Hiệp ước.', event_key: 'ev-13' },
      { x: 41, y: 43, name: 'Beograd', description: 'Serbia — mục tiêu tối hậu thư của Áo – Hung tháng 7/1914.', event_key: '' },
      { x: 38, y: 36, name: 'London', description: 'Anh tham chiến ngày 4/8/1914 sau khi Đức xâm phạm Belgium.', event_key: '' },
      { x: 40, y: 41, name: 'Paris', description: 'Pháp — đồng minh cốt lõi của Nga và Anh trong phe Hiệp ước.', event_key: '' },
    ],
  },
  {
    key: 'map-asia-1945', legacy_id: 'map-asia-1945', title: 'Châu Á năm 1945', year: 1945,
    description: 'Mặt trận Thái Bình Dương cuối Chiến tranh thế giới thứ hai: các mốc đầu hàng và giải phóng.',
    imageUrl: '',
    markers: [
      { x: 86, y: 36, name: 'Tokyo', description: 'Nhật Bản tuyên bố đầu hàng Đồng Minh ngày 15/8/1945.', event_key: 'ev-14' },
      { x: 78, y: 62, name: 'Hiroshima & Nagasaki', description: 'Hai quả bom nguyên tử (6/8 và 9/8/1945) thúc đẩy Nhật đầu hàng.', event_key: '' },
      { x: 62, y: 48, name: 'Manchuria (Mãn Châu)', description: 'Liên Xô tuyên chiến với Nhật ngày 8/8/1945, đánh bại Quan Quân.', event_key: 'ev-14' },
      { x: 56, y: 72, name: 'Hà Nội', description: 'Nhật đảo chính Pháp (9/3/1945); sau 15/8/1945 quân Nhật đầu hàng, tạo thời cơ Tổng khởi nghĩa.', event_key: 'ev-9' },
      { x: 70, y: 60, name: 'Seoul', description: 'Bán đảo Triều Tiên được giải phóng khỏi ách thuộc địa Nhật.', event_key: '' },
      { x: 63, y: 80, name: 'Singapore', description: 'Trở lại quyền kiểm soát của Anh sau khi Nhật đầu hàng.', event_key: '' },
    ],
  },
  {
    key: 'map-vn-1945', legacy_id: 'map-vn-1945', title: 'Việt Nam năm 1945', year: 1945,
    description: 'Tổng khởi nghĩa Cách mạng tháng Tám: chính quyền về tay nhân dân từ Bắc chí Nam.',
    imageUrl: '',
    markers: [
      { x: 48, y: 22, name: 'Hà Nội', description: 'Ngày 19/8/1945, quần chúng chiếm Bắc Bộ Phủ — Hà Nội khởi nghĩa thắng lợi.', event_key: 'ev-9' },
      { x: 42, y: 62, name: 'Huế', description: 'Khởi nghĩa ngày 23/8/1945; vua Bảo Đại thoái vị ngày 30/8/1945.', event_key: 'ev-9' },
      { x: 60, y: 82, name: 'Sài Gòn', description: 'Khởi nghĩa ngày 25/8/1945, nhân dân nổi dậy giành chính quyền.', event_key: 'ev-9' },
      { x: 34, y: 12, name: 'Tuyên Quang', description: 'Thủ đô kháng chiến của khu giải phóng Việt Bắc.', event_key: '' },
      { x: 55, y: 45, name: 'Vịnh Hạ Long', description: 'Địa bàn chiến lược miền biển Đông Bắc.', event_key: '' },
    ],
  },
  {
    key: 'map-africa-1960', legacy_id: 'map-africa-1960', title: 'Châu Phi năm 1960', year: 1960,
    description: '“Năm châu Phi” — 17 quốc gia tuyên bố độc lập, phong trào phi thực dân hóa lan rộng.',
    imageUrl: '',
    markers: [
      { x: 47, y: 52, name: 'Léopoldville (Kinshasa)', description: 'Cộng hòa Congo (Zaire cũ) độc lập ngày 30/6/1960.', event_key: 'ev-16' },
      { x: 66, y: 48, name: 'Addis Ababa', description: 'Ethiopia — biểu tượng chống chủ nghĩa thực dân.', event_key: '' },
      { x: 34, y: 68, name: 'Lagos', description: 'Nigeria độc lập ngày 1/10/1960.', event_key: 'ev-16' },
      { x: 62, y: 62, name: 'Nairobi', description: 'Kenya vùng lên trong nổi dậy Mau Mau (1952–1960).', event_key: '' },
      { x: 24, y: 12, name: 'Alger', description: 'Algeria giành độc lập 1962 sau cuộc chiến 1954–1962.', event_key: 'ev-16' },
      { x: 48, y: 36, name: 'Cairo', description: 'Ai Cập — trung tâm chủ nghĩa dân tộc Ả Rập.', event_key: '' },
      { x: 40, y: 48, name: 'Bamako', description: 'Mali (Sudan thuộc Pháp) tự trị trong Cộng đồng Pháp 1960.', event_key: '' },
      { x: 52, y: 84, name: 'Cape Town', description: 'Nam Phi — liên tục phản kháng chống apartheid.', event_key: '' },
    ],
  },
];
