import psycopg2

DB = {"host":"localhost","port":5432,"dbname":"smartexam_db","user":"smartexam_user","password":"smartexam123"}

TURKCE_TOPICS = [
    "Sözcükte Anlam", "Cümlede Anlam", "Paragraf Bilgisi",
    "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri",
    "Sözcük Türleri", "Cümle Bilgisi", "Sözcük Yapısı", "Dil Bilgisi Genel"
]

VATANDASLIK_TOPICS = [
    "Anayasa Hukuku Temelleri", "Temel Haklar ve Ödevler",
    "Yasama Organı ve TBMM", "Yürütme Organı",
    "Yargı Organı", "Türkiye İdari Yapısı",
    "Ekonomi Temel Kavramlar", "Demokrasi ve Siyasi Sistemler",
    "Uluslararası Kuruluşlar", "Vatandaşlık ve Seçim Sistemi"
]

conn = psycopg2.connect(**DB)
cur  = conn.cursor()

# Kurs isimlerini düzelt
cur.execute("UPDATE courses SET name=%s WHERE id=9", ("Türkçe",))
cur.execute("UPDATE courses SET name=%s WHERE id=10", ("Vatandaşlık",))

# Türkçe konuları ekle (id=9)
for t in TURKCE_TOPICS:
    cur.execute("INSERT INTO topics(name,course_id) VALUES(%s,9) ON CONFLICT DO NOTHING", (t,))

# Vatandaşlık konuları ekle (id=10)
for t in VATANDASLIK_TOPICS:
    cur.execute("INSERT INTO topics(name,course_id) VALUES(%s,10) ON CONFLICT DO NOTHING", (t,))

conn.commit()

# Kontrol
cur.execute("SELECT c.name, t.name FROM courses c JOIN topics t ON t.course_id=c.id WHERE c.id IN (9,10) ORDER BY c.id,t.id")
rows = cur.fetchall()
for r in rows:
    print(f"  {r[0]} - {r[1]}")

cur.close()
conn.close()
print("\nKPSS konuları eklendi!")
