import numpy as np
from sklearn.ensemble import RandomForestClassifier

LABELS = {
    0: "Harika! Konuyu iyi biliyorsun. Hafif tekrar yeterli.",
    1: "Orta seviye. Eksik konuları tekrar gözden geçir.",
    2: "Bu konuda daha fazla çalışman gerekiyor. Yoğun tekrar önerilir.",
}

# Features: [weighted_score, avg_solve_time, attention_errors, knowledge_gaps, difficulty_level]
X_base = np.array([
    [95, 20, 0, 0, 1], [90, 25, 0, 0, 1], [85, 30, 0, 0, 2],
    [80, 35, 0, 1, 2], [70, 40, 1, 1, 2], [65, 45, 0, 2, 2],
    [60, 55, 2, 1, 2], [50, 70, 1, 2, 2], [40, 90, 0, 3, 3],
    [30,110, 1, 3, 3], [20,130, 0, 4, 3], [88, 22, 0, 0, 3],
    [75, 38, 1, 0, 2], [55, 60, 2, 2, 2], [35, 95, 0, 3, 3],
    # Dikkat hatası ağırlıklı (hızlı ama yanlış)
    [45, 8,  5, 0, 2], [50, 10, 4, 0, 3], [60, 12, 3, 0, 2],
])
y_base = np.array([0,0,0, 1,1,1, 1,1,2, 2,2,0, 1,2,2, 1,1,1])

rf_model = RandomForestClassifier(n_estimators=150, random_state=42)
rf_model.fit(X_base, y_base)
training_size = len(y_base)


def _score_to_label(score_pct: float) -> int:
    if score_pct >= 75: return 0
    elif score_pct >= 50: return 1
    else: return 2


def retrain(exam_results: list) -> dict:
    global rf_model, training_size
    if not exam_results:
        return {"status": "no_data", "samples": 0}

    X_new, y_new = [], []
    for r in exam_results:
        total = r.get("totalQuestions", 1) or 1
        score = r.get("scorePercentage", 0)

        # Zenginleştirilmiş özellikler — question_attempts'tan gelen gerçek veriler
        avg_time     = r.get("avgSolveTime") or (r.get("durationSeconds", 60) / total)
        attention    = r.get("attentionErrors", 0)
        gaps         = r.get("knowledgeGaps", 0)
        difficulty   = r.get("difficultyLevel", 1)

        X_new.append([score, avg_time, attention, gaps, difficulty])
        y_new.append(_score_to_label(score))

    X_all = np.vstack([X_base, np.array(X_new)])
    y_all = np.concatenate([y_base, np.array(y_new)])

    rf_model = RandomForestClassifier(n_estimators=150, random_state=42)
    rf_model.fit(X_all, y_all)
    training_size = len(y_all)
    return {
        "status": "retrained",
        "samples": training_size,
        "new_real_samples": len(X_new),
        "features": ["weighted_score", "avg_solve_time", "attention_errors", "knowledge_gaps", "difficulty"]
    }


def predict_smart(weighted_score: float, avg_solve_time: float,
                  attention_errors: int, knowledge_gaps: int, difficulty: int) -> dict:
    features = np.array([[weighted_score, avg_solve_time, attention_errors, knowledge_gaps, difficulty]])
    prediction = int(rf_model.predict(features)[0])
    probabilities = rf_model.predict_proba(features)[0].tolist()
    return {
        "level": prediction,
        "message": LABELS[prediction],
        "confidence": round(max(probabilities) * 100, 1),
        "trainingSamples": training_size,
        "probabilities": {
            "easy_review":    round(probabilities[0] * 100, 1),
            "medium_review":  round(probabilities[1] * 100, 1),
            "intensive_study":round(probabilities[2] * 100, 1),
        }
    }


def predict_recommendation(dogru: int, yanlis: int, sure: int, konu_id: int) -> dict:
    """Eski endpoint geriye dönük uyumluluk için."""
    total = dogru + yanlis or 1
    score = (dogru / total) * 100
    avg_time = sure / total
    return predict_smart(score, avg_time, 0, 0, konu_id)
