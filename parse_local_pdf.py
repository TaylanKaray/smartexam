"""
Yerel PDF dosyasından TYT sorularını çeker ve DB'ye kaydeder.
"""
import pdfplumber, json, re, time, requests, psycopg2, os

GEMINI_API_KEY = "AIzaSyDAeykD06Y6pPdV9ysUGodB4nfJL9AQw-E"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

PDF_PATH = r"C:\Users\tayla\.claude\projects\c--Users-tayla-OneDrive-Masa-st--smartexam\1da833fa-c7ba-4ffd-996d-3b7b797deb18\tool-results\webfetch-1779223517459-ek0p60.pdf"

EXAM_CONFIG = {
    'title': '2021 TYT Çıkmış Sorular',
    'category': 'OSYM', 'package_type': 'YKS', 'year': 2021,
    'duration_minutes': 135,
    'exam_id': 1,  # mevcut ID'yi güncelle
}

def extract_all_text(pdf_path):
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Toplam {len(pdf.pages)} sayfa")
        for i, page in enumerate(pdf.pages):
            txt = page.extract_text()
            if txt and len(txt.strip()) > 30:
                pages.append((i+1, txt))
    return pages

def parse_chunk_with_gemini(chunk_text, page_num):
    prompt = f"""Aşağıdaki ÖSYM TYT sınav metni sayfa {page_num}'den alınmıştır.
Bu metinde çoktan seçmeli test soruları var. Her soruyu JSON olarak çıkar.

Önemli kurallar:
- Soru numarasına göre doğru A/B/C/D şıklarını eşleştir
- Matematik formülleri, denklemler veya şekil/grafik gerektiren soruları ATLA
- Eksik şıklar varsa o soruyu ATLA
- Türkçe, Tarih, Coğrafya, Felsefe, Din Kültürü soruları genellikle metindir — bunları çıkar

subject için sadece şunları kullan:
Türkçe, Matematik, Tarih, Coğrafya, Felsefe, Din Kültürü, Fizik, Kimya, Biyoloji, Türk Dili ve Edebiyatı

Doğru cevap yoksa correct_answer alanını "" bırak.

Çıktı formatı (sadece JSON, başka hiçbir şey yazma):
[
  {{
    "question_text": "Tam soru metni",
    "option_a": "A şıkkının tam metni",
    "option_b": "B şıkkının tam metni",
    "option_c": "C şıkkının tam metni",
    "option_d": "D şıkkının tam metni",
    "correct_answer": "A",
    "subject": "Türkçe"
  }}
]

Metin:
{chunk_text[:6000]}
"""
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1}}
    for attempt in range(3):
        try:
            r = requests.post(GEMINI_URL, json=body, timeout=60)
            if r.status_code == 429:
                print(f"  Rate limit, {60}s bekleniyor...")
                time.sleep(60)
                continue
            r.raise_for_status()
            raw = r.json()['candidates'][0]['content']['parts'][0]['text']
            match = re.search(r'\[.*?\]', raw, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                return parsed
        except json.JSONDecodeError:
            pass
        except Exception as e:
            print(f"  Hata: {e}")
        time.sleep(3)
    return []

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # source kolonu yoksa ekle
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='questions' AND column_name='source'")
    if not cur.fetchone():
        cur.execute("ALTER TABLE questions ADD COLUMN source VARCHAR(50)")
        conn.commit()

    print("PDF okunuyor...")
    pages = extract_all_text(PDF_PATH)
    print(f"{len(pages)} dolu sayfa bulundu\n")

    all_questions = []

    for page_num, text in pages:
        print(f"Sayfa {page_num} işleniyor ({len(text)} karakter)...")
        qs = parse_chunk_with_gemini(text, page_num)
        valid = [q for q in qs if
                 q.get('question_text') and len(q['question_text']) > 15 and
                 q.get('option_a') and q.get('option_b') and
                 q.get('option_c') and q.get('option_d')]
        print(f"  {len(valid)} geçerli soru çıkarıldı")
        all_questions.extend(valid)
        time.sleep(2)

    # Tekrar eden soruları temizle
    seen = set()
    unique = []
    for q in all_questions:
        key = q['question_text'][:80].strip()
        if key not in seen:
            seen.add(key)
            unique.append(q)

    print(f"\nToplam {len(unique)} benzersiz soru\n")

    # DB'ye kaydet
    exam_id = EXAM_CONFIG['exam_id']
    cur.execute("DELETE FROM practice_exam_questions WHERE practice_exam_id=%s", (exam_id,))

    inserted = 0
    for i, q in enumerate(unique):
        try:
            cur.execute("""
                INSERT INTO questions
                  (question_text, optiona, optionb, optionc, optiond,
                   correct_answer, subject, difficulty_level, source)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (
                q['question_text'][:1000],
                q['option_a'][:500], q['option_b'][:500],
                q['option_c'][:500], q['option_d'][:500],
                (q.get('correct_answer') or '')[:1].upper(),
                q.get('subject', 'Genel'), 2, 'OSYM_2021'
            ))
            qid = cur.fetchone()[0]
            cur.execute("""
                INSERT INTO practice_exam_questions (practice_exam_id, question_id, order_index)
                VALUES (%s,%s,%s)
            """, (exam_id, qid, i+1))
            inserted += 1
        except Exception as e:
            print(f"  Kayıt hatası: {e}")

    cur.execute("""
        UPDATE practice_exams
        SET title=%s, year=%s, total_questions=%s, duration_minutes=%s,
            description=%s
        WHERE id=%s
    """, (
        EXAM_CONFIG['title'], EXAM_CONFIG['year'], inserted,
        EXAM_CONFIG['duration_minutes'],
        '2021 ÖSYM TYT resmi sınavından metin tabanlı sorular (Türkçe, Sosyal Bilimler).',
        exam_id
    ))

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nTamamlandı! {inserted} soru Exam ID {exam_id}'ye kaydedildi.")

if __name__ == '__main__':
    main()
