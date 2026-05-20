"""
Veli demo hesabı oluşturur ve bir öğrenciye bağlar.
Kullanım: python create_parent.py
"""
import psycopg2, bcrypt

DB = {"host":"localhost","port":5432,"dbname":"smartexam_db","user":"smartexam_user","password":"smartexam123"}

# ── Ayarlar ──────────────────────────
PARENT_EMAIL    = "veli@smartexam.com"
PARENT_PASSWORD = "veli123"
PARENT_NAME     = "Fatma Karay (Veli)"
STUDENT_ID      = 3   # taylan karay
# ─────────────────────────────────────

conn = psycopg2.connect(**DB)
cur  = conn.cursor()

# 1. Şifreyi BCrypt ile hashle
hashed = bcrypt.hashpw(PARENT_PASSWORD.encode(), bcrypt.gensalt()).decode()

# 2. Kullanıcıyı oluştur (varsa atla)
cur.execute("SELECT id FROM users WHERE email=%s", (PARENT_EMAIL,))
row = cur.fetchone()

if row:
    parent_id = row[0]
    print(f"Veli zaten var (ID={parent_id}), ilişki kontrol ediliyor...")
else:
    cur.execute(
        "INSERT INTO users(email, password, full_name, enabled) VALUES(%s,%s,%s,true) RETURNING id",
        (PARENT_EMAIL, hashed, PARENT_NAME)
    )
    parent_id = cur.fetchone()[0]
    print(f"Veli kullanici olusturuldu (ID={parent_id})")

# 3. ROLE_PARENT rolünü bul
cur.execute("SELECT id FROM roles WHERE name='ROLE_PARENT'")
role_row = cur.fetchone()
if not role_row:
    cur.execute("INSERT INTO roles(name) VALUES('ROLE_PARENT') RETURNING id")
    role_id = cur.fetchone()[0]
else:
    role_id = role_row[0]

# 4. Role ata (varsa atla)
cur.execute("SELECT 1 FROM user_roles WHERE user_id=%s AND role_id=%s", (parent_id, role_id))
if not cur.fetchone():
    cur.execute("INSERT INTO user_roles(user_id, role_id) VALUES(%s,%s)", (parent_id, role_id))
    print("ROLE_PARENT atandi")

# 5. parent_student_relations ilişkisi
cur.execute("SELECT 1 FROM parent_student_relations WHERE parent_id=%s AND student_id=%s",
            (parent_id, STUDENT_ID))
if not cur.fetchone():
    cur.execute("INSERT INTO parent_student_relations(parent_id, student_id) VALUES(%s,%s)",
                (parent_id, STUDENT_ID))
    print(f"Iliski kuruldu: Veli({parent_id}) -> Ogrenci({STUDENT_ID})")
else:
    print("Iliski zaten mevcut")

conn.commit()
cur.close()
conn.close()

print()
print("=" * 45)
print("VELİ HESABI HAZIR")
print("=" * 45)
print(f"E-posta : {PARENT_EMAIL}")
print(f"Sifre   : {PARENT_PASSWORD}")
print(f"Bagli   : ID={STUDENT_ID} (taylan karay)")
print("=" * 45)
print("localhost:3000/login adresinden giris yapabilirsin")
