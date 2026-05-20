"""
ÖSYM TYT/AYT PDF Soru Çekici
PDF'den metin çeker, Gemini ile soru-şık-cevap formatına dönüştürür,
practice_exams tablosuna kaydeder.

ÖSYM PDF'lerinde matematiksel formüller görsel olarak kodlandığı için
Türkçe, Tarih, Coğrafya, Felsefe, Din Kültürü gibi metin ağırlıklı
dersler başarıyla çekilir. Formüllü sorular atlanır.
"""
import requests, pdfplumber, json, re, io, time, psycopg2, os

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDAeykD06Y6pPdV9ysUGodB4nfJL9AQw-E")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

OSYM_PDFS = [
    {
        'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2021/YKS/TSK/tyt_yks_2021.pdf',
        'title': '2021 TYT Çıkmış Sorular',
        'category': 'OSYM', 'package_type': 'YKS', 'year': 2021,
        'type': 'TYT', 'duration_minutes': 135, 'exam_id': 1,
    },
    {
        'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2020/YKS/TSK/tyt_yks_2020.pdf',
        'title': '2020 TYT Çıkmış Sorular',
        'category': 'OSYM', 'package_type': 'YKS', 'year': 2020,
        'type': 'TYT', 'duration_minutes': 135, 'exam_id': None,
    },
    {
        'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2021/YKS/TSK/ayt_yks_2021.pdf',
        'title': '2021 AYT Çıkmış Sorular',
        'category': 'OSYM', 'package_type': 'YKS', 'year': 2021,
        'type': 'AYT', 'duration_minutes': 180, 'exam_id': None,
    },
    {
        'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2019/YKS/TSK/tyt_yks_2019_web.pdf',
        'title': '2019 TYT Çıkmış Sorular',
        'category': 'OSYM', 'package_type': 'YKS', 'year': 2019,
        'type': 'TYT', 'duration_minutes': 135, 'exam_id': None,
    },
]

def download_pdf(url):
    print(f"  PDF indiriliyor: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    r = requests.get(url, headers=headers, timeout=60)
    r.raise_for_status()
    return r.content

def extract_text_from_pdf(pdf_bytes):
    text_pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            txt = page.extract_text()
            if txt and len(txt.strip()) > 50:
                text_pages.append(f"--- SAYFA {i+1} ---\n{txt}")
    return "\n\n".join(text_pages)

def parse_questions_with_gemini(text_chunk, exam_type="TYT"):
    prompt = f"""Aşağıdaki ÖSYM {exam_type} sınav metni içinde çoktan seçmeli sorular var.
Her soruyu JSON formatında çıkar. Matematiksel formül veya denklem içeren soruları ATLA.

Format (JSON dizisi):
[
  {{
    "question_text": "Soru metni burada",
    "option_a": "A şıkkı",
    "option_b": "B şıkkı",
    "option_c": "C şıkkı",
    "option_d": "D şıkkı",
    "correct_answer": "A",
    "subject": "Türkçe"
  }}
]

subject alanı için sadece şunları kullan: Türkçe, Matematik, Tarih, Coğrafya, Felsefe, Din Kültürü, Fizik, Kimya, Biyoloji, Türk Dili ve Edebiyatı

Eğer soru matematiksel sembol, denklem, grafik veya şekil gerektiriyorsa JSON'a EKLEME.
Sadece geçerli JSON döndür, başka hiçbir şey yazma.

Metin:
{text_chunk[:8000]}
"""
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    try:
        r = requests.post(GEMINI_URL, json=body, timeout=60)
        if r.status_code == 429:
            print("  ! Rate limit — 60s bekleniyor")
            time.sleep(60)
            r = requests.post(GEMINI_URL, json=body, timeout=60)
        r.raise_for_status()
        raw = r.json()['candidates'][0]['content']['parts'][0]['text']
        # JSON bloğunu bul
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f"  ! Gemini hata: {e}")
    return []

