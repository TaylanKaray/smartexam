"""
ÖSYM deneme sınavlarını gerçek soru sayısına çıkarır.
Mevcut az sayıdaki soruları koruyup eksik soruları havuzdan ekler.
"""
import psycopg2, random

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

# Gerçek TYT dağılımı - 120 soru
TYT_DIST = {
    'Türkçe': 40, 'Matematik': 40,
    'Tarih': 5, 'Coğrafya': 5, 'Felsefe': 5, 'Din Kültürü': 5,
    'Fizik': 7, 'Kimya': 6, 'Biyoloji': 7,
}

# Gerçek AYT Sayısal - 80 soru
AYT_SAYISAL_DIST = {
    'Matematik': 40, 'Fizik': 14, 'Kimya': 13, 'Biyoloji': 13,
}

# KPSS GY+GK - 60 soru (Vatandaşlık sorusu yok, 60 yapıyoruz)
KPSS_DIST = {
    'Matematik': 20, 'Türkçe': 20, 'Tarih': 10, 'Coğrafya': 10,
}

UPDATES = [
    # id, yeni title, duration, dist, gerçek_total
    (1, '2024 TYT Çıkmış Sorular', 135, TYT_DIST, 120),
    (2, '2023 TYT Çıkmış Sorular', 135, TYT_DIST, 120),
    (3, '2024 AYT Sayısal Deneme', 180, AYT_SAYISAL_DIST, 80),
    (4, 'TYT Deneme #1',           135, TYT_DIST, 120),
    (5, 'TYT Deneme #2',           135, TYT_DIST, 120),
    (6, 'AYT Sayısal Deneme',      180, AYT_SAYISAL_DIST, 80),
    (9, '2024 KPSS GY-GK Denemesi', 90, KPSS_DIST, 60),
]

def get_used_ids(cur, exam_id):
    cur.execute("SELECT question_id FROM practice_exam_questions WHERE practice_exam_id=%s", (exam_id,))
    return {r[0] for r in cur.fetchall()}

def pick_for_subject(cur, subject, count, exclude_ids):
    cur.execute("""
        SELECT id FROM questions
        WHERE subject = %s
          AND optiona IS NOT NULL AND optionb IS NOT NULL
          AND correct_answer IS NOT NULL
          AND id != ALL(%s)
        ORDER BY RANDOM()
        LIMIT %s
    """, (subject, list(exclude_ids), count))
    return [r[0] for r in cur.fetchall()]

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # Tüm sınavlarda kullanılan soruları biriktir (tekrar önlemek için)
    globally_used = set()
    cur.execute("SELECT question_id FROM practice_exam_questions")
    globally_used = {r[0] for r in cur.fetchall()}

    for exam_id, title, duration, dist, real_total in UPDATES:
        print(f"\n-> Exam {exam_id}: {title}")

        # Mevcut soruları temizle, sıfırdan yeniden doldur
        cur.execute("DELETE FROM practice_exam_questions WHERE practice_exam_id=%s", (exam_id,))
        globally_used -= get_used_ids(cur, exam_id)  # bu sınavın soruları artık serbest

        all_questions = []
        local_exclude = set(globally_used)

        for subject, count in dist.items():
            ids = pick_for_subject(cur, subject, count, local_exclude)
            if len(ids) < count:
                print(f"   ! {subject}: {count} istendi, {len(ids)} bulundu")
            all_questions.extend(ids)
            local_exclude.update(ids)

        random.shuffle(all_questions)

        for i, qid in enumerate(all_questions):
            cur.execute("""
                INSERT INTO practice_exam_questions (practice_exam_id, question_id, order_index)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (exam_id, qid, i+1))

        globally_used.update(all_questions)

        actual = len(all_questions)
        cur.execute("""
            UPDATE practice_exams
            SET title=%s, total_questions=%s, duration_minutes=%s
            WHERE id=%s
        """, (title, actual, duration, exam_id))

        conn.commit()
        print(f"   OK — {actual} soru")

    cur.close()
    conn.close()

    # Son durum
    conn2 = psycopg2.connect(**DB)
    cur2 = conn2.cursor()
    cur2.execute("""
        SELECT p.id, p.title, p.total_questions,
               (SELECT COUNT(*) FROM practice_exam_questions peq WHERE peq.practice_exam_id=p.id) actual
        FROM practice_exams p ORDER BY p.id
    """)
    print("\n=== Son durum ===")
    for row in cur2.fetchall():
        print(f"  [{row[0]}] {row[1]}: {row[3]} soru ({row[2]} gösterilen)")
    cur2.close()
    conn2.close()

if __name__ == '__main__':
    main()
