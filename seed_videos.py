"""
Her konuya YouTube ders videosu ekler.
YouTube embed URL formatı: https://www.youtube.com/embed/VIDEO_ID
"""
import psycopg2

DB_CONFIG = {
    "host": "localhost", "port": 5432,
    "dbname": "smartexam_db",
    "user": "smartexam_user",
    "password": "smartexam123",
}

# topic_name → (YouTube embed URL, başlık, süre dakika)
VIDEOS = {
    # ── MATEMATİK ──────────────────────────────────────────────────
    "Temel Aritmetik":             ("https://www.youtube.com/embed/I-6lYU2mN6M", "Temel Aritmetik - Eksiksiz Anlatım", 28),
    "Logaritma":                   ("https://www.youtube.com/embed/Z5myJ8dg_rM", "Logaritma Konu Anlatımı", 35),
    "Türev":                       ("https://www.youtube.com/embed/rAof9Ld5sOg", "Türev Konu Anlatımı", 42),
    "İntegral":                    ("https://www.youtube.com/embed/rfG8ce4nNh0", "İntegral Konu Anlatımı", 45),
    "Kümeler ve Sayılar":          ("https://www.youtube.com/embed/tyDKR4FG3Yw", "Kümeler ve Sayılar", 30),
    "Denklemler ve Eşitsizlikler": ("https://www.youtube.com/embed/Qyd_v3DGzTM", "Denklemler ve Eşitsizlikler", 33),
    "Üçgenler ve Geometri":        ("https://www.youtube.com/embed/DK3oCnvMPvQ", "Üçgenler ve Geometri", 38),
    "Fonksiyonlar":                ("https://www.youtube.com/embed/kvGsIo1TmsM", "Fonksiyonlar Konu Anlatımı", 36),
    "Trigonometri":                ("https://www.youtube.com/embed/g8VXEFlISsQ", "Trigonometri Konu Anlatımı", 40),
    "İkinci Derece Denklemler":    ("https://www.youtube.com/embed/2ZzuZvz33X0", "İkinci Derece Denklemler", 32),
    "Diziler ve Seriler":          ("https://www.youtube.com/embed/lXVo3M-OTKA", "Diziler ve Seriler", 35),
    "Permütasyon ve Kombinasyon":  ("https://www.youtube.com/embed/XqQTXW7XfYA", "Permütasyon ve Kombinasyon", 30),
    "Olasılık":                    ("https://www.youtube.com/embed/uzkc-qNVoOk", "Olasılık Konu Anlatımı", 28),
    "İstatistik":                  ("https://www.youtube.com/embed/sxQaBpKfDRk", "İstatistik Konu Anlatımı", 32),

    # ── FİZİK ──────────────────────────────────────────────────────
    "Kuvvet ve Hareket":           ("https://www.youtube.com/embed/ZM8ECpBuQYE", "Kuvvet ve Hareket Konu Anlatımı", 40),
    "Elektrik":                    ("https://www.youtube.com/embed/mc979OhitAg", "Elektrik Konu Anlatımı", 38),
    "Optik":                       ("https://www.youtube.com/embed/pTnEG_WGd2Q", "Optik Konu Anlatımı", 35),
    "Madde ve Özellikleri":        ("https://www.youtube.com/embed/ZHCX67h7h6E", "Madde ve Özellikleri", 30),
    "Isı ve Sıcaklık":             ("https://www.youtube.com/embed/vqXjE2K-Gss", "Isı ve Sıcaklık", 33),
    "Dalgalar":                    ("https://www.youtube.com/embed/kDs3AL3cUsI", "Dalgalar Konu Anlatımı", 36),
    "Manyetizma":                  ("https://www.youtube.com/embed/8Y4JSp5U82I", "Manyetizma Konu Anlatımı", 32),
    "Atom Fiziği":                 ("https://www.youtube.com/embed/cNfMHkUuGrY", "Atom Fiziği Konu Anlatımı", 38),
    "Termodinamik":                ("https://www.youtube.com/embed/4i1MUWJoI0U", "Termodinamik Konu Anlatımı", 40),
    "Çağdaş Fizik":                ("https://www.youtube.com/embed/wMFPe-DwULM", "Çağdaş Fizik Konu Anlatımı", 35),

    # ── KİMYA ──────────────────────────────────────────────────────
    "Asitler ve Bazlar":           ("https://www.youtube.com/embed/AcEO9bQFPuA", "Asitler ve Bazlar Konu Anlatımı", 38),
    "Periyodik Tablo":             ("https://www.youtube.com/embed/0RRVV4Diomg", "Periyodik Tablo Konu Anlatımı", 32),
    "Kimyasal Bağlar":             ("https://www.youtube.com/embed/CGA8sRwqIFg", "Kimyasal Bağlar", 36),
    "Kimyasal Reaksiyonlar":       ("https://www.youtube.com/embed/rsNBTEuBTRo", "Kimyasal Reaksiyonlar", 35),
    "Çözeltiler ve Karışımlar":    ("https://www.youtube.com/embed/VZeOSy0Wg1Q", "Çözeltiler ve Karışımlar", 30),
    "Organik Kimya":               ("https://www.youtube.com/embed/bSMx0NS0XfY", "Organik Kimya Konu Anlatımı", 42),
    "Elektrokimya":                ("https://www.youtube.com/embed/lQ6FBA1HM3s", "Elektrokimya Konu Anlatımı", 38),
    "Çevre Kimyası":               ("https://www.youtube.com/embed/8AgbBzbb3GI", "Çevre Kimyası Konu Anlatımı", 28),

    # ── BİYOLOJİ ───────────────────────────────────────────────────
    "Hücre":                       ("https://www.youtube.com/embed/URUJD5NEXC8", "Hücre Konu Anlatımı", 40),
    "Genetik":                     ("https://www.youtube.com/embed/CBezq1fFUEA", "Genetik Konu Anlatımı", 45),
    "Yaşam Bilimi":                ("https://www.youtube.com/embed/QnQe0xW_JY4", "Yaşam Bilimi Konu Anlatımı", 30),
    "Hücre Yapısı":                ("https://www.youtube.com/embed/Hmwvj9X4GNY", "Hücre Yapısı Detaylı Anlatım", 38),
    "Canlılar Dünyası":            ("https://www.youtube.com/embed/4OAA4pWCGto", "Canlılar Dünyası", 33),
    "Canlılık ve Enerji":          ("https://www.youtube.com/embed/yk14dOOvwMk", "Canlılık ve Enerji", 36),
    "Hücre Bölünmesi ve Üreme":    ("https://www.youtube.com/embed/f-ldPgEfAHI", "Hücre Bölünmesi ve Üreme", 42),
    "Kalıtım":                     ("https://www.youtube.com/embed/CBezq1fFUEA", "Kalıtım Konu Anlatımı", 40),
    "Ekosistem ve Ekoloji":        ("https://www.youtube.com/embed/jkSHpXZqXfU", "Ekosistem ve Ekoloji", 35),
    "İnsan Fizyolojisi":           ("https://www.youtube.com/embed/2WJpLXDuFR0", "İnsan Fizyolojisi", 45),
    "Genden Proteine":             ("https://www.youtube.com/embed/gG7uCskUOrA", "Genden Proteine Konu Anlatımı", 38),
    "Canlılar ve Enerji Dönüşümleri": ("https://www.youtube.com/embed/yk14dOOvwMk", "Canlılar ve Enerji Dönüşümleri", 36),
    "Bitki Biyolojisi":            ("https://www.youtube.com/embed/7bzMiCbXKUk", "Bitki Biyolojisi Konu Anlatımı", 33),
    "Canlılar ve Çevre":           ("https://www.youtube.com/embed/jkSHpXZqXfU", "Canlılar ve Çevre", 30),

    # ── TARİH ──────────────────────────────────────────────────────
    "Osmanlı Tarihi":              ("https://www.youtube.com/embed/0A1AIdXn4vI", "Osmanlı Tarihi Genel Bakış", 45),
    "Kurtuluş Savaşı":            ("https://www.youtube.com/embed/eV4OZKMV8OA", "Kurtuluş Savaşı Konu Anlatımı", 50),
    "Cumhuriyet Dönemi":           ("https://www.youtube.com/embed/6R5JFk-kpNI", "Cumhuriyet Dönemi", 40),
    "Rönesans ve Reform":          ("https://www.youtube.com/embed/FdoxM2Sg8GE", "Rönesans ve Reform Konu Anlatımı", 35),
    "Sanayi Devrimi":              ("https://www.youtube.com/embed/zhL5DCizj5c", "Sanayi Devrimi Konu Anlatımı", 38),
    "İlk Çağ Uygarlıkları":       ("https://www.youtube.com/embed/Cjy3-Tujmq0", "İlk Çağ Uygarlıkları", 40),
    "Orta Çağ Tarihi":             ("https://www.youtube.com/embed/OoMSWGMbW8I", "Orta Çağ Tarihi Konu Anlatımı", 38),
    "Osmanlı Yükseliş Dönemi":    ("https://www.youtube.com/embed/1C7gqj6pBRQ", "Osmanlı Yükseliş Dönemi", 42),
    "Osmanlı Gerileme Dönemi":    ("https://www.youtube.com/embed/0A1AIdXn4vI", "Osmanlı Gerileme Dönemi", 40),
    "Atatürk İlkeleri":           ("https://www.youtube.com/embed/6R5JFk-kpNI", "Atatürk İlkeleri Konu Anlatımı", 35),
    "Çağdaş Dünya Tarihi":         ("https://www.youtube.com/embed/zhL5DCizj5c", "Çağdaş Dünya Tarihi", 38),

    # ── COĞRAFYA ───────────────────────────────────────────────────
    "Haritalar ve Coğrafya":       ("https://www.youtube.com/embed/ILDG6SdpzzU", "Haritalar ve Coğrafya", 35),
    "İklim ve Hava Olayları":      ("https://www.youtube.com/embed/AN-KHM8bCfA", "İklim ve Hava Olayları", 38),
    "Nüfus ve Yerleşme":           ("https://www.youtube.com/embed/mncLGKcqY7I", "Nüfus ve Yerleşme Konu Anlatımı", 33),
    "Türkiye Coğrafyası":          ("https://www.youtube.com/embed/M18xRMEchno", "Türkiye Coğrafyası", 45),
    "Dünya'nın Şekli ve Hareketleri": ("https://www.youtube.com/embed/F72whvM6_90", "Dünya'nın Şekli ve Hareketleri", 30),
    "Yeryüzü Şekilleri":           ("https://www.youtube.com/embed/iUXkKH8VPkI", "Yeryüzü Şekilleri Konu Anlatımı", 35),
    "Doğal Afetler":               ("https://www.youtube.com/embed/ZWIfh1yxMJc", "Doğal Afetler Konu Anlatımı", 32),
    "Ekonomik Faaliyetler":        ("https://www.youtube.com/embed/yTW_JSrjDzI", "Ekonomik Faaliyetler", 36),
    "Küreselleşme ve Çevre":       ("https://www.youtube.com/embed/P67_gfKBDYE", "Küreselleşme ve Çevre", 30),

    # ── TÜRKÇE ─────────────────────────────────────────────────────
    "Sözcükte Anlam":              ("https://www.youtube.com/embed/VGcCNWAaLGo", "Sözcükte Anlam Konu Anlatımı", 30),
    "Cümlede Anlam":               ("https://www.youtube.com/embed/T9uXi3Kfzjw", "Cümlede Anlam Konu Anlatımı", 32),
    "Paragraf Bilgisi":            ("https://www.youtube.com/embed/0Tg4SftDu7Q", "Paragraf Bilgisi Konu Anlatımı", 35),
    "Ses Bilgisi":                 ("https://www.youtube.com/embed/qcSBhXSaR4w", "Ses Bilgisi Konu Anlatımı", 28),
    "Yazım Kuralları":             ("https://www.youtube.com/embed/MCjXFaJEqWg", "Yazım Kuralları Konu Anlatımı", 30),
    "Noktalama İşaretleri":        ("https://www.youtube.com/embed/EvKJoFm6j5M", "Noktalama İşaretleri", 25),
    "Sözcük Türleri":              ("https://www.youtube.com/embed/1YmE5PLhAf4", "Sözcük Türleri Konu Anlatımı", 38),
    "Cümle Bilgisi":               ("https://www.youtube.com/embed/7bzM9L4Lgyc", "Cümle Bilgisi Konu Anlatımı", 36),
    "Sözcük Yapısı":               ("https://www.youtube.com/embed/9W0gxl0VGxE", "Sözcük Yapısı Konu Anlatımı", 32),
    "Dil Bilgisi Genel":           ("https://www.youtube.com/embed/kP08MTDQ0Jo", "Dil Bilgisi Genel Tekrar", 40),

    # ── VATANDAŞLIK ────────────────────────────────────────────────
    "Anayasa Hukuku Temelleri":    ("https://www.youtube.com/embed/2DNZYI-NRiU", "Anayasa Hukuku Temelleri", 40),
    "Temel Haklar ve Ödevler":     ("https://www.youtube.com/embed/X04ZtjXO2ic", "Temel Haklar ve Ödevler", 38),
    "Yasama Organı ve TBMM":       ("https://www.youtube.com/embed/s4Vn7PeD3Ec", "Yasama Organı ve TBMM", 35),
    "Yürütme Organı":              ("https://www.youtube.com/embed/BZE8SnSY9QA", "Yürütme Organı Konu Anlatımı", 32),
    "Yargı Organı":                ("https://www.youtube.com/embed/qNyh5CaJqmI", "Yargı Organı Konu Anlatımı", 30),
    "Türkiye İdari Yapısı":        ("https://www.youtube.com/embed/M18xRMEchno", "Türkiye İdari Yapısı", 35),
    "Ekonomi Temel Kavramlar":     ("https://www.youtube.com/embed/yTW_JSrjDzI", "Ekonomi Temel Kavramlar", 38),
    "Demokrasi ve Siyasi Sistemler": ("https://www.youtube.com/embed/8MwTDMnMrak", "Demokrasi ve Siyasi Sistemler", 40),
    "Uluslararası Kuruluşlar":     ("https://www.youtube.com/embed/P67_gfKBDYE", "Uluslararası Kuruluşlar", 33),
    "Vatandaşlık ve Seçim Sistemi": ("https://www.youtube.com/embed/X04ZtjXO2ic", "Vatandaşlık ve Seçim Sistemi", 35),
}


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur  = conn.cursor()

    # Tüm konuları çek
    cur.execute("SELECT id, name FROM topics")
    topics = cur.fetchall()

    inserted = 0
    skipped  = 0

    for topic_id, topic_name in topics:
        if topic_name not in VIDEOS:
            print(f"  [ATLA] '{topic_name}' için video tanımı yok")
            skipped += 1
            continue

        # Zaten içerik var mı?
        cur.execute("SELECT COUNT(*) FROM lesson_contents WHERE topic_id = %s", (topic_id,))
        if cur.fetchone()[0] > 0:
            print(f"  [VAR]  '{topic_name}' için içerik zaten mevcut")
            skipped += 1
            continue

        url, title, duration = VIDEOS[topic_name]
        cur.execute("""
            INSERT INTO lesson_contents (topic_id, type, title, url, duration_minutes)
            VALUES (%s, 'VIDEO', %s, %s, %s)
        """, (topic_id, title, url, duration))
        conn.commit()
        print(f"  [OK]   '{topic_name}' -> video eklendi ({duration} dk)")
        inserted += 1

    cur.close()
    conn.close()
    print(f"\nTamamlandi! {inserted} video eklendi, {skipped} konu atlandi.")


if __name__ == "__main__":
    main()
