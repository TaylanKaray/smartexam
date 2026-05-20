"""
Tüm ÖSYM TYT/AYT PDF'lerini indirir, metin çıkarır, Gemini ile parse eder, DB'ye kaydeder.
Sayfalari 3'er 3'er birleştirerek API çağrısı sayısını minimumda tutar.
Çalıştır: python parse_all_osym.py
"""
import pdfplumber, json, re, time, requests, psycopg2, io, sys

GEMINI_API_KEY = "AIzaSyDAeykD06Y6pPdV9ysUGodB4nfJL9AQw-E"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
DB = dict(host="localhost", port=5432, dbname="smartexam_db", user="smartexam_user", password="smartexam123")

PDF_LIST = [
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2021/YKS/TSK/tyt_yks_2021.pdf',
     'title': '2021 TYT Çıkmış Sorular', 'year': 2021, 'type': 'TYT', 'exam_id': 1, 'duration': 135},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2021/YKS/TSK/ayt_yks_2021.pdf',
     'title': '2021 AYT Çıkmış Sorular', 'year': 2021, 'type': 'AYT', 'exam_id': 3, 'duration': 180},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2020/YKS/TSK/tyt_yks_2020.pdf',
     'title': '2020 TYT Çıkmış Sorular', 'year': 2020, 'type': 'TYT', 'exam_id': 2, 'duration': 135},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2020/YKS/TSK/ayt_yks_2020.pdf',
     'title': '2020 AYT Çıkmış Sorular', 'year': 2020, 'type': 'AYT', 'exam_id': None, 'duration': 180},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2019/YKS/TSK/tyt_yks_2019_web.pdf',
     'title': '2019 TYT Çıkmış Sorular', 'year': 2019, 'type': 'TYT', 'exam_id': None, 'duration': 135},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2019/YKS/TSK/ayt_yks_2019_web.pdf',
     'title': '2019 AYT Çıkmış Sorular', 'year': 2019, 'type': 'AYT', 'exam_id': None, 'duration': 180},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2018/YKS/TYT_01072018.pdf',
     'title': '2018 TYT Çıkmış Sorular', 'year': 2018, 'type': 'TYT', 'exam_id': None, 'duration': 135},
    {'url': 'https://dokuman.osym.gov.tr/pdfdokuman/2018/YKS/AYT_01072018.pdf',
     'title': '2018 AYT Çıkmış Sorular', 'year': 2018, 'type': 'AYT', 'exam_id': None, 'duration': 180},
]

PAGES_PER_CHUNK = 4  # 4 sayfa = 1 Gemini çağrısı

def log(msg): print(msg, flush=True)

def download_pdf(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
        'Referer': 'https://www.osym.gov.tr/tr,15164/yks-cikmis-sorular.html',
        'Accept-Language': 'tr-TR,tr;q=0.9',
    }
    r = requests.get(url, headers=headers, timeout=120)
    r.raise_for_status()
    if len(r.content) < 10000:
        raise Exception(f"PDF çok küçük ({len(r.content)} bytes) — bloklanmış olabilir")
    return r.content

def extract_pages(pdf_bytes):
    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        log(f"  {len(pdf.pages)} sayfa")
        for i, page in enumerate(pdf.pages):
            try:
                txt = page.extract_text() or ''
                if len(txt.strip()) > 50:
                    pages.append(txt)
                else:
                    pages.append('')
            except Exception:
                pages.append('')
    return pages

