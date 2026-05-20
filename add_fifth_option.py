"""
Mevcut 4 şıklı soruların tümüne Gemini ile anlamlı 5. şık (E) ekler.
API limiti aşılırsa kaldığı yerden devam eder (NULL olan sorular).
"""
import psycopg2, requests, json, time, re

GEMINI_KEY = "AIzaSyDAeykD06Y6pPdV9ysUGodB4nfJL9AQw-E"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

BATCH = 8  # tek Gemini çağrısında kaç soru

def fetch_batch(cur, offset):
    cur.execute("""
        SELECT id, question_text, optiona, optionb, optionc, optiond, correct_answer, subject
        FROM questions
        WHERE optione IS NULL
          AND optiona IS NOT NULL AND optionb IS NOT NULL
          AND optionc IS NOT NULL AND optiond IS NOT NULL
          AND correct_answer IN ('A','B','C','D')
        ORDER BY id
        LIMIT %s OFFSET %s
    """, (BATCH, offset))
    return cur.fetchall()

def gemini_add_e(rows):
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "q": r[1][:300],
            "a": r[2], "b": r[3], "c": r[4], "d": r[5],
            "correct": r[6],
            "subject": r[7]
        })

    prompt = f"""Aşağıdaki çoktan seçmeli sorular için her birine anlamlı ve yanıltıcı bir E şıkkı yaz.
E şıkkı:
- Yanlış ama makul görünmeli
- Doğru cevapla (correct alanında) karıştırılabilecek nitelikte olmalı
- Türkçe, 10-80 karakter arası
- Sadece E şıkkının metnini döndür (A/B/C/D tekrarı yapma)

Her soru için ID ve E şıkkını JSON olarak döndür:
[{{"id": 123, "option_e": "E şıkkı metni"}}, ...]

Sorular:
{json.dumps(items, ensure_ascii=False, indent=2)[:6000]}"""

    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}}

    for attempt in range(3):
        try:
            r = requests.post(GEMINI_URL, json=body, timeout=60)
            if r.status_code == 429:
                wait = 70 * (attempt + 1)
                print(f"  Rate limit, {wait}s bekleniyor...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            raw = r.json()['candidates'][0]['content']['parts'][0]['text']
            match = re.search(r'\[.*?\]', raw, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            print(f"  Hata: {e}")
            time.sleep(3)
    return []

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Toplam NULL olan soru sayısı
    cur.execute("SELECT COUNT(*) FROM questions WHERE optione IS NULL AND optiona IS NOT NULL")
    total = cur.fetchone()[0]
    print(f"Toplam {total} soru için E şıkkı eklenecek")

    updated = 0
    offset = 0

    while True:
        rows = fetch_batch(cur, 0)  # offset 0, çünkü güncellenenler artık NULL değil
        if not rows:
            break

        print(f"\nBatch {updated//BATCH + 1}: {len(rows)} soru işleniyor...")
        results = gemini_add_e(rows)

        result_map = {r['id']: r['option_e'] for r in results if r.get('option_e')}

        for row in rows:
            qid = row[0]
            e_text = result_map.get(qid, f"Hiçbiri")  # fallback
            cur.execute("UPDATE questions SET optione=%s WHERE id=%s", (e_text[:500], qid))
            updated += 1

        conn.commit()
        print(f"  {len(rows)} soru güncellendi (toplam: {updated})")
        time.sleep(3)

        # Kalan soru sayısı
        cur.execute("SELECT COUNT(*) FROM questions WHERE optione IS NULL AND optiona IS NOT NULL")
        remaining = cur.fetchone()[0]
        print(f"  Kalan: {remaining}")
        if remaining == 0:
            break

    cur.close()
    conn.close()
    print(f"\nTamamlandı! {updated} soruya E şıkkı eklendi.")

if __name__ == '__main__':
    main()
