import os

RAW_DIR = "/Users/leekhanh/Downloads/up FB/chrono-z-app/database_raw"
OUTPUT_FILE = os.path.join(RAW_DIR, "big_data.txt")

def main():
    if not os.path.exists(RAW_DIR):
        print(f"Directory {RAW_DIR} does not exist.")
        return

    print("Bắt đầu gom toàn bộ sách vào file Big Data...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        # Lặp qua tất cả các file trong thư mục raw
        for filename in os.listdir(RAW_DIR):
            if filename.endswith(".txt") and filename != "big_data.txt":
                filepath = os.path.join(RAW_DIR, filename)
                print(f"Đang nối file: {filename}")
                
                # Ghi tiêu đề ngăn cách giữa các sách
                outfile.write(f"\n{'='*50}\n")
                outfile.write(f"Nguồn: {filename}\n")
                outfile.write(f"{'='*50}\n\n")
                
                # Đọc và ghi nội dung
                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                        outfile.write("\n")
                except Exception as e:
                    print(f"Lỗi khi đọc file {filename}: {e}")

    print(f"\nĐã hoàn thành! Toàn bộ dữ liệu được gom vào: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
