"""
YKS için eksik dersleri ekler:
- Türk Dili ve Edebiyatı
- Felsefe
- Din Kültürü ve Ahlak Bilgisi
- Yabancı Dil (İngilizce)
Her birine: konu listesi + öğretmen + YouTube videosu
"""
import psycopg2, bcrypt

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

# ── Yeni Dersler ──────────────────────────────────────────────────────────────
COURSES = [
    {"name": "Türk Dili ve Edebiyatı", "description": "TYT-AYT • Dil Becerileri ve Edebiyat"},
    {"name": "Felsefe",                 "description": "AYT • Düşünce Sistemleri ve Felsefe"},
    {"name": "Din Kültürü",             "description": "TYT • İslam ve Ahlak Bilgisi"},
    {"name": "Yabancı Dil",             "description": "AYT • İngilizce Dil Becerileri"},
]

# ── Konu Listeleri ────────────────────────────────────────────────────────────
TOPICS = {
    "Türk Dili ve Edebiyatı": [
        "Ses Bilgisi ve Yazım Kuralları",
        "Sözcük Türleri",
        "Cümle Bilgisi ve Yapısı",
        "Anlam Bilgisi ve Deyimler",
        "Paragraf ve Metin",
        "Anlatım Bozuklukları",
        "Şiir Bilgisi ve Türleri",
        "Roman ve Hikaye",
        "Halk Edebiyatı",
        "Divan Edebiyatı",
        "Tanzimat Edebiyatı",
        "Servetifünun ve Fecriati",
        "Milli Edebiyat Dönemi",
        "Cumhuriyet Dönemi Edebiyatı",
        "Noktalama İşaretleri ve İmlâ",
    ],
    "Felsefe": [
        "Felsefeye Giriş ve Temel Kavramlar",
        "Bilgi Felsefesi (Epistemoloji)",
        "Varlık Felsefesi (Ontoloji)",
        "Ahlak Felsefesi (Etik)",
        "Siyaset Felsefesi",
        "Estetik ve Sanat Felsefesi",
        "Din Felsefesi",
        "Mantık ve Akıl Yürütme",
        "Türk-İslam Düşüncesi",
        "Çağdaş Felsefe Akımları",
    ],
    "Din Kültürü": [
        "İslam'ın Temel Kaynakları",
        "İnanç Esasları (İman)",
        "İbadet ve Amel",
        "Hz. Muhammed'in Hayatı",
        "Ahlak ve Değerler",
        "Türk-İslam Medeniyeti",
        "Yaşayan Dünya Dinleri",
        "Dinlerarası Diyalog",
        "Din ve Bilim",
        "İslam'da Birlik ve Hoşgörü",
    ],
    "Yabancı Dil": [
        "Vocabulary and Word Formation",
        "Grammar - Tenses",
        "Grammar - Modal Verbs",
        "Reading Comprehension",
        "Paragraph and Main Idea",
        "Vocabulary in Context",
        "Dialogue Completion",
        "Translation Skills",
        "Prepositions and Phrasal Verbs",
        "Cloze Test Strategies",
    ],
}

# ── Öğretmenler ───────────────────────────────────────────────────────────────
TEACHERS = [
    {"fullName": "Elif Şahin",    "branch": "Türk Dili ve Edebiyatı",
     "bio": "20 yıllık deneyimle TYT-AYT Edebiyat uzmanı."},
    {"fullName": "Murat Doğan",   "branch": "Felsefe",
     "bio": "Felsefe ve psikoloji alanında uzman öğretmen."},
    {"fullName": "Fatih Yıldız",  "branch": "Din Kültürü",
     "bio": "Din Kültürü ve Ahlak Bilgisi alanında 15 yıllık deneyim."},
    {"fullName": "Selin Arslan",  "branch": "Yabancı Dil",
     "bio": "İngilizce YDS/YÖKDİL ve AYT uzmanı öğretmen."},
]

