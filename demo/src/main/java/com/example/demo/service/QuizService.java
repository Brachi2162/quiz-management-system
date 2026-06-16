package com.example.demo.service;

import com.example.demo.Entities.Player;
import com.example.demo.Entities.Question;
import com.example.demo.Entities.Quiz;
import com.example.demo.dto.QuestionDTO;
import com.example.demo.repository.PlayerRepository;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class QuizService {

    @Autowired private QuizRepository quizRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private PlayerRepository playerRepository;
    @Autowired private SseService sseService;

    public List<Quiz> getQuizzesByEmail(String email) {
        return quizRepository.findByCreatorEmail(email);
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public void saveQuiz(Quiz quiz) {
        quizRepository.save(quiz);
    }

    public QuestionDTO getNextRandomQuestion(Long quizId) {
        List<Question> questions = questionRepository.findByQuizId(quizId);
        if (questions.isEmpty()) return null;
        Random random = new Random();

        Question q = questions.get(random.nextInt(questions.size()));

        // Filter out null or empty answers
        List<String> answers = new ArrayList<>();
        if (q.getAnswer1() != null && !q.getAnswer1().trim().isEmpty()) answers.add(q.getAnswer1());
        if (q.getAnswer2() != null && !q.getAnswer2().trim().isEmpty()) answers.add(q.getAnswer2());
        if (q.getAnswer3() != null && !q.getAnswer3().trim().isEmpty()) answers.add(q.getAnswer3());
        if (q.getAnswer4() != null && !q.getAnswer4().trim().isEmpty()) answers.add(q.getAnswer4());

        Collections.shuffle(answers);

        // Get timeLimit from question, or use quiz default, or use 20 as fallback
        Integer timeLimit = q.getTimeLimit();
        if (timeLimit == null) {
            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            timeLimit = (quiz != null && quiz.getTimeLimit() != null) ? quiz.getTimeLimit() : 20;
        }

        // Store the correct answer (answer1 is always the correct one)
        String correctAnswer = q.getAnswer1();

        return new QuestionDTO(q.getId(), q.getQuestionText(), answers, q.getPoints(), timeLimit, correctAnswer);
    }

    public void submitAnswer(Long playerId, Long questionId, String selectedAnswer, long timeTaken) {
        Player player = playerRepository.findById(playerId).orElseThrow();
        Question question = questionRepository.findById(questionId).orElseThrow();

        if (question.getAnswer1().equals(selectedAnswer)) {
            player.setPoints(player.getPoints() + question.getPoints());
        }
        player.setTotalResponseTime(player.getTotalResponseTime() + timeTaken);
        playerRepository.save(player);
        updateLeaderboard(player.getQuizCode()); // הנחה שה-quizCode משמש לזיהוי
    }

    public void updateLeaderboard(String quizCode) {
        // כאן ניתן להוסיף לוגיקה לשליחת עדכון SSE לכל השחקנים
    }
}