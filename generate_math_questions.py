"""
Matematik için prosedürel soru üretici — Gemini API gerekmez.
Her Matematik konusuna kolay/orta/zor toplam 100'er soru ekler.
Çalıştır: python generate_math_questions.py
"""

import random, psycopg2

DB = dict(host="localhost", port=5432, dbname="smartexam_db",
          user="smartexam_user", password="smartexam123")

def get_topic_id(conn, name):
    with conn.cursor() as c:
        c.execute("SELECT id FROM topics WHERE name=%s", (name,))
        r = c.fetchone()
        return r[0] if r else None

def count_existing(conn, topic_id, diff):
    with conn.cursor() as c:
        c.execute("SELECT COUNT(*) FROM questions WHERE topic_id=%s AND difficulty_level=%s", (topic_id, diff))
        return c.fetchone()[0]

def insert_q(conn, topic_id, subject, diff, text, a, b, c_, d, correct):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO questions
              (question_text,optiona,optionb,optionc,optiond,correct_answer,
               subject,difficulty_level,weight_coefficient,topic_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (text, a, b, c_, d, correct, subject, diff,
              {1:1.0,2:1.5,3:2.0}[diff], topic_id))
    conn.commit()

def shuffle_opts(correct_val, wrong_vals):
    """4 şık oluştur, doğruyu rastgele yerleştir."""
    opts = random.sample(wrong_vals, 3) + [correct_val]
    random.shuffle(opts)
    letter = ['A','B','C','D'][opts.index(correct_val)]
    return opts[0], opts[1], opts[2], opts[3], letter

