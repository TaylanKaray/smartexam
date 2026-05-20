import psycopg2, random

DB = {"host":"localhost","port":5432,"dbname":"smartexam_db","user":"smartexam_user","password":"smartexam123"}
conn = psycopg2.connect(**DB)
cur  = conn.cursor()

# Tablolar
cur.execute("""
CREATE TABLE IF NOT EXISTS practice_exams (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    category         VARCHAR(20)  NOT NULL,  -- OSYM | MEB | AI
    package_type     VARCHAR(10)  NOT NULL DEFAULT 'YKS',
    year             INT,
    total_questions  INT NOT NULL,
    duration_minutes INT NOT NULL,
    description      TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS practice_exam_questions (
    id               BIGSERIAL PRIMARY KEY,
    practice_exam_id BIGINT NOT NULL REFERENCES practice_exams(id) ON DELETE CASCADE,
    question_id      BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index      INT NOT NULL,
    UNIQUE(practice_exam_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_peq_exam ON practice_exam_questions(practice_exam_id);
""")
conn.commit()
print("Tablolar olusturuldu")

# Mevcut sorulari konu bazli cek
cur.execute("""
    SELECT q.id, c.name course, q.difficulty_level
    FROM questions q
    JOIN topics t ON t.id = q.topic_id
    JOIN courses c ON c.id = t.course_id
    ORDER BY RANDOM()
""")
all_questions = cur.fetchall()

def pick(course_filter, count, difficulty=None):
    pool = [q[0] for q in all_questions
            if (course_filter is None or q[1] in course_filter)
            and (difficulty is None or q[2] == difficulty)]
    random.shuffle(pool)
    return pool[:count]

# Deneme sinavlari tanimi
exams = [
    # OSYM - YKS
    ("2024 TYT Çıkmış Sorular",   "OSYM", "YKS", 2024, 40,  135, "2024 yılı TYT sınavının orijinal soruları. Matematik, Türkçe, Fen ve Sosyal alanlarını kapsar."),
    ("2023 TYT Çıkmış Sorular",   "OSYM", "YKS", 2023, 40,  135, "2023 yılı TYT sınavının orijinal soruları."),
    ("2024 AYT Sayısal Deneme",   "OSYM", "YKS", 2024, 40,  180, "2024 AYT Sayısal soruları: Matematik, Fizik, Kimya, Biyoloji."),
    # MEB - YKS
    ("MEB TYT Deneme #1",         "MEB",  "YKS", None, 40,  135, "MEB onaylı TYT hazırlık denemesi."),
    ("MEB TYT Deneme #2",         "MEB",  "YKS", None, 40,  135, "MEB onaylı TYT hazırlık denemesi."),
    ("MEB AYT Sayısal Deneme",    "MEB",  "YKS", None, 30,  120, "MEB onaylı AYT Sayısal hazırlık denemesi."),
    # AI - YKS
    ("AI TYT Karma Deneme #1",    "AI",   "YKS", None, 40,  135, "Yapay zekâ tarafından üretilen, zayıf konulara odaklı karma deneme."),
    ("AI TYT Karma Deneme #2",    "AI",   "YKS", None, 40,  135, "Yapay zekâ tarafından üretilen, farklı güçlük seviyelerinde karma deneme."),
    # KPSS
    ("2024 KPSS GY-GK Çıkmış",   "OSYM", "KPSS",2024, 60,  90,  "2024 KPSS Genel Yetenek ve Genel Kültür soruları."),
    ("KPSS AI Deneme #1",         "AI",   "KPSS",None, 60,  90,  "KPSS için yapay zekâ destekli pratik deneme."),
]

YKS_COURSES  = ["Matematik","Fizik","Kimya","Biyoloji","Tarih","Coğrafya"]
KPSS_COURSES = ["Matematik","Tarih","Coğrafya","Türkçe","Vatandaşlık"]

inserted_exams = 0
for title, cat, pkg, year, total_q, duration, desc in exams:
    # Var mi kontrol
    cur.execute("SELECT id FROM practice_exams WHERE title=%s", (title,))
    if cur.fetchone():
        print(f"  Zaten var: {title}")
        continue

    cur.execute("""
        INSERT INTO practice_exams(title,category,package_type,year,total_questions,duration_minutes,description)
        VALUES(%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (title, cat, pkg, year, total_q, duration, desc))
    exam_id = cur.fetchone()[0]

    # Soruları seç
    course_filter = KPSS_COURSES if pkg == "KPSS" else YKS_COURSES
    q_ids = pick(course_filter, total_q)

    if len(q_ids) < total_q:
        q_ids = pick(None, total_q)  # yeterli yoksa tümünden al

    for idx, qid in enumerate(q_ids[:total_q]):
        try:
            cur.execute("""
                INSERT INTO practice_exam_questions(practice_exam_id,question_id,order_index)
                VALUES(%s,%s,%s) ON CONFLICT DO NOTHING
            """, (exam_id, qid, idx+1))
        except Exception:
            conn.rollback()
            continue

    conn.commit()
    inserted_exams += 1
    print(f"  Eklendi: {title} ({len(q_ids[:total_q])} soru)")

cur.close()
conn.close()
print(f"\nTamamlandi! {inserted_exams} yeni deneme sinavi eklendi.")
