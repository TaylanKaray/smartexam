"""
Gemini MEB Müfredat Soru Üretici
Her konuya 50 soru/zorluk ekler: 50 kolay + 50 orta + 50 zor (hedef)
Her sınava girildiğinde 15 görülmemiş soru çekilir; havuz bitince sıfırlanır

Billing olmadan ücretsiz: günde 20 istek = 20×20=400 soru → ~7 günde tamamlanır
Billing ile        (~$0.50): sınırsız istek → 1-2 saatte tamamlanır

Kullanım:
  Windows PowerShell:  $env:GEMINI_API_KEY="AIza..."  ; python generate_questions.py
  Windows CMD:         set GEMINI_API_KEY=AIza...     && python generate_questions.py

API key: https://aistudio.google.com → Get API key → Create API key
"""

import os, json, time, re
import psycopg2
from google import genai

# ── Ayarlar ──────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("GEMINI_API_KEY", "")

DB_CONFIG = {
    "host": "localhost", "port": 5432,
    "dbname": "smartexam_db",
    "user": "smartexam_user",
    "password": "smartexam123",
}

DIFFICULTY_TARGETS = {1: 30, 2: 30, 3: 30}    # her zorlukta 30 soru hedefi
DIFFICULTY_LABELS  = {1: "kolay", 2: "orta", 3: "zor"}
WEIGHT_MAP         = {1: 1.0, 2: 1.5, 3: 2.0}
RATE_LIMIT_SLEEP   = 5
BATCH_SIZE         = 20   # her istek 20 soru → eksik büyüdükçe tam 20 isteniyor
# ─────────────────────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """Sen MEB müfredatına uygun deneyimli bir {course} öğretmenisin.
"{topic_name}" konusunda, {difficulty} seviyede tam olarak {count} adet FARKLI çoktan seçmeli soru üret.

Kesinlikle sadece aşağıdaki JSON formatını döndür (başka açıklama yazma):
[
  {{
    "question": "Soru metni",
    "optionA": "A şıkkı",
    "optionB": "B şıkkı",
    "optionC": "C şıkkı",
    "optionD": "D şıkkı",
    "correct": "A"
  }}
]