# ── TEMEL ARİTMETİK ──────────────────────────────────────────────────────────
def gen_temel_aritmetik(conn, tid, target=100):
    current = {d: count_existing(conn, tid, d) for d in (1,2,3)}
    added = 0

    def add(diff, text, a, b, c, d, correct):
        nonlocal added
        if current[diff] < target // 3:
            insert_q(conn, tid, "Matematik", diff, text, a, b, c, d, correct)
            current[diff] += 1; added += 1

    seen = set()
    attempts = 0
    while any(v < target // 3 for v in current.values()) and attempts < 3000:
        attempts += 1
        # Kolay: toplama/çıkarma/çarpma
        x, y = random.randint(2, 50), random.randint(2, 50)
        op = random.choice(['+', '-', '×', '÷'])
        if op == '+':
            ans = x + y
            wrong = [ans + random.randint(1,5), ans - random.randint(1,5), ans + random.randint(6,10)]
        elif op == '-':
            x, y = max(x,y), min(x,y)
            ans = x - y
            wrong = [ans+1, ans-1, ans+2]
        elif op == '×':
            x, y = random.randint(2,12), random.randint(2,12)
            ans = x * y
            wrong = [ans+x, ans-y, ans+y]
        else:
            x = random.randint(2,12) * random.randint(2,12)
            y = random.randint(2,12)
            if x % y != 0: continue
            ans = x // y
            wrong = [ans+1, ans-1, ans+2]

        key = f"{x}{op}{y}"
        if key in seen: continue
        seen.add(key)
        wrong = [w for w in wrong if w != ans][:3]
        if len(wrong) < 3: continue
        a,b,c,d,letter = shuffle_opts(str(ans), [str(w) for w in wrong])
        add(1, f"{x} {op} {y} = ?", a, b, c, d, letter)

        # Orta: yüzde ve oran
        pct = random.choice([10,20,25,40,50,75])
        total = random.randint(1,20)*100
        ans2 = total * pct // 100
        w2 = [ans2+10, ans2-10, ans2+20]
        w2 = [str(w) for w in w2 if w != ans2][:3]
        if len(w2) < 3: continue
        a2,b2,c2,d2,l2 = shuffle_opts(str(ans2), w2)
        add(2, f"{total}'ün %{pct}'i kaçtır?", a2, b2, c2, d2, l2)

        # Zor: kareköklü veya kuvvet
        base = random.choice([2,3,4,5,6,7,8,9,10,11,12])
        exp = random.choice([2,3])
        ans3 = base ** exp
        w3 = [ans3+base, ans3-1, ans3+base*2]
        w3 = [str(w) for w in w3 if w != ans3][:3]
        if len(w3) < 3: continue
        a3,b3,c3,d3,l3 = shuffle_opts(str(ans3), w3)
        add(3, f"{base}^{exp} = ?", a3, b3, c3, d3, l3)

    return added

# ── LOGARİTMA ─────────────────────────────────────────────────────────────────
def gen_logaritma(conn, tid, target=100):
    current = {d: count_existing(conn, tid, d) for d in (1,2,3)}
    added = 0
    pairs = [(2,4,2),(2,8,3),(2,16,4),(2,32,5),(3,9,2),(3,27,3),(3,81,4),
             (5,25,2),(5,125,3),(10,100,2),(10,1000,3),(10,10000,4),
             (4,16,2),(4,64,3),(2,64,6),(2,128,7),(5,625,4),(3,243,5)]

    for base,arg,ans in pairs*10:
        if current[1] >= target // 3: break
        w = [ans+1, ans-1, ans+2, ans-2]
        w = [str(x) for x in w if x != ans][:3]
        if len(w)<3: continue
        a,b,c,d,l = shuffle_opts(str(ans), w)
        insert_q(conn, tid, "Matematik", 1, f"log_{base}({arg}) = ?", a,b,c,d,l)
        current[1]+=1; added+=1

    # Orta: log özellikleri
    props_q = [
        ("log(a·b) = log(a) + log(b) kuralına göre log(3)+log(4) = ?",
         "log(7)","log(12)","log(1)","log(3/4)","B"),
        ("log(a/b) = log(a) - log(b) kuralına göre log(10)-log(2) = ?",
         "log(8)","log(20)","log(5)","log(12)","C"),
        ("log(aⁿ) = n·log(a) kuralına göre log(10²) = ?",
         "1","2","10","20","B"),
        ("log₂(16) - log₂(4) = ?", "log₂(4)","log₂(12)","2","4","C"),
        ("log₃(81) = ?","2","3","4","9","C"),
    ]
    for q in props_q*20:
        if current[2] >= target//3: break
        insert_q(conn, tid, "Matematik", 2, *q)
        current[2]+=1; added+=1

    zor_q = [
        ("log₂(x) = 5 ise x = ?","16","32","64","10","B"),
        ("log_x(27) = 3 ise x = ?","3","9","27","81","A"),
        ("log₅(x) = 3 ise x = ?","15","125","25","625","B"),
        ("2^log₂(8) = ?","4","8","16","2","B"),
        ("log(1) kaçtır?","1","0","-1","Tanımsız","B"),
    ]
    for q in zor_q*20:
        if current[3] >= target//3: break
        insert_q(conn, tid, "Matematik", 3, *q)
        current[3]+=1; added+=1
    return added

# ── TÜREV ─────────────────────────────────────────────────────────────────────
def gen_turev(conn, tid, target=100):
    current = {d: count_existing(conn, tid, d) for d in (1,2,3)}
    added = 0

    easy_rules = []
    for n in range(1,16):
        ans = f"{n}x^{n-1}" if n>2 else ("2x" if n==2 else "1")
        wrong = [f"{n+1}x^{n}",f"{n-1}x^{n-2}" if n>2 else "2",f"{n}x^{n}"]
        easy_rules.append((f"f(x) = x^{n} fonksiyonunun türevi nedir?",ans,wrong[0],wrong[1],wrong[2]))
    for coef in range(2,10):
        for n in range(2,8):
            ans = f"{coef*n}x^{n-1}"
            wrong = [f"{coef}x^{n}",f"{n}x^{n-1}",f"{coef*(n-1)}x^{n}"]
            easy_rules.append((f"f(x) = {coef}x^{n} fonksiyonunun türevi nedir?",ans,wrong[0],wrong[1],wrong[2]))

    for q_text,ans,w1,w2,w3 in easy_rules*5:
        if current[1] >= target//3: break
        a,b,c,d,l = shuffle_opts(ans,[w1,w2,w3])
        insert_q(conn, tid,"Matematik",1,q_text,a,b,c,d,l)
        current[1]+=1; added+=1

    mid_q = [
        ("f(x) = sin(x) türevi nedir?","cos(x)","-cos(x)","-sin(x)","tan(x)","A"),
        ("f(x) = cos(x) türevi nedir?","-sin(x)","sin(x)","tan(x)","-cos(x)","A"),
        ("f(x) = eˣ türevi nedir?","eˣ","xeˣ","e^(x-1)","1","A"),
        ("f(x) = ln(x) türevi nedir?","1/x","ln(x)","x","1/x²","A"),
        ("f(x) = tan(x) türevi nedir?","sec²(x)","cos²(x)","-sin(x)","cos(x)","A"),
        ("Çarpım kuralı: (u·v)' = ?","u'v + uv'","u'v'","u'v - uv'","uv' - u'v","A"),
        ("Bölüm kuralı: (u/v)' = ?","(u'v - uv')/v²","u'/v'","(u'v + uv')/v","u'v/v²","A"),
        ("f(x) = x²·sin(x) türevi nedir?","2x·sin(x)+x²·cos(x)","2x·cos(x)","x²·cos(x)","2sin(x)","A"),
        ("Zincir kuralı: [f(g(x))]' = ?","f'(g(x))·g'(x)","f'(x)·g'(x)","f(g'(x))","f'(g'(x))","A"),
        ("f(x) = (3x+1)⁴ türevi nedir?","12(3x+1)³","4(3x+1)³","12(3x+1)","3(3x+1)⁴","A"),
    ]
    for q in mid_q*(target//30+1):
        if current[2] >= target//3: break
        insert_q(conn, tid,"Matematik",2,*q)
        current[2]+=1; added+=1

    hard_q = [
        ("f(x) = arctan(x) türevi nedir?","1/(1+x²)","1/√(1-x²)","1/(x²-1)","-1/(1+x²)","A"),
        ("f(x) = arcsin(x) türevi nedir?","1/√(1-x²)","1/√(1+x²)","-1/√(1-x²)","1/(1-x²)","A"),
        ("İkinci türev f''(x) neyi gösterir?","Eğim","Eğim değişim hızı","Alan","Uzunluk","B"),
        ("f(x) = eˣ·ln(x) türevi nedir?","eˣ·ln(x) + eˣ/x","eˣ/x","eˣ·ln(x)","eˣ+1/x","A"),
        ("Kritik nokta ne zaman oluşur?","f(x)=0","f'(x)=0","f''(x)=0","f(x)>0","B"),
    ]
    for q in hard_q*(target//15+1):
        if current[3] >= target//3: break
        insert_q(conn, tid,"Matematik",3,*q)
        current[3]+=1; added+=1
    return added

# ── İNTEGRAL ─────────────────────────────────────────────────────────────────
def gen_integral(conn, tid, target=100):
    current = {d: count_existing(conn, tid, d) for d in (1,2,3)}
    added = 0
    easy_q = [
        ("∫1 dx = ?","x+C","1","0","C","A"),
        ("∫x dx = ?","x²/2+C","x²+C","2x+C","x+C","A"),
        ("∫x² dx = ?","x³/3+C","x²/2+C","x³+C","3x²+C","A"),
        ("∫5 dx = ?","5x+C","5+C","5x","x+C","A"),
        ("∫2x dx = ?","x²+C","2x²+C","x+C","2+C","A"),
        ("∫3x² dx = ?","x³+C","3x³+C","6x+C","x²+C","A"),
        ("∫eˣ dx = ?","eˣ+C","eˣ","e^(x+1)+C","x·eˣ+C","A"),
        ("∫(1/x) dx = ?","ln|x|+C","1/x+C","x·ln(x)+C","-1/x²+C","A"),
        ("∫cos(x) dx = ?","sin(x)+C","-sin(x)+C","cos(x)+C","-cos(x)+C","A"),
        ("∫sin(x) dx = ?","-cos(x)+C","cos(x)+C","sin(x)+C","-sin(x)+C","A"),
    ]
    for q in easy_q*(target//30+1):
        if current[1] >= target//3: break
        insert_q(conn,tid,"Matematik",1,*q)
        current[1]+=1; added+=1

    mid_q = [
        ("∫(x³+2x) dx = ?","x⁴/4+x²+C","x⁴+x²+C","3x²+2+C","x³+2+C","A"),
        ("∫(3x²-2x+1) dx = ?","x³-x²+x+C","3x³-2x²+C","x³-x+C","6x-2+C","A"),
        ("Belirli integral ∫₀¹ x dx = ?","1/2","1","0","2","A"),
        ("Belirli integral ∫₀² 2x dx = ?","4","2","8","1","A"),
        ("∫sec²(x) dx = ?","tan(x)+C","-tan(x)+C","sec(x)+C","cos²(x)+C","A"),
        ("Yerine koyma: ∫2x(x²+1)⁴ dx = ?","(x²+1)⁵/5+C","(x²+1)⁴/4+C","2x⁵+C","x²+1+C","A"),
        ("Parçalı integral: ∫x·eˣ dx = ?","(x-1)eˣ+C","x·eˣ+C","eˣ+C","x²eˣ/2+C","A"),
    ]
    for q in mid_q*(target//21+1):
        if current[2] >= target//3: break
        insert_q(conn,tid,"Matematik",2,*q)
        current[2]+=1; added+=1

    hard_q = [
        ("∫ln(x) dx = ?","x·ln(x)-x+C","ln(x)/x+C","x/ln(x)+C","(ln(x))²/2+C","A"),
        ("∫tan(x) dx = ?","-ln|cos(x)|+C","ln|cos(x)|+C","sec²(x)+C","-sec²(x)+C","A"),
        ("İmpropri integral ∫₁^∞ (1/x²) dx = ?","1","0","∞","2","A"),
        ("Belirli integral yorumu nedir?","Türev","Eğri altındaki alan","Çevre","Hacim","B"),
        ("∫(eˣ+e⁻ˣ)/2 dx = ?","(eˣ-e⁻ˣ)/2+C","(eˣ+e⁻ˣ)/2+C","sinh(x)+C","cosh(x)+C","A"),
    ]
    for q in hard_q*(target//15+1):
        if current[3] >= target//3: break
        insert_q(conn,tid,"Matematik",3,*q)
        current[3]+=1; added+=1
    return added

# ── KÜ MELER VE SAYILAR ───────────────────────────────────────────────────────
def gen_generic_from_pool(conn, tid, subject, pool1, pool2, pool3, target=100):
    """Sabit havuzdan soru üret."""
    current = {d: count_existing(conn, tid, d) for d in (1,2,3)}
    added = 0
    for diff, pool in [(1,pool1),(2,pool2),(3,pool3)]:
        for q in pool*(target//max(len(pool),1)+2):
            if current[diff] >= target//3: break
            insert_q(conn, tid, subject, diff, *q)
            current[diff]+=1; added+=1
    return added

def main():
    conn = psycopg2.connect(**DB)
    print("PostgreSQL bağlandı.\n")
    total = 0

    tasks = [
        ("Temel Aritmetik", gen_temel_aritmetik),
        ("Logaritma",        gen_logaritma),
        ("Türev",            gen_turev),
        ("İntegral",         gen_integral),
    ]

    for name, func in tasks:
        tid = get_topic_id(conn, name)
        if not tid:
            print(f"  [{name}] bulunamadı, atlandı")
            continue
        n = func(conn, tid, target=100)
        total += n
        after = {d: count_existing(conn, tid, d) for d in (1,2,3)}
        print(f"  [{name}] +{n} soru eklendi -> Kolay:{after[1]} Orta:{after[2]} Zor:{after[3]}")

    # Diğer konular için temel havuz
    diger_konular = {
        "Kümeler ve Sayılar": [
            [  # kolay
                ("A∪B nedir?","Kesişim","Birleşim","Fark","Tümleyen","B"),
                ("A∩B nedir?","Birleşim","Tümleyen","Kesişim","Fark","C"),
                ("Boş kümenin sembolü nedir?","{}","Ø","B","0","B"),
                ("Doğal sayılar hangi harfle gösterilir?","Z","Q","N","R","C"),
                ("Gerçek sayılar kümesi hangi harfle gösterilir?","N","Z","Q","R","D"),
            ],
            [  # orta
                ("A={1,2,3}, B={2,3,4} ise A-B nedir?","{1}","{4}","{2,3}","{1,4}","A"),
                ("n(A)=10,n(B)=8,n(A∩B)=3 ise n(A∪B)=?","15","18","21","13","A"),
                ("De Morgan: (A∩B)' = ?","A'∪B'","A'∩B'","A∪B","A∩B","A"),
                ("Evrensel küme U={1,...,10},A={2,4,6,8} ise A' = ?","{1,3,5,7,9}","{1,3}","{2,4}","{9,10}","A"),
                ("Reel sayılarda √2 hangi kümeye aittir?","N","Z","Q","İrrasyonel","D"),
            ],
            [  # zor
                ("Güç kümesi P(A) eleman sayısı formülü?","n(A)","2^n(A)","n(A)!","n(A)²","B"),
                ("A×B çarpım kümesi kaç elemanlıdır?","n(A)+n(B)","n(A)×n(B)","n(A)-n(B)","2n(A)","B"),
                ("Sonsuz kümelerde Cantor'ın teoremi ne söyler?","Sonsuz kümeler eşittir","Bir kümenin güç kümesi daha büyük kardinaliteye sahiptir","Sayılabilir sonsuzluk yok","Boş küme sonsuz","B"),
            ]
        ],
        "Fonksiyonlar": [
            [
                ("f(x)=2x+1, f(3)=?","5","6","7","8","C"),
                ("Bir fonksiyonun tanım kümesi ne demektir?","Sonuç değerleri","Giriş değerleri","Grafik","Sıfırlar","B"),
                ("f(x)=5 sabit fonksiyonu nedir?","Tek","Çift","Sabit","Artan","C"),
                ("f(x)=x+1, f(2)=?","2","3","4","5","B"),
                ("Fonksiyonun görüntü kümesi ne demektir?","Giriş değerleri","Çıkış değerleri","Tüm R","Tanımsız","B"),
            ],
            [
                ("f(x)=x², g(x)=x+1, (f∘g)(2)=?","4","9","6","3","B"),
                ("f(x)=2x+3 tersinin f⁻¹(x)=?","(x-3)/2","(x+3)/2","2x-3","x/2","A"),
                ("Bire-bir fonksiyon tanımı?","Her çıktı farklı","Her girdi farklı çıktı verir","Tüm çıktılar eşit","Sonsuz","B"),
                ("f(x)=√x tanım kümesi?","R","[0,∞)","(-∞,0]","R\\{0}","B"),
                ("Örten (surjektif) fonksiyon?","Terslenebilir","Her çıktının en az bir girdisi var","Bire-bir","Sabit","B"),
            ],
            [
                ("Bijektif fonksiyon hem ne hem ne olmalıdır?","Sabit ve artan","Bire-bir ve örten","Çift ve tek","Sürekli ve diferansiyellenebilir","B"),
                ("f(x)=x³ tek mi çift mi?","Çift","Tek","Her ikisi","Ne tek ne çift","B"),
                ("İnvers fonksiyon ne zaman vardır?","Her zaman","f bijektif ise","f sürekli ise","f türevlenebilirse","B"),
            ]
        ],
    }

    for topic_name, (pool1, pool2, pool3) in diger_konular.items():
        tid = get_topic_id(conn, topic_name)
        if not tid: continue
        n = gen_generic_from_pool(conn, tid, "Matematik", pool1, pool2, pool3, 100)
        total += n
        after = {d: count_existing(conn, tid, d) for d in (1,2,3)}
        print(f"  [{topic_name}] +{n} soru -> Kolay:{after[1]} Orta:{after[2]} Zor:{after[3]}")

    conn.close()
    print(f"\nTamamlandı: {total} yeni soru eklendi.")

if __name__ == "__main__":
    main()