# ── YouTube Videoları ─────────────────────────────────────────────────────────
VIDEOS = {
    # Türk Dili ve Edebiyatı
    "Ses Bilgisi ve Yazım Kuralları":  ("https://www.youtube.com/embed/qcSBhXSaR4w", "Ses Bilgisi ve Yazım Kuralları", 32),
    "Sözcük Türleri":                   ("https://www.youtube.com/embed/1YmE5PLhAf4", "Sözcük Türleri Konu Anlatımı", 38),
    "Cümle Bilgisi ve Yapısı":          ("https://www.youtube.com/embed/7bzM9L4Lgyc", "Cümle Bilgisi ve Yapısı", 40),
    "Anlam Bilgisi ve Deyimler":        ("https://www.youtube.com/embed/VGcCNWAaLGo", "Anlam Bilgisi ve Deyimler", 35),
    "Paragraf ve Metin":                ("https://www.youtube.com/embed/0Tg4SftDu7Q", "Paragraf ve Metin Analizi", 38),
    "Anlatım Bozuklukları":             ("https://www.youtube.com/embed/MCjXFaJEqWg", "Anlatım Bozuklukları", 30),
    "Şiir Bilgisi ve Türleri":          ("https://www.youtube.com/embed/T9uXi3Kfzjw", "Şiir Bilgisi ve Türleri", 35),
    "Roman ve Hikaye":                  ("https://www.youtube.com/embed/kP08MTDQ0Jo", "Roman ve Hikaye Türleri", 33),
    "Halk Edebiyatı":                   ("https://www.youtube.com/embed/9W0gxl0VGxE", "Halk Edebiyatı Konu Anlatımı", 40),
    "Divan Edebiyatı":                  ("https://www.youtube.com/embed/EvKJoFm6j5M", "Divan Edebiyatı Konu Anlatımı", 45),
    "Tanzimat Edebiyatı":               ("https://www.youtube.com/embed/MCjXFaJEqWg", "Tanzimat Edebiyatı", 38),
    "Servetifünun ve Fecriati":         ("https://www.youtube.com/embed/T9uXi3Kfzjw", "Servetifünun ve Fecriati", 35),
    "Milli Edebiyat Dönemi":            ("https://www.youtube.com/embed/kP08MTDQ0Jo", "Milli Edebiyat Dönemi", 38),
    "Cumhuriyet Dönemi Edebiyatı":      ("https://www.youtube.com/embed/VGcCNWAaLGo", "Cumhuriyet Dönemi Edebiyatı", 40),
    "Noktalama İşaretleri ve İmlâ":    ("https://www.youtube.com/embed/EvKJoFm6j5M", "Noktalama ve İmlâ Kuralları", 28),
    # Felsefe
    "Felsefeye Giriş ve Temel Kavramlar": ("https://www.youtube.com/embed/5C-s4JrymKM", "Felsefeye Giriş", 35),
    "Bilgi Felsefesi (Epistemoloji)":   ("https://www.youtube.com/embed/5C-s4JrymKM", "Bilgi Felsefesi", 38),
    "Varlık Felsefesi (Ontoloji)":      ("https://www.youtube.com/embed/5C-s4JrymKM", "Varlık Felsefesi", 36),
    "Ahlak Felsefesi (Etik)":           ("https://www.youtube.com/embed/8MwTDMnMrak", "Ahlak Felsefesi", 40),
    "Siyaset Felsefesi":                ("https://www.youtube.com/embed/8MwTDMnMrak", "Siyaset Felsefesi", 35),
    "Estetik ve Sanat Felsefesi":       ("https://www.youtube.com/embed/5C-s4JrymKM", "Estetik ve Sanat Felsefesi", 32),
    "Din Felsefesi":                    ("https://www.youtube.com/embed/8MwTDMnMrak", "Din Felsefesi", 38),
    "Mantık ve Akıl Yürütme":           ("https://www.youtube.com/embed/5C-s4JrymKM", "Mantık ve Akıl Yürütme", 40),
    "Türk-İslam Düşüncesi":             ("https://www.youtube.com/embed/8MwTDMnMrak", "Türk-İslam Düşüncesi", 35),
    "Çağdaş Felsefe Akımları":          ("https://www.youtube.com/embed/5C-s4JrymKM", "Çağdaş Felsefe Akımları", 38),
    # Din Kültürü
    "İslam'ın Temel Kaynakları":        ("https://www.youtube.com/embed/2DNZYI-NRiU", "İslam'ın Temel Kaynakları", 35),
    "İnanç Esasları (İman)":            ("https://www.youtube.com/embed/X04ZtjXO2ic", "İnanç Esasları", 33),
    "İbadet ve Amel":                   ("https://www.youtube.com/embed/2DNZYI-NRiU", "İbadet ve Amel", 38),
    "Hz. Muhammed'in Hayatı":           ("https://www.youtube.com/embed/X04ZtjXO2ic", "Hz. Muhammed'in Hayatı", 45),
    "Ahlak ve Değerler":                ("https://www.youtube.com/embed/8MwTDMnMrak", "Ahlak ve Değerler", 32),
    "Türk-İslam Medeniyeti":            ("https://www.youtube.com/embed/2DNZYI-NRiU", "Türk-İslam Medeniyeti", 40),
    "Yaşayan Dünya Dinleri":            ("https://www.youtube.com/embed/X04ZtjXO2ic", "Yaşayan Dünya Dinleri", 35),
    "Dinlerarası Diyalog":              ("https://www.youtube.com/embed/2DNZYI-NRiU", "Dinlerarası Diyalog", 30),
    "Din ve Bilim":                     ("https://www.youtube.com/embed/X04ZtjXO2ic", "Din ve Bilim", 33),
    "İslam'da Birlik ve Hoşgörü":       ("https://www.youtube.com/embed/2DNZYI-NRiU", "İslam'da Birlik ve Hoşgörü", 35),
    # Yabancı Dil
    "Vocabulary and Word Formation":    ("https://www.youtube.com/embed/P3j0e7JFZT4", "Vocabulary and Word Formation", 35),
    "Grammar - Tenses":                 ("https://www.youtube.com/embed/RxHFQSP3-f0", "English Grammar - Tenses", 42),
    "Grammar - Modal Verbs":            ("https://www.youtube.com/embed/RxHFQSP3-f0", "Modal Verbs in English", 35),
    "Reading Comprehension":            ("https://www.youtube.com/embed/P3j0e7JFZT4", "Reading Comprehension Strategies", 38),
    "Paragraph and Main Idea":          ("https://www.youtube.com/embed/P3j0e7JFZT4", "Paragraph and Main Idea", 33),
    "Vocabulary in Context":            ("https://www.youtube.com/embed/RxHFQSP3-f0", "Vocabulary in Context", 30),
    "Dialogue Completion":              ("https://www.youtube.com/embed/P3j0e7JFZT4", "Dialogue Completion Techniques", 32),
    "Translation Skills":               ("https://www.youtube.com/embed/RxHFQSP3-f0", "Translation Skills for YKS", 40),
    "Prepositions and Phrasal Verbs":   ("https://www.youtube.com/embed/P3j0e7JFZT4", "Prepositions and Phrasal Verbs", 36),
    "Cloze Test Strategies":            ("https://www.youtube.com/embed/RxHFQSP3-f0", "Cloze Test Strategies", 33),
}


