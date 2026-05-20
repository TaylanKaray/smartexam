package com.smartexam.platform.service;

import com.smartexam.platform.entity.Question;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.repository.QuestionRepository;
import com.smartexam.platform.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Question getQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Soru bulunamadı: " + id));
    }

    public List<Question> getQuestionsBySubject(String subject) {
        return questionRepository.findBySubject(subject);
    }

    public List<Question> getQuestionsBySubjectAndDifficulty(String subject, Integer difficulty) {
        return questionRepository.findBySubjectAndDifficultyLevel(subject, difficulty);
    }

    public Question createQuestion(Question question) {
        return questionRepository.save(question);
    }

    public Question updateQuestion(Long id, Question updated) {
        Question existing = getQuestionById(id);
        existing.setQuestionText(updated.getQuestionText());
        existing.setOptionA(updated.getOptionA());
        existing.setOptionB(updated.getOptionB());
        existing.setOptionC(updated.getOptionC());
        existing.setOptionD(updated.getOptionD());
        existing.setCorrectAnswer(updated.getCorrectAnswer());
        existing.setSubject(updated.getSubject());
        existing.setDifficultyLevel(updated.getDifficultyLevel());
        return questionRepository.save(existing);
    }

    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }

    /**
     * JSON listesinden toplu soru yükler.
     * Format: [{ questionText, optionA, optionB, optionC, optionD, correctAnswer,
     *             subject, difficultyLevel, topicId (opsiyonel) }]
     */
    public Map<String, Object> bulkImport(List<Map<String, Object>> items) {
        int saved = 0, skipped = 0;
        for (Map<String, Object> item : items) {
            try {
                Question q = new Question();
                q.setQuestionText(item.get("questionText").toString());
                q.setOptionA(item.get("optionA").toString());
                q.setOptionB(item.get("optionB").toString());
                q.setOptionC(item.get("optionC").toString());
                q.setOptionD(item.get("optionD").toString());
                q.setCorrectAnswer(item.get("correctAnswer").toString());
                q.setSubject(item.getOrDefault("subject", "Genel").toString());

                int diff = item.get("difficultyLevel") != null
                        ? Integer.parseInt(item.get("difficultyLevel").toString()) : 1;
                q.setDifficultyLevel(diff);
                q.setWeightCoefficient(diff == 1 ? 1.0 : diff == 2 ? 1.5 : 2.0);

                if (item.get("topicId") != null) {
                    Long topicId = Long.valueOf(item.get("topicId").toString());
                    topicRepository.findById(topicId).ifPresent(q::setTopic);
                }

                questionRepository.save(q);
                saved++;
            } catch (Exception e) {
                skipped++;
            }
        }
        return Map.of("saved", saved, "skipped", skipped, "total", items.size());
    }
}