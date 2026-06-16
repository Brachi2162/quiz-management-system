package com.example.demo.service;

import com.example.demo.Entities.Question;
import com.example.demo.Entities.Quiz;
import com.example.demo.repository.QuestionRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ExcelService {

    @Autowired
    private QuestionRepository questionRepository;

    private String getSafeValue(Sheet sheet, int rowIndex, int cellIndex, DataFormatter formatter) {
        if (rowIndex < 0 || rowIndex > sheet.getLastRowNum()) return "";
        Row row = sheet.getRow(rowIndex);
        if (row == null) return "";
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return "";
        return formatter.formatCellValue(cell).trim();
    }

    public void importQuestionsFromExcel(MultipartFile file, Quiz quiz) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            // הלולאה עוברת על השורות בקפיצות של 5 (שאלה + 4 תשובות)
            for (int i = 0; i <= sheet.getLastRowNum(); i += 5) {
                String questionText = getSafeValue(sheet, i, 0, formatter);

                // אם נתקלנו בשורה ריקה באמצע, נדלג עליה
                if (questionText.isEmpty()) {
                    continue;
                }

                Question q = new Question();
                q.setQuiz(quiz);
                q.setQuestionText(questionText);

                // קריאת 4 תשובות מהשורות שמתחת לשאלה
                // לפי ההוראות: התשובה הראשונה היא תמיד הנכונה באקסל
                q.setAnswer1(getSafeValue(sheet, i + 1, 0, formatter));
                q.setAnswer2(getSafeValue(sheet, i + 2, 0, formatter));
                q.setAnswer3(getSafeValue(sheet, i + 3, 0, formatter));
                q.setAnswer4(getSafeValue(sheet, i + 4, 0, formatter));

                // הגדרות ניקוד וזמן מהחידון או ברירת מחדל
                q.setPoints(10);
                q.setTimeLimit(quiz.getTimeLimit() != null ? quiz.getTimeLimit() : 20);
                q.setDifficulty("MEDIUM");

                // שמירה רק אם השאלה והתשובות קיימות באמת
                if (!q.getAnswer1().isEmpty() && !q.getAnswer2().isEmpty()) {
                    questionRepository.save(q);
                    System.out.println("שאלה נשמרה בהצלחה: " + questionText);
                }
            }
            System.out.println("סיום טעינת שאלות עבור חידון: " + quiz.getId());
        } catch (Exception e) {
            System.err.println("שגיאה קריטית בקריאת האקסל: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("שגיאה בעיבוד קובץ האקסל: " + e.getMessage());
        }
    }
}