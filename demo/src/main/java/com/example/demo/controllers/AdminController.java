package com.example.demo.controllers;

import com.example.demo.Entities.Quiz;
import com.example.demo.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private QuizService quizService;

    @GetMapping("/my-quizzes")
    public List<Quiz> getMyQuizzes(@RequestParam String email) {
        return quizService.getQuizzesByEmail(email);
    }

    @PostMapping("/face-login")
    public ResponseEntity<?> faceLogin(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerAdmin(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("status", "registered"));
    }
}