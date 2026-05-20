"""
API kullanmadan, ders bazlı sabit kalıplarla tüm sorulara E şıkkı ekler.
Saniyeler içinde tamamlanır.
"""
import psycopg2

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

# Her ders için anlamlı E şıkkı kalıpları
SUBJECT_E = {
    "Matematik":              "Yukarıdakilerin hiçbiri doğru değildir",
    "Fizik":                  "Verilen bilgilerle hesaplanamaz",
    "Kimya":                  "Hiçbiri yukarıda belirtilmemiştir",
    "Biyoloji":               "Yukarıdakilerin tümü doğrudur",
    "Türkçe":                 "Hiçbiri doğru değildir",
    "Türk Dili ve Edebiyatı": "Hiçbiri doğru değildir",
    "Tarih":                  "Yukarıdakilerden hiçbiri gerçekleşmemiştir",
    "Coğrafya":               "Böyle bir coğrafi alan yoktur",
    "Felsefe":                "Bu görüş hiçbir filozofa ait değildir",
    "Din Kültürü":            "Bu bilgi dini kaynaklarda yer almaz",
    "Vatandaşlık":            "Anayasamızda böyle bir hüküm yoktur",
}
DEFAULT_E = "Yukarıdakilerin hiçbiri"

conn = psycopg2.connect(**DB)
cur  = conn.cursor()

# Ders bazlı toplu güncelleme
for subject, e_text in SUBJECT_E.items():
    cur.execute("""
        UPDATE questions
        SET optione = %s
        WHERE subject = %s
          AND optione IS NULL
          AND optiona IS NOT NULL
    """, (e_text, subject))
    print(f"  {subject}: {cur.rowcount} soru guncellendi")

# Geri kalan (dersi bilinmeyenler)
cur.execute("""
    UPDATE questions
    SET optione = %s
    WHERE optione IS NULL
      AND optiona IS NOT NULL
""", (DEFAULT_E,))
print(f"  Diger: {cur.rowcount} soru guncellendi")

conn.commit()

# Sonuç kontrol
cur.execute("SELECT COUNT(*) FROM questions WHERE optione IS NOT NULL AND optiona IS NOT NULL")
total_with_e = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM questions WHERE optione IS NULL AND optiona IS NOT NULL")
total_without = cur.fetchone()[0]

print(f"\nSonuc:")
print(f"  E sikki olan soru: {total_with_e}")
print(f"  E sikki eksik:     {total_without}")

cur.close()
conn.close()
print("\nTamamlandi!")
