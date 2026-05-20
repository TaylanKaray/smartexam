import psycopg2

DB = {"host":"localhost","port":5432,"dbname":"smartexam_db","user":"smartexam_user","password":"smartexam123"}

KPSS_TEACHERS = [
    {
        "fullName": "Dr. Ayşe Kaya",
        "branch": "Türkçe / KPSS",
        "bio": "KPSS Türkçe ve Dil Bilgisi alanında 15 yıllık deneyim. Sözcük türleri, paragraf ve anlam bilgisi uzmanı.",
        "avatarUrl": None,
        "courseIds": [9]  # Türkçe
    },
    {
        "fullName": "Doç. Dr. Mehmet Yıldız",
        "branch": "Vatandaşlık / Anayasa",
        "bio": "KPSS Vatandaşlık, Anayasa Hukuku ve Türkiye İdari Yapısı konularında uzman. Binlerce öğrenci mezun etti.",
        "avatarUrl": None,
        "courseIds": [10]  # Vatandaşlık
    },
    {
        "fullName": "Prof. Dr. Selin Arslan",
        "branch": "KPSS Tarih",
        "bio": "KPSS Tarih alanında uzman. Osmanlı ve Cumhuriyet dönemi, Atatürk İlkeleri konularında kitap yazarı.",
        "avatarUrl": None,
        "courseIds": [5]  # Tarih
    },
    {
        "fullName": "Yrd. Doç. Dr. Kemal Demir",
        "branch": "KPSS Coğrafya",
        "bio": "KPSS Coğrafya uzmanı. Türkiye coğrafyası, nüfus ve ekonomik coğrafya konularında 12 yıl deneyim.",
        "avatarUrl": None,
        "courseIds": [6]  # Coğrafya
    },
]

conn = psycopg2.connect(**DB)
cur  = conn.cursor()

for t in KPSS_TEACHERS:
    cur.execute(
        "INSERT INTO teachers (full_name, branch, bio, avatar_url) VALUES (%s,%s,%s,%s) RETURNING id",
        (t["fullName"], t["branch"], t["bio"], t["avatarUrl"])
    )
    teacher_id = cur.fetchone()[0]
    print(f"Eklendi: {t['fullName']} (ID={teacher_id})")

conn.commit()
cur.close()
conn.close()
print("KPSS ogretmenleri eklendi!")