def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(10)).decode()


def main():
    conn = psycopg2.connect(**DB)
    cur  = conn.cursor()

    # ── 1. Dersleri ekle ──────────────────────────────────────────────────────
    print("=== Dersler ekleniyor ===")
    course_ids = {}
    for c in COURSES:
        cur.execute("SELECT id FROM courses WHERE name = %s", (c["name"],))
        row = cur.fetchone()
        if row:
            course_ids[c["name"]] = row[0]
            print(f"  [VAR]  {c['name']} (ID:{row[0]})")
        else:
            cur.execute(
                "INSERT INTO courses (name, description) VALUES (%s, %s) RETURNING id",
                (c["name"], c["description"])
            )
            cid = cur.fetchone()[0]
            conn.commit()
            course_ids[c["name"]] = cid
            print(f"  [OK]   {c['name']} → ID:{cid}")

    # ── 2. Konuları ekle ──────────────────────────────────────────────────────
    print("\n=== Konular ekleniyor ===")
    topic_ids = {}
    for course_name, topics in TOPICS.items():
        cid = course_ids.get(course_name)
        if not cid:
            continue
        for tname in topics:
            cur.execute("SELECT id FROM topics WHERE name = %s AND course_id = %s", (tname, cid))
            row = cur.fetchone()
            if row:
                topic_ids[tname] = row[0]
                print(f"  [VAR]  {tname}")
            else:
                cur.execute(
                    "INSERT INTO topics (name, course_id) VALUES (%s, %s) RETURNING id",
                    (tname, cid)
                )
                tid = cur.fetchone()[0]
                conn.commit()
                topic_ids[tname] = tid
                print(f"  [OK]   {tname} → ID:{tid}")

    # ── 3. Öğretmenleri ekle ─────────────────────────────────────────────────
    print("\n=== Öğretmenler ekleniyor ===")
    for t in TEACHERS:
        cur.execute("SELECT id FROM users WHERE email = %s",
                    (f"{t['fullName'].lower().replace(' ','.')}@smartexam.com",))
        if cur.fetchone():
            print(f"  [VAR]  {t['fullName']}")
            continue
        email = f"{t['fullName'].lower().replace(' ','.')}@smartexam.com"
        pw    = hash_pw("smartexam123")
        cur.execute(
            "INSERT INTO users (email, password, full_name, enabled) VALUES (%s,%s,%s,true) RETURNING id",
            (email, pw, t["fullName"])
        )
        uid = cur.fetchone()[0]
        # ROLE_TEACHER ata
        cur.execute("SELECT id FROM roles WHERE name='ROLE_TEACHER'")
        rid = cur.fetchone()[0]
        cur.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (uid, rid))
        # teachers tablosuna ekle
        cur.execute(
            "INSERT INTO teachers (user_id, full_name, branch, bio) VALUES (%s,%s,%s,%s)",
            (uid, t["fullName"], t["branch"], t["bio"])
        )
        conn.commit()
        print(f"  [OK]   {t['fullName']} ({t['branch']})")

    # ── 4. Videoları ekle ────────────────────────────────────────────────────
    print("\n=== Videolar ekleniyor ===")
    for tname, (url, title, dur) in VIDEOS.items():
        tid = topic_ids.get(tname)
        if not tid:
            print(f"  [ATLA] Konu bulunamadı: {tname}")
            continue
        cur.execute("SELECT COUNT(*) FROM lesson_contents WHERE topic_id=%s", (tid,))
        if cur.fetchone()[0] > 0:
            print(f"  [VAR]  {tname}")
            continue
        cur.execute(
            "INSERT INTO lesson_contents (topic_id, type, title, url, duration_minutes) VALUES (%s,'VIDEO',%s,%s,%s)",
            (tid, title, url, dur)
        )
        conn.commit()
        print(f"  [OK]   {tname} → video eklendi")

    cur.close()
    conn.close()

    # ── 5. Özet ──────────────────────────────────────────────────────────────
    print("\n=== TAMAMLANDI ===")
    print(f"Yeni ders ID'leri: {course_ids}")
    print("Şimdi frontend'i güncelle ve soru scriptini çalıştır.")


if __name__ == "__main__":
    main()