def save_to_db(conn, exam_meta, questions):
    cur = conn.cursor()

    if exam_meta['exam_id']:
        exam_id = exam_meta['exam_id']
        cur.execute("DELETE FROM practice_exam_questions WHERE practice_exam_id=%s", (exam_id,))
        cur.execute("""UPDATE practice_exams
                       SET title=%s, total_questions=%s, description=%s
                       WHERE id=%s""",
                    (exam_meta['title'], len(questions),
                     f"ÖSYM {exam_meta['year']} {exam_meta['type']} resmi sınavından çekilmiş sorular.",
                     exam_id))
    else:
        cur.execute("""INSERT INTO practice_exams
                       (title, category, package_type, year, total_questions, duration_minutes, description)
                       VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (exam_meta['title'], exam_meta['category'], exam_meta['package_type'],
                     exam_meta['year'], len(questions), exam_meta['duration_minutes'],
                     f"ÖSYM {exam_meta['year']} {exam_meta['type']} resmi sınavından çekilmiş sorular."))
        exam_id = cur.fetchone()[0]

    inserted = 0
    for i, q in enumerate(questions):
        if not all(q.get(k) for k in ['question_text','option_a','option_b','option_c','option_d','correct_answer']):
            continue
        # Önce questions tablosuna ekle
        cur.execute("""INSERT INTO questions
                       (question_text, optiona, optionb, optionc, optiond,
                        correct_answer, subject, difficulty_level, source)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (q['question_text'][:1000], q.get('option_a',q.get('optiona',''))[:500],
                     q.get('option_b',q.get('optionb',''))[:500],
                     q.get('option_c',q.get('optionc',''))[:500],
                     q.get('option_d',q.get('optiond',''))[:500],
                     q['correct_answer'].upper()[:1], q.get('subject','Genel'),
                     2, f"OSYM_{exam_meta['year']}"))
        qid = cur.fetchone()[0]
        cur.execute("""INSERT INTO practice_exam_questions
                       (practice_exam_id, question_id, order_index)
                       VALUES (%s,%s,%s)""", (exam_id, qid, i+1))
        inserted += 1

    conn.commit()
    cur.close()
    return exam_id, inserted

def main():
    # questions tablosunda source kolonu var mı kontrol et
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("""SELECT column_name FROM information_schema.columns
                   WHERE table_name='questions' AND column_name='source'""")
    if not cur.fetchone():
        cur.execute("ALTER TABLE questions ADD COLUMN source VARCHAR(50)")
        conn.commit()
        print("'source' kolonu eklendi")
    cur.close()

    for pdf_meta in OSYM_PDFS:
        print(f"\n{'='*60}")
        print(f"-> {pdf_meta['title']} işleniyor...")
        try:
            pdf_bytes = download_pdf(pdf_meta['url'])
            print(f"  PDF indirildi ({len(pdf_bytes)//1024} KB)")

            full_text = extract_text_from_pdf(pdf_bytes)
            print(f"  Metin çıkarıldı ({len(full_text)} karakter)")

            if len(full_text) < 500:
                print("  ! Metin çok kısa — PDF görsel tabanlı olabilir, atlanıyor")
                continue

            # Metni parçalara böl (Gemini context limiti)
            chunk_size = 7000
            chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
            print(f"  {len(chunks)} parçada Gemini ile ayrıştırılıyor...")

            all_questions = []
            for ci, chunk in enumerate(chunks):
                print(f"  Parça {ci+1}/{len(chunks)}...")
                qs = parse_questions_with_gemini(chunk, pdf_meta['type'])
                all_questions.extend(qs)
                time.sleep(2)  # rate limit için bekle

            # Tekrar eden soru metinlerini temizle
            seen = set()
            unique_qs = []
            for q in all_questions:
                txt = q.get('question_text','').strip()[:100]
                if txt not in seen:
                    seen.add(txt)
                    unique_qs.append(q)

            print(f"  {len(unique_qs)} benzersiz soru bulundu")

            if unique_qs:
                exam_id, inserted = save_to_db(conn, pdf_meta, unique_qs)
                print(f"  OK — {inserted} soru kaydedildi (Exam ID: {exam_id})")
            else:
                print("  ! Hiç soru çıkarılamadı")

        except Exception as e:
            print(f"  HATA: {e}")
            import traceback; traceback.print_exc()

    conn.close()
    print("\nTamamlandı!")

if __name__ == '__main__':
    main()
