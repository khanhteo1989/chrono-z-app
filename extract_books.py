import os
import fitz  # PyMuPDF
from docx import Document # python-docx

SOURCE_DIR = "/Users/leekhanh/Desktop/sách"
OUTPUT_DIR = "/Users/leekhanh/Downloads/up FB/chrono-z-app/database_raw"

def extract_pdf(filepath):
    text = ""
    try:
        doc = fitz.open(filepath)
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"Error reading PDF {filepath}: {e}")
    return text

def extract_docx(filepath):
    text = ""
    try:
        doc = Document(filepath)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX {filepath}: {e}")
    return text

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"Scanning directory: {SOURCE_DIR}")
    for filename in os.listdir(SOURCE_DIR):
        filepath = os.path.join(SOURCE_DIR, filename)
        if os.path.isfile(filepath):
            print(f"Processing: {filename}...")
            extracted_text = ""
            
            if filename.lower().endswith('.pdf'):
                extracted_text = extract_pdf(filepath)
            elif filename.lower().endswith('.docx'):
                extracted_text = extract_docx(filepath)
            else:
                print(f"Skipping unsupported file: {filename}")
                continue
                
            if extracted_text:
                output_filename = f"{os.path.splitext(filename)[0]}.txt"
                output_filepath = os.path.join(OUTPUT_DIR, output_filename)
                with open(output_filepath, "w", encoding="utf-8") as f:
                    f.write(extracted_text)
                print(f"  -> Saved to {output_filename}")

    print("Data extraction complete!")

if __name__ == "__main__":
    main()