def gemini_parse(chunk_text, exam_type):
    prompt = f"""ÖSYM {exam_type} sınavı metin parçası. Çoktan seçmeli soruları JSON olarak çıkar.

Kurallar:
- Denklem/formül/şekil/grafik gerektiren soruları ATLA
- 4 şık eksiksiz olmayan soruları ATLA
- Cevap anahtarı yoksa correct_answer = ""
- subject: Türkçe | Matematik | Tarih | Coğrafya | Felsefe | Din Kültürü | Fizik | Kimya | Biyoloji | Türk Dili ve Edebiyatı

Sadece JSON döndür (başka hiçbir şey yazma):
[{{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A","subject":"Türkçe"}}]

Metin:
{chunk_text[:7000]}"""

    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192}}

    for attempt in range(4):
        try:
            r = requests.post(GEMINI_URL, json=body, timeout=90)
            if r.status_code == 429:
                wait = 70 * (attempt + 1)
                log(f"    Rate limit! {wait}s bekleniyor...")
                time.sleep(wait)
                continue
            if r.status_code != 200:
                log(f"    HTTP {r.status_code}"); time.sleep(5); continue
            raw = r.json()['candidates'][0]['content']['parts'][0]['text']
            match = re.search(r'\[.*?\]', raw, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
        except Exception as e:
            log(f"    Hata: {e}"); time.sleep(3)
    return []

def process_pdf(meta, conn):
    cur = conn.cursor()
    log(f"\n{'='*55}\n-> {meta['title']}")

    try:
        pdf_bytes = download_pdf(meta['url'])
        log(f"  İndirildi: {len(pdf_bytes)//1024} KB")
    except Exception as e:
        log(f"  İndirme hatası: {e}"); cur.close(); return

    pages = extract_pages(pdf_bytes)
    non_empty = [(i, p) for i, p in enumerate(pages) if p.strip()]
    log(f"  {len(non_empty)} dolu sayfa")

    if not non_empty:
        log("  Metin çıkarılamadı"); cur.close(); return

    # Sayfaları PAGES_PER_CHUNK'lı gruplara böl
    chunks = []
    for i in range(0, len(non_empty), PAGES_PER_CHUNK):
        group = non_empty[i:i+PAGES_PER_CHUNK]
        combined = "\n\n---\n\n".join(txt for _, txt in group)
        chunks.append(combined)

    log(f"  {len(chunks)} Gemini çağrısı yapılacak")

    all_qs = []
    for ci, chunk in enumerate(chunks):
        log(f"  Chunk {ci+1}/{len(chunks)}...")
        qs = gemini_parse(chunk, meta['type'])
        valid = [q for q in qs if
                 q.get('question_text','').strip() and len(q.get('question_text','')) > 15 and
                 q.get('option_a') and q.get('option_b') and q.get('option_c') and q.get('option_d')]
        log(f"    {len(valid)} geçerli soru")
        all_qs.extend(valid)
        time.sleep(3)

    # Tekrar gider
    seen, unique = set(), []
    for q in all_qs:
        key = q['question_text'][:80].strip()
        if key not in seen:
            seen.add(key); unique.append(q)

    log(f"  Toplam: {len(unique)} benzersiz soru")
    if not unique:
        cur.close(); return

    # DB kaydet
    exam_id = meta.get('exam_id')
    if exam_id:
        cur.execute("DELETE FROM practice_exam_questions WHERE practice_exam_id=%s", (exam_id,))
    else:
        cur.execute("""INSERT INTO practice_exams (title,category,package_type,year,total_questions,duration_minutes,description)
                       VALUES (%s,'OSYM','YKS',%s,%s,%s,%s) RETURNING id""",
                    (meta['title'], meta['year'], len(unique), meta['duration'],
                     f"ÖSYM {meta['year']} {meta['type']} çıkmış sorular."))
        exam_id = cur.fetchone()[0]

    inserted = 0
    src = f"OSYM_{meta['year']}_{meta['type']}"
    for i, q in enumerate(unique):
        try:
            cur.execute("""INSERT INTO questions (question_text,optiona,optionb,optionc,optiond,correct_answer,subject,difficulty_level,source)
                           VALUES (%s,%s,%s,%s,%s,%s,%s,2,%s) RETURNING id""",
                        (q['question_text'][:1000], q['option_a'][:500], q['option_b'][:500],
                         q['option_c'][:500], q['option_d'][:500],
                         (q.get('correct_answer') or '')[:1].upper(),
                         q.get('subject','Genel'), src))
            qid = cur.fetchone()[0]
            cur.execute("INSERT INTO practice_exam_questions (practice_exam_id,question_id,order_index) VALUES (%s,%s,%s)",
                        (exam_id, qid, i+1))
            inserted += 1
        except Exception as e:
            log(f"    Kayıt hatası: {e}")

    cur.execute("UPDATE practice_exams SET total_questions=%s, title=%s, year=%s WHERE id=%s",
                (inserted, meta['title'], meta['year'], exam_id))
    conn.commit()
    log(f"  OK: {inserted} soru kaydedildi (Exam {exam_id})")
    cur.close()

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='questions' AND column_name='source'")
    if not cur.fetchone():
        cur.execute("ALTER TABLE questions ADD COLUMN source VARCHAR(50)")
        conn.commit()
    cur.close()

    for meta in PDF_LIST:
        process_pdf(meta, conn)

    conn.close()

    conn2 = psycopg2.connect(**DB)
    cur2 = conn2.cursor()
    cur2.execute("""SELECT p.id, p.title, p.year,
                    (SELECT COUNT(*) FROM practice_exam_questions peq WHERE peq.practice_exam_id=p.id) actual
                    FROM practice_exams p WHERE p.category='OSYM' ORDER BY p.year DESC""")
    log("\n=== ÖSYM Sonuç ===")
    for r in cur2.fetchall():
        log(f"  [{r[0]}] {r[1]} ({r[2]}): {r[3]} soru")
    cur2.close(); conn2.close()

if __name__ == '__main__':
    main()
