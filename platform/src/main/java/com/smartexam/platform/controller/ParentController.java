package com.smartexam.platform.controller;

import com.smartexam.platform.entity.ExamResult;
import com.smartexam.platform.entity.ParentStudentRelation;
import com.smartexam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
public class ParentController {

    private final ParentStudentRelationRepository relationRepo;
    private final ExamResultRepository            examResultRepo;
    private final QuestionAttemptRepository       attemptRepo;
    private final UserRepository                  userRepo;
    private final SpacedRepetitionRepository      spacedRepo;

    private Long getChildId(Long parentId) {
        return relationRepo.findByParentId(parentId)
                .map(ParentStudentRelation::getStudentId)
                .orElseThrow(() -> new RuntimeException("Bağlı öğrenci bulunamadı"));
    }

    @GetMapping("/{parentId}/child-summary")
    public ResponseEntity<Map<String, Object>> getChildSummary(@PathVariable Long parentId) {
        Long childId = getChildId(parentId);

        List<ExamResult> results = examResultRepo.findByUserId(childId);
        var user = userRepo.findById(childId)
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı"));

        double avg = results.stream()
                .mapToDouble(ExamResult::getScorePercentage).average().orElse(0);

        // Ders bazında ortalama
        Map<String, double[]> subjectMap = new LinkedHashMap<>();
        results.forEach(r -> {
            subjectMap.computeIfAbsent(r.getSubject(), k -> new double[]{0, 0});
            subjectMap.get(r.getSubject())[0] += r.getScorePercentage();
            subjectMap.get(r.getSubject())[1]++;
        });

        List<Map<String, Object>> subjectAvgs = subjectMap.entrySet().stream()
                .map(e -> {
                    long subAvg = Math.round(e.getValue()[0] / e.getValue()[1]);
                    String level = subAvg >= 70 ? "İYİ" : subAvg >= 50 ? "ORTA" : "ZAYIF";
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("subject", e.getKey());
                    m.put("avg",     subAvg);
                    m.put("count",   (long) e.getValue()[1]);
                    m.put("level",   level);
                    return m;
                })
                .sorted(Comparator.comparingLong(m -> (Long) m.get("avg")))
                .collect(Collectors.toList());

        List<Map<String, Object>> weakSubjects = subjectAvgs.stream()
                .filter(s -> (Long) s.get("avg") < 60)
                .collect(Collectors.toList());

        String prioritySubject = subjectAvgs.isEmpty() ? "" : (String) subjectAvgs.get(0).get("subject");

        // Hata analizi — ders bazlı döküm
        var attentionList = attemptRepo.findByExamResultUserIdAndErrorType(childId, "ATTENTION");
        var knowledgeList = attemptRepo.findByExamResultUserIdAndErrorType(childId, "KNOWLEDGE_GAP");
        long attentionErrors = attentionList.size();
        long knowledgeGaps   = knowledgeList.size();

        // Ders bazlı dikkat hatası sayıları
        Map<String, Long> attBySubject = attentionList.stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getSubject() != null)
                .collect(Collectors.groupingBy(a -> a.getQuestion().getSubject(), Collectors.counting()));
        List<Map<String, Object>> attentionBySubject = attBySubject.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.<String, Object>of("subject", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        // Ders bazlı konu eksikliği sayıları
        Map<String, Long> gapBySubject = knowledgeList.stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getSubject() != null)
                .collect(Collectors.groupingBy(a -> a.getQuestion().getSubject(), Collectors.counting()));
        List<Map<String, Object>> knowledgeBySubject = gapBySubject.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.<String, Object>of("subject", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        // Konu bazlı eksiklik — hangi konuda kaç hata (topic adıyla)
        Map<String, Long> gapByTopic = knowledgeList.stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getTopic() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getQuestion().getTopic().getName() + "||" + a.getQuestion().getSubject(),
                        Collectors.counting()));
        List<Map<String, Object>> knowledgeByTopic = gapByTopic.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(e -> {
                    String[] parts = e.getKey().split("\\|\\|");
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("topic",   parts[0]);
                    m.put("subject", parts.length > 1 ? parts[1] : "");
                    m.put("count",   e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
        long totalWrong      = attentionErrors + knowledgeGaps;

        String errorProfile, errorTip;
        if (totalWrong == 0) {
            errorProfile = "YETERLİ_VERİ_YOK";
            errorTip = "Henüz yeterli sınav verisi yok. Daha fazla sınav çözüldükçe analiz netleşecek.";
        } else if (attentionErrors > knowledgeGaps * 1.5) {
            errorProfile = "DİKKAT_EKSİKLİĞİ";
            errorTip = String.format("Yanlışların %%%d'i dikkat hatasından kaynaklanıyor. Soruları daha dikkatli okumasını önerin.",
                    (int) ((double) attentionErrors / totalWrong * 100));
        } else if (knowledgeGaps > attentionErrors * 1.5) {
            errorProfile = "KONU_EKSİKLİĞİ";
            errorTip = String.format("Yanlışların %%%d'i konu eksikliğinden kaynaklanıyor. Zayıf derslerdeki videoları izlemesini önerin.",
                    (int) ((double) knowledgeGaps / totalWrong * 100));
        } else {
            errorProfile = "KARMA";
            errorTip = "Hem dikkat hataları hem konu eksikliği var. Düzenli çalışma ve dikkatli okuma alışkanlığı kazandırın.";
        }

        // Son sınavlar — sadece primitive alanlar (lazy load sorunundan kaçınmak için)
        List<Map<String, Object>> recentExams = results.stream()
                .limit(5)
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("subject",         r.getSubject() != null ? r.getSubject() : "");
                    m.put("scorePercentage", r.getScorePercentage());
                    m.put("totalQuestions",  r.getTotalQuestions());
                    m.put("correctAnswers",  r.getCorrectAnswers());
                    m.put("wrongAnswers",    r.getWrongAnswers());
                    m.put("examDate",        r.getExamDate() != null ? r.getExamDate().toString() : null);
                    return m;
                })
                .collect(Collectors.toList());

        int pendingReview = spacedRepo
                .findByUserIdAndNextReviewDateLessThanEqual(childId, LocalDate.now()).size();
        String childName = user.getFullName() != null ? user.getFullName() : user.getEmail();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("childId",         childId);
        response.put("childName",        childName);
        response.put("totalExams",       results.size());
        response.put("overallAvg",       (long) Math.round(avg));
        response.put("subjectAvgs",      subjectAvgs);
        response.put("weakSubjects",     weakSubjects);
        response.put("prioritySubject",  prioritySubject);
        response.put("errorProfile",     errorProfile);
        response.put("errorTip",         errorTip);
        response.put("attentionErrors",       attentionErrors);
        response.put("knowledgeGaps",         knowledgeGaps);
        response.put("attentionBySubject",    attentionBySubject);
        response.put("knowledgeBySubject",    knowledgeBySubject);
        response.put("knowledgeByTopic",      knowledgeByTopic);
        response.put("pendingReview",    pendingReview);
        response.put("recentExams",      recentExams);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assign")
    public ResponseEntity<String> assign(
            @RequestParam Long parentId,
            @RequestParam Long studentId) {
        if (relationRepo.existsByParentIdAndStudentId(parentId, studentId))
            return ResponseEntity.ok("Zaten ilişkilendirilmiş.");
        var rel = new ParentStudentRelation();
        rel.setParentId(parentId);
        rel.setStudentId(studentId);
        relationRepo.save(rel);
        return ResponseEntity.ok("İlişki kuruldu.");
    }

    @PostMapping("/assign-by-email")
    public ResponseEntity<Map<String, Object>> assignByEmail(
            @RequestParam Long parentId,
            @RequestParam String studentEmail) {
        var student = userRepo.findByEmail(studentEmail)
                .orElse(null);
        if (student == null)
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Bu e-posta adresine kayıtlı öğrenci bulunamadı."));
        if (!student.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_STUDENT")))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Bu hesap bir öğrenci hesabı değil."));
        if (relationRepo.existsByParentIdAndStudentId(parentId, student.getId()))
            return ResponseEntity.ok(Map.of("message", "Zaten ilişkilendirilmiş.",
                    "studentName", student.getFullName() != null ? student.getFullName() : student.getEmail()));
        var rel = new ParentStudentRelation();
        rel.setParentId(parentId);
        rel.setStudentId(student.getId());
        relationRepo.save(rel);
        return ResponseEntity.ok(Map.of(
                "message", "Bağlantı kuruldu.",
                "studentName", student.getFullName() != null ? student.getFullName() : student.getEmail(),
                "studentId", student.getId()));
    }

    @GetMapping("/{parentId}/connection-status")
    public ResponseEntity<Map<String, Object>> connectionStatus(@PathVariable Long parentId) {
        var relation = relationRepo.findByParentId(parentId).orElse(null);
        if (relation == null)
            return ResponseEntity.ok(Map.of("connected", false));
        var student = userRepo.findById(relation.getStudentId()).orElse(null);
        return ResponseEntity.ok(Map.of(
                "connected", true,
                "studentId", relation.getStudentId(),
                "studentName", student != null && student.getFullName() != null
                        ? student.getFullName() : (student != null ? student.getEmail() : "?")));
    }
}