ÇOK ÖNEMLİ KURALLAR:
- Her soru FARKLI bir alt konuyu veya kavramı sınasın (tekrar eden benzer sorular üretme)
- Sorular birbirinden tamamen farklı olsun — aynı kalıbı tekrarlama
- Soru tipleri çeşitli olsun: tanım, uygulama, karşılaştırma, neden-sonuç, örnek bulma
- Tüm içerik Türkçe olsun
- correct değeri sadece "A", "B", "C" veya "D" harfi olsun
- Şıklar gerçekçi ve birbirinden farklı olsun, mantıklı yanıltıcılar içersin
- {difficulty} seviyeye uygun: kolay=temel tanım/bilgi, orta=anlama/uygulama, zor=analiz/sentez/değerlendirme
- Sadece JSON döndür, başka metin yazma
"""


def get_all_topics(conn):
    """Sadece hiç sorusu olmayan konuları getirir — 0 sorulu konular önce doldurulur."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT t.id, t.name, c.name AS course_name,
                   COALESCE(COUNT(q.id), 0) AS soru_sayisi
            FROM topics t
            JOIN courses c ON c.id = t.course_id
            LEFT JOIN questions q ON q.topic_id = t.id
            GROUP BY t.id, t.name, c.name
            HAVING COALESCE(COUNT(q.id), 0) = 0
            ORDER BY c.name, t.id
        """)
        rows = cur.fetchall()
        return [(r[0], r[1], r[2]) for r in rows]


def existing_count(conn, topic_id, difficulty):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM questions WHERE topic_id=%s AND difficulty_level=%s",
            (topic_id, difficulty)
        )
        return cur.fetchone()[0]


def question_exists(conn, topic_id, qtext):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM questions WHERE topic_id=%s AND question_text=%s",
            (topic_id, qtext)
        )
        return cur.fetchone() is not None


def insert_question(conn, topic_id, course_name, difficulty, q):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO questions
              (question_text,optiona,optionb,optionc,optiond,
               correct_answer,subject,difficulty_level,weight_coefficient,topic_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            q["question"], q["optionA"], q["optionB"], q["optionC"], q["optionD"],
            q["correct"], course_name, difficulty,
            WEIGHT_MAP[difficulty], topic_id
        ))
    conn.commit()


def parse_json(text):
    text = re.sub(r"```json\s*", "", text.strip())
    text = re.sub(r"```\s*", "", text)
    s, e = text.find("["), text.rfind("]")
    if s == -1 or e == -1:
        return []
    try:
        return json.loads(text[s:e+1])
    except json.JSONDecodeError:
        return []


DAILY_LIMIT_HIT = False  # günlük limit dolduğunda True olur


def generate_batch(client, topic_name, course_name, difficulty, count):
    global DAILY_LIMIT_HIT
    prompt = PROMPT_TEMPLATE.format(
        course=course_name,
        topic_name=topic_name,
        difficulty=DIFFICULTY_LABELS[difficulty],
        count=count,
    )
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        parsed = parse_json(resp.text)
        if not parsed:
            # JSON parse başarısız — ham yanıtın ilk 200 karakterini göster
            preview = resp.text[:200].replace('\n', ' ') if resp.text else "(boş)"
            print(f"\n    [PARSE HATASI] Yanıt JSON değil: {preview}")
        return parsed
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            print(f"\n{'='*60}")
            print("GÜNLÜK LİMİT DOLDU! Yeni key ile devam et.")
            print(f"{'='*60}\n")
            DAILY_LIMIT_HIT = True
        elif "403" in err or "PERMISSION_DENIED" in err:
            print(f"\n{'='*60}")
            print("KEY ERIŞIM REDDEDİLDİ (403)! Farklı hesaptan yeni key al.")
            print(f"{'='*60}\n")
            DAILY_LIMIT_HIT = True  # devam etmeyi durdur
        else:
            print(f"    API HATASI: {e}")
        return []


def fill_topic(model, conn, topic_id, topic_name, course_name, difficulty, target):
    global DAILY_LIMIT_HIT
    current = existing_count(conn, topic_id, difficulty)
    needed  = target - current
    if needed <= 0:
        print(f"    [{DIFFICULTY_LABELS[difficulty]}] Zaten {current}/{target} soru mevcut, atlandı.")
        return 0

    saved    = 0
    retries  = 0
    MAX_RETRY = 3  # art arda 3 kez 0 kaydedilirse bu zorluk seviyesini atla

    while saved < needed:
        if DAILY_LIMIT_HIT:
            return saved
        if retries >= MAX_RETRY:
            print(f"    [{DIFFICULTY_LABELS[difficulty]}] {MAX_RETRY} denemede ilerleme yok, atlanıyor.")
            return saved
        batch = min(BATCH_SIZE, needed - saved)
        print(f"    [{DIFFICULTY_LABELS[difficulty]}] {current+saved}/{target} -> {batch} soru isteniyor...", end=" ", flush=True)
        questions = generate_batch(model, topic_name, course_name, difficulty, batch)

        added = 0
        if questions and added == 0 and retries == 0:
            # İlk denemede debug: hangi anahtarlar var?
            sample = questions[0] if questions else {}
            print(f"\n    [DEBUG] {len(questions)} soru geldi. Anahtarlar: {list(sample.keys())}")
            if "correct" in sample:
                print(f"    [DEBUG] correct degeri: '{sample.get('correct')}'")
        for q in questions:
            if not all(k in q for k in ("question","optionA","optionB","optionC","optionD","correct")):
                continue
            if q["correct"] not in ("A","B","C","D"):
                continue
            if question_exists(conn, topic_id, q["question"]):
                continue
            try:
                insert_question(conn, topic_id, course_name, difficulty, q)
                added += 1
            except Exception as e:
                conn.rollback()
                print(f"\n    [INSERT HATA] {e}")
        saved += added
        print(f"{added} kaydedildi")
        if added == 0:
            retries += 1
        else:
            retries = 0  # başarılı kayıt olunca retry sayacını sıfırla
        if not DAILY_LIMIT_HIT:
            time.sleep(RATE_LIMIT_SLEEP)

    return saved


def main():
    if not API_KEY:
        print("=" * 60)
        print("HATA: GEMINI_API_KEY ortam değişkeni ayarlanmamış!")
        print()
        print("API key almak için:")
        print("  1. https://aistudio.google.com adresine git")
        print("  2. 'Get API key' → 'Create API key' tıkla")
        print("  3. Key'i kopyala (AIza... ile başlar)")
        print()
        print("PowerShell'de çalıştır:")
        print("  $env:GEMINI_API_KEY='AIza...'")
        print("  python generate_questions.py")
        print("=" * 60)
        return

    client = genai.Client(api_key=API_KEY)
    model  = client
    conn  = psycopg2.connect(**DB_CONFIG)
    print("PostgreSQL bağlantısı kuruldu.\n")

    topics = get_all_topics(conn)
    print(f"{len(topics)} konu bulundu. Hedef: her konuya ~100 soru (34+34+32)\n")

    total_saved = 0
    for idx, (topic_id, topic_name, course_name) in enumerate(topics, 1):
        if DAILY_LIMIT_HIT:
            print(f"\nGünlük limit doldu. {total_saved} soru eklendi. Yarın tekrar çalıştır.")
            break
        print(f"[{idx}/{len(topics)}] {course_name} -> {topic_name}")
        for diff, target in DIFFICULTY_TARGETS.items():
            if DAILY_LIMIT_HIT:
                break
            saved = fill_topic(model, conn, topic_id, topic_name, course_name, diff, target)
            total_saved += saved

    conn.close()
    print(f"\nTamamlandı! Toplam {total_saved} yeni soru eklendi.")


if __name__ == "__main__":
    main()
