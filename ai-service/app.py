from flask import Flask, request, jsonify
from flask_cors import CORS
from model import predict_recommendation, predict_smart, retrain
import os
from google import genai as google_genai

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "smartexam-ai"})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    required = ["dogru", "yanlis", "sure", "konuId"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Eksik alanlar: {missing}"}), 400

    try:
        dogru = int(data["dogru"])
        yanlis = int(data["yanlis"])
        sure = int(data["sure"])
        konu_id = int(data["konuId"])
    except (ValueError, TypeError):
        return jsonify({"error": "Tüm alanlar sayısal olmalıdır."}), 400

    if dogru < 0 or yanlis < 0 or sure < 0:
        return jsonify({"error": "Değerler negatif olamaz."}), 400

    result = predict_recommendation(dogru, yanlis, sure, konu_id)
    return jsonify(result)


@app.route("/predict-smart", methods=["POST"])
def predict_smart_endpoint():
    data = request.get_json()
    result = predict_smart(
        weighted_score=float(data.get("weightedScore", 0)),
        avg_solve_time=float(data.get("avgSolveTime", 30)),
        attention_errors=int(data.get("attentionErrors", 0)),
        knowledge_gaps=int(data.get("knowledgeGaps", 0)),
        difficulty=int(data.get("difficulty", 1))
    )
    return jsonify(result)


@app.route("/retrain", methods=["POST"])
def retrain_model():
    """
    Spring Boot'tan gelen gerçek sınav sonuçlarıyla modeli yeniden eğitir.
    Body: { "results": [ {correctAnswers, wrongAnswers, durationSeconds, difficultyLevel, scorePercentage}, ... ] }
    """
    data = request.get_json()
    results = data.get("results", [])

    if not results:
        return jsonify({"error": "results listesi boş"}), 400

    outcome = retrain(results)
    return jsonify(outcome)


@app.route("/explain-question", methods=["POST"])
def explain_question():
    """
    Soru için Gemini ile Türkçe açıklama üretir.
    Body: { questionText, optionA, optionB, optionC, optionD, correctAnswer, subject }
    """
    import time as _time
    data = request.get_json() or {}

    # camelCase VE snake_case her ikisini de kabul et
    question_text  = data.get("question_text")  or data.get("questionText",  "")
    correct_letter = data.get("correct_answer") or data.get("correctAnswer", "")
    option_a = data.get("option_a") or data.get("optionA", "")
    option_b = data.get("option_b") or data.get("optionB", "")
    option_c = data.get("option_c") or data.get("optionC", "")
    option_d = data.get("option_d") or data.get("optionD", "")
    option_e = data.get("option_e") or data.get("optionE", "")
    subject  = data.get("subject", "")

    options_map = {"A": option_a, "B": option_b, "C": option_c, "D": option_d, "E": option_e}
    correct_text = options_map.get(correct_letter.upper(), "")

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return jsonify({"explanation": None, "error": "no_key"}), 200

    # Şıkları dinamik olarak oluştur (E şıkkı yoksa dahil etme)
    opts_str = f"A) {option_a}\nB) {option_b}\nC) {option_c}\nD) {option_d}"
    if option_e:
        opts_str += f"\nE) {option_e}"

    prompt = f"""Sen MEB müfredatına uygun deneyimli bir {subject} öğretmenisin.
Aşağıdaki çoktan seçmeli soruyu kısa, net ve pedagojik bir şekilde Türkçe açıkla.
Doğru cevabın neden doğru olduğunu 2-3 cümle ile anlat ve yanıltıcı seçeneklerin neden yanlış olduğunu kısaca belirt.

SORU: {question_text}
{opts_str}
DOĞRU CEVAP: {correct_letter}) {correct_text}

Sadece açıklama metnini yaz, başka bir şey ekleme."""

    client = google_genai.Client(api_key=api_key)

    for attempt in range(2):
        try:
            resp = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config={"timeout": 20}
            )
            explanation = resp.text.strip() if resp.text else None
            if explanation:
                return jsonify({"explanation": explanation}), 200
            return jsonify({"explanation": None, "error": "empty_response"}), 200
        except Exception as e:
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err:
                if attempt == 0:
                    _time.sleep(2)
                    continue
                return jsonify({"explanation": None, "error": "rate_limited"}), 200
            if "timeout" in err.lower() or "deadline" in err.lower():
                return jsonify({"explanation": None, "error": "rate_limited"}), 200
            return jsonify({"explanation": None, "error": "api_error"}), 200

    return jsonify({"explanation": None, "error": "rate_limited"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
