import psycopg2

DB = {"host":"localhost","port":5432,"dbname":"smartexam_db","user":"smartexam_user","password":"smartexam123"}
conn = psycopg2.connect(**DB)
cur  = conn.cursor()

# Rolleri ekle
for role in ("ROLE_PARENT", "ROLE_MENTOR"):
    cur.execute("INSERT INTO roles(name) VALUES(%s) ON CONFLICT(name) DO NOTHING", (role,))

# parent_student_relations tablosu
cur.execute("""
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id         BIGSERIAL PRIMARY KEY,
  parent_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_psr_parent  ON parent_student_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_psr_student ON parent_student_relations(student_id);
""")

# study_sessions tablosu
cur.execute("""
CREATE TABLE IF NOT EXISTS study_sessions (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id         BIGINT REFERENCES topics(id),
  duration_seconds INT  NOT NULL DEFAULT 0,
  session_type     VARCHAR(20) NOT NULL DEFAULT 'POMODORO',
  completed        BOOLEAN NOT NULL DEFAULT TRUE,
  started_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ss_user ON study_sessions(user_id);
""")

conn.commit()
cur.close()
conn.close()
print("Tablolar olusturuldu: parent_student_relations, study_sessions")
print("Roller eklendi: ROLE_PARENT, ROLE_MENTOR")
