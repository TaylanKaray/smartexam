"""
AI Deneme Sınavı Üreteci
Mevcut soru havuzundan TYT, AYT Sayısal ve KPSS formatında
dengeli deneme sınavları üretir.
"""
import psycopg2, random

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

# TYT dağılımı (120 soru)
TYT_DIST = {
    'Türkçe': 40,
    'Matematik': 40,
    'Tarih': 5,
    'Coğrafya': 5,
    'Felsefe': 5,
    'Din Kültürü': 5,
    'Fizik': 7,
    'Kimya': 6,
    'Biyoloji': 7,
}

# AYT Sayısal dağılımı (80 soru)
AYT_SAYISAL_DIST = {
    'Matematik': 40,
    'Fizik': 14,
    'Kimya': 13,
    'Biyoloji': 13,
}

# AYT Sözel dağılımı (80 soru)
AYT_SOZEL_DIST = {
    'Türk Dili ve Edebiyatı': 40,
    'Tarih': 28,
    'Coğrafya': 12,
}

# KPSS dağılımı (60 soru GY + 60 GK = 120 ama AI denemede 60 yapıyoruz)
KPSS_DIST = {
    'Matematik': 20,
    'Türkçe': 20,
    'Tarih': 8,
    'Coğrafya': 6,
    'Vatandaşlık': 6,
}

DENEMELER = [
    {
        'title': 'AI TYT Deneme #1',
        'category': 'AI', 'package_type': 'YKS', 'year': None,
        'total_questions': sum(TYT_DIST.values()),
        'duration_minutes': 135,
        'description': 'Soru havuzundan AI destekli TYT format denemesi. Türkçe, Matematik, Sosyal Bilimler ve Fen Bilimleri konularını kapsar.',
        'dist': TYT_DIST, 'id_to_clear': 7,
    },
    {
        'title': 'AI TYT Deneme #2',
        'category': 'AI', 'package_type': 'YKS', 'year': None,
        'total_questions': sum(TYT_DIST.values()),
        'duration_minutes': 135,
        'description': 'Soru havuzundan AI destekli TYT format denemesi — farklı soru seti.',
        'dist': TYT_DIST, 'id_to_clear': 8,
    },
    {
        'title': 'AI AYT Sayısal Deneme',
        'category': 'AI', 'package_type': 'YKS', 'year': None,
        'total_questions': sum(AYT_SAYISAL_DIST.values()),
        'duration_minutes': 180,
        'description': 'Sayısal alanlar için AI destekli AYT format denemesi. Matematik, Fizik, Kimya ve Biyoloji sorularını içerir.',
        'dist': AYT_SAYISAL_DIST, 'id_to_clear': None, 'insert': True,
    },
    {
        'title': 'AI AYT Sözel Deneme',
        'category': 'AI', 'package_type': 'YKS', 'year': None,
        'total_questions': sum(AYT_SOZEL_DIST.values()),
        'duration_minutes': 180,
        'description': 'Sözel alanlar için AI destekli AYT format denemesi. Türk Dili ve Edebiyatı, Tarih ve Coğrafya sorularını içerir.',
        'dist': AYT_SOZEL_DIST, 'id_to_clear': None, 'insert': True,
    },
    {
        'title': 'AI KPSS Deneme #1',
        'category': 'AI', 'package_type': 'KPSS', 'year': None,
        'total_questions': sum(KPSS_DIST.values()),
        'duration_minutes': 90,
        'description': 'KPSS sınavı formatında AI destekli deneme. Matematik, Türkçe, Tarih, Coğrafya ve Vatandaşlık sorularını kapsar.',
        'dist': KPSS_DIST, 'id_to_clear': 10,
    },
    {
        'title': 'AI KPSS Deneme #2',
        'category': 'AI', 'package_type': 'KPSS', 'year': None,
        'total_questions': sum(KPSS_DIST.values()),
        'duration_minutes': 90,
        'description': 'KPSS sınavı formatında AI destekli deneme — farklı soru seti.',
        'dist': KPSS_DIST, 'id_to_clear': None, 'insert': True,
    },
]

def pick_questions(cur, dist, exclude_ids=set()):
    selected = []
    for subject, count in dist.items():
        cur.execute(
            """SELECT id FROM questions
               WHERE subject = %s
                 AND optiona IS NOT NULL AND optionb IS NOT NULL
                 AND correct_answer IS NOT NULL
                 AND id != ALL(%s)
               ORDER BY RANDOM()
               LIMIT %s""",
            (subject, list(exclude_ids), count * 3)
        )
        pool = [r[0] for r in cur.fetchall()]
        chosen = pool[:count]
        if len(chosen) < count:
            print(f"  ! Uyarı: {subject} için {count} soru istendi, {len(chosen)} bulundu")
        selected.extend(chosen)
        exclude_ids.update(chosen)
    random.shuffle(selected)
    return selected

def main():
    conn = psycopg2.connect(**DB)
    cur  = conn.cursor()

    used_globally = set()

    for d in DENEMELER:
        print(f"\n-> {d['title']} oluşturuluyor...")

        exam_id = d.get('id_to_clear')

        if exam_id:
            # Mevcut soruları temizle
            cur.execute("DELETE FROM practice_exam_questions WHERE practice_exam_id = %s", (exam_id,))
            # Başlığı/desc güncelle
            cur.execute("""UPDATE practice_exams
                           SET title=%s, description=%s, total_questions=%s, duration_minutes=%s
                           WHERE id=%s""",
                        (d['title'], d['description'],
                         d['total_questions'], d['duration_minutes'], exam_id))
        else:
            # Yeni kayıt oluştur
            cur.execute("""INSERT INTO practice_exams
                           (title, category, package_type, year, total_questions, duration_minutes, description)
                           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                        (d['title'], d['category'], d['package_type'], d['year'],
                         d['total_questions'], d['duration_minutes'], d['description']))
            exam_id = cur.fetchone()[0]

        questions = pick_questions(cur, d['dist'], exclude_ids=set(used_globally))
        used_globally.update(questions)

        for i, qid in enumerate(questions):
            cur.execute("""INSERT INTO practice_exam_questions
                           (practice_exam_id, question_id, order_index)
                           VALUES (%s,%s,%s)""",
                        (exam_id, qid, i + 1))

        conn.commit()
        print(f"   OK — {len(questions)} soru eklendi (Exam ID: {exam_id})")

    cur.close()
    conn.close()
    print("\nTüm deneme sınavları oluşturuldu!")

if __name__ == '__main__':
    main()
