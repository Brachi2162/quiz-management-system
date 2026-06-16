let cameraStream = null;
let currentPlayer = null;
let currentQuizId = null;
let currentQuestion = null;
let playerStats = {
    questionsAnswered: 0,
    correctAnswers: 0,
    totalQuestions: 0
};
let answeredQuestionIds = new Set(); // Track which questions this player has answered
let availableQuestions = []; // All questions in the quiz

// ---------------- QUIZZES ----------------
let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [
    { name: "חידון דוגמה", code: "123", start: "2024-05-12T10:00", end: "2024-05-12T20:00" }
];

// ---------------- FACE API ----------------
async function loadModels() {
    try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        document.getElementById('auth-status').innerText = "המודלים נטענו - מוכן לזיהוי פנים";
    } catch (e) {
        console.error("Models failed to load", e);
        document.getElementById('auth-status').innerText = "שגיאה בטעינת מודלים: " + e.message;
    }
}

// ---------------- SECTIONS ----------------
async function showSection(id) {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');

    if (id === 'admin-auth') {
        await startCamera();
        await loadModels();
    }
    if (id === 'admin-panel') {
        renderQuizzes();
    }
}

// ---------------- CAMERA ----------------
async function startCamera() {
    const video = document.getElementById('video');
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = cameraStream;
    } catch (err) {
        alert("המצלמה חסומה");
    }
}

// ---------------- ADMIN LOGIN ----------------
async function handleAdminLogin() {
    const nameInput = document.getElementById('admin-name-input').value;
    const idInput = document.getElementById('admin-id-input').value;
    const storedAdmin = localStorage.getItem('adminUser');
    const video = document.getElementById('video');

    if (!storedAdmin) {
        if (!nameInput || !idInput) {
            alert("בכניסה הראשונה יש להזין שם ותעודת זהות");
            return;
        }

        // Capture face for first-time registration
        document.getElementById('auth-status').innerText = "סורק פנים לרישום ראשוני...";

        try {
            const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert("לא זוהו פנים. אנא ודא שפניך נראים במצלמה.");
                document.getElementById('auth-status').innerText = "לא זוהו פנים - נסה שוב";
                return;
            }

            // Store admin with face descriptor
            localStorage.setItem('adminUser', JSON.stringify({
                name: nameInput,
                id: idInput,
                faceDescriptor: Array.from(detection.descriptor)
            }));

            alert("נרשמת בהצלחה! הפנים שלך נשמרו.");
            showSection('admin-panel');
            document.getElementById('welcome-msg').innerText = `שלום, ${nameInput}`;
        } catch (e) {
            console.error("Face detection error:", e);
            alert("שגיאה בזיהוי פנים. ממשיך ללא זיהוי פנים.");
            localStorage.setItem('adminUser', JSON.stringify({ name: nameInput, id: idInput }));
            showSection('admin-panel');
        }
        return;
    }

    // Existing admin - verify face
    const adminData = JSON.parse(storedAdmin);
    const adminName = adminData.name;
    document.getElementById('auth-status').innerText = "מזהה פנים...";

    try {
        if (adminData.faceDescriptor) {
            const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert("לא זוהו פנים. נסה שוב או רשום מחדש.");
                document.getElementById('auth-status').innerText = "לא זוהו פנים";
                return;
            }

            // Compare faces
            const storedDescriptor = new Float32Array(adminData.faceDescriptor);
            const distance = faceapi.euclideanDistance(storedDescriptor, detection.descriptor);

            if (distance < 0.6) { // Threshold for face match
                alert(`שלום ${adminName}! זוהית בהצלחה ✓`);
                showSection('admin-panel');
                document.getElementById('welcome-msg').innerText = `שלום, ${adminName}`;
            } else {
                alert("הפנים לא תואמות למנהל הרשום. גישה נדחתה.");
                document.getElementById('auth-status').innerText = "זיהוי נכשל";
            }
        } else {
            // Old admin without face data - allow entry without verification
            alert(`שלום ${adminName}!`);
            showSection('admin-panel');
            document.getElementById('welcome-msg').innerText = `שלום, ${adminName}`;
        }
    } catch (e) {
        console.error("Face verification error:", e);
        alert("שגיאה בזיהוי פנים. ממשיך ללא אימות.");
        showSection('admin-panel');
        document.getElementById('welcome-msg').innerText = `שלום, ${adminName}`;
    }
}

// ---------------- QUIZ MANAGEMENT ----------------
function renderQuizzes() {
    const list = document.getElementById('quiz-list');
    fetch('/api/quizzes')
        .then(res => res.json())
        .then(serverQuizzes => {
            const allQuizzes = serverQuizzes.length > 0 ? serverQuizzes : quizzes;
            list.innerHTML = allQuizzes.map(q => `
                <div class="quiz-item">
                    <div>
                        <strong>${q.title || q.name}</strong><br>
                        <small style="color: #00bfff;">קוד: ${q.id || q.code}</small>
                    </div>
                    <div class="quiz-actions">
                        <button class="btn-edit" onclick="manageQuestions('${q.id || q.code}', '${q.title || q.name}')">📝 שאלות</button>
                        <button class="btn-edit" onclick="editQuiz('${q.id || q.code}')">✏️</button>
                        <button onclick="deleteQuiz('${q.id || q.code}')" style="color:#ff0064;background:none;border:none;cursor:pointer;font-size:20px;">❌</button>
                    </div>
                </div>
            `).join('');
        }).catch(() => { list.innerHTML = "<p>שגיאה בטעינה מהשרת</p>"; });
}

async function saveNewQuiz() {
    const title = document.getElementById('new-quiz-name').value;
    const id = document.getElementById('new-quiz-code').value;
    const startTime = document.getElementById('quiz-start').value;
    const endTime = document.getElementById('quiz-end').value;
    const timeLimit = document.getElementById('quiz-time-limit').value;
    const fileInput = document.getElementById('quiz-excel-file');

    if (!title || !id || !startTime || !endTime || fileInput.files.length === 0) {
        alert("נא למלא את כל השדות ולהעלות קובץ אקסל");
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("id", id);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("timeLimit", timeLimit);
    formData.append("creatorEmail", "admin@gmail.com");
    formData.append("file", fileInput.files[0]);

    try {
        const response = await fetch('/api/quizzes/upload', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert("החידון נוצר בהצלחה!");
            showSection('admin-panel');
        } else {
            const errorMsg = await response.text();
            alert("שגיאת שרת: " + errorMsg);
        }
    } catch (e) { alert("השרת לא מגיב"); }
}

function deleteQuiz(id) {
    if (confirm("למחוק?")) {
        fetch(`/api/quizzes/${id}`, { method: 'DELETE' }).then(() => renderQuizzes());
    }
}

function editQuiz(code) {
    showSection('add-quiz-form');
    document.getElementById('form-title').innerText = "עריכת חידון " + code;
    document.getElementById('new-quiz-code').value = code;
    document.getElementById('new-quiz-code').disabled = true;
}

// ---------------- PLAYER LOGIN ----------------
function onGoogleLogin(response) {
    try {
        const data = JSON.parse(atob(response.credential.split('.')[1]));
        document.getElementById('p-img').src = data.picture;
        document.getElementById('p-name').innerText = data.name;
        document.getElementById('player-card').classList.remove('hidden');
        document.getElementById('google-wrapper').classList.add('hidden');
    } catch (e) {
        console.error("Google login decode error", e);
    }
}

function manualPlayerLogin() {
    const name = document.getElementById('manual-name').value;
    if (!name) { alert("נא להזין שם"); return; }
    document.getElementById('p-name').innerText = name;
    document.getElementById('p-img').src = "https://ui-avatars.com/api/?name=" + name;
    document.getElementById('player-card').classList.remove('hidden');
    document.getElementById('google-wrapper').classList.add('hidden');
    document.getElementById('manual-login').classList.add('hidden');
    document.querySelector('.divider').classList.add('hidden');
}

async function joinQuiz() {
    const code = document.getElementById('quiz-code').value;
    const name = document.getElementById('p-name').innerText;
    const img = document.getElementById('p-img').src;
    try {
        const response = await fetch(`/api/player/join/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName: name, profileImage: img })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        currentPlayer = data;
        currentQuizId = data.quiz.id;

        // Reset quiz state for new game
        quizFinished = false;
        answeredQuestionIds.clear();
        playerStats = {
            questionsAnswered: 0,
            correctAnswers: 0,
            totalQuestions: 0
        };

        // Load all questions to know total count
        await loadAllQuestions();

        showSection('game-screen');
        loadQuestion();
        loadLeaderboard();
        startLeaderboardRefresh();
    } catch (e) { alert("שגיאה בכניסה: " + e.message); }
}

async function loadAllQuestions() {
    try {
        const response = await fetch(`/api/questions/quiz/${currentQuizId}`);
        availableQuestions = await response.json();
        playerStats.totalQuestions = availableQuestions.length;
    } catch (e) {
        console.error('Error loading all questions:', e);
        playerStats.totalQuestions = 0;
    }
}

// ---------------- GAMEPLAY ----------------
async function loadQuestion() {
    if (!currentQuizId || quizFinished) return;

    // Get list of unanswered questions
    const unansweredQuestions = availableQuestions.filter(q => !answeredQuestionIds.has(q.id));

    // If no more questions, show personal end screen
    if (unansweredQuestions.length === 0) {
        showPersonalEndScreen();
        return;
    }

    // Pick a random unanswered question
    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const selectedQuestion = unansweredQuestions[randomIndex];

    try {
        // Fetch the full question details with shuffled answers
        const response = await fetch(`/api/questions/${selectedQuestion.id}`);
        if (!response.ok) {
            console.error("Failed to load question");
            showPersonalEndScreen();
            return;
        }

        const fullQuestion = await response.json();

        // Create a DTO-like structure with shuffled answers
        const answers = [];
        if (fullQuestion.answer1) answers.push(fullQuestion.answer1);
        if (fullQuestion.answer2) answers.push(fullQuestion.answer2);
        if (fullQuestion.answer3) answers.push(fullQuestion.answer3);
        if (fullQuestion.answer4) answers.push(fullQuestion.answer4);

        // Shuffle answers
        const shuffledAnswers = answers.sort(() => Math.random() - 0.5);

        const questionDTO = {
            id: fullQuestion.id,
            questionText: fullQuestion.questionText,
            shuffledAnswers: shuffledAnswers,
            correctAnswer: fullQuestion.answer1, // answer1 is always correct
            timeLimit: fullQuestion.timeLimit || 20,
            points: fullQuestion.points || 10
        };

        renderQuestion(questionDTO);
    } catch (err) {
        console.error("שגיאה בטעינת שאלה:", err);
        showPersonalEndScreen();
    }
}

async function showEndScreen() {
    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    try {
        // Get final leaderboard
        const response = await fetch(`/api/player/leaderboard/${currentQuizId}`);
        const players = await response.json();

        if (players && players.length > 0) {
            const winner = players[0];

            // Update winner info
            document.getElementById('winner-img').src = winner.profileImage;
            document.getElementById('winner-name').innerText = winner.displayName;
            document.getElementById('winner-score').innerText = `${winner.points} נקודות`;

            // Update final leaderboard
            const finalLeaderboard = document.getElementById('final-leaderboard');
            finalLeaderboard.innerHTML = players.map((player, index) => `
                <div class="player-card ${index === 0 ? 'leader' : ''}" style="margin: 10px auto; max-width: 400px;">
                    <span style="font-size: 24px; margin-left: 10px;">${index + 1}.</span>
                    <img src="${player.profileImage}">
                    <div>
                        <strong>${player.displayName}</strong><br>
                        ${player.points} נק'
                    </div>
                </div>
            `).join('');

            // Notify server about quiz end to send emails
            fetch(`/api/quizzes/${currentQuizId}/end`, { method: 'POST' }).catch(e => console.error('Email notification failed', e));
        }
    } catch (e) {
        console.error("Error loading end screen:", e);
    }

    // Show end screen
    showSection('end-screen');
}

async function showPersonalEndScreen() {
    // Mark quiz as finished to prevent loading more questions
    quizFinished = true;

    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Stop leaderboard refresh
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
        leaderboardInterval = null;
    }

    try {
        // Get final leaderboard
        const response = await fetch(`/api/player/leaderboard/${currentQuizId}`);
        const players = await response.json();

        if (players && players.length > 0) {
            // Find current player's rank
            const playerIndex = players.findIndex(p => p.id === currentPlayer.id);
            const playerRank = playerIndex >= 0 ? playerIndex + 1 : '?';
            const playerScore = currentPlayer.points || 0;

            // Update winner info with personal stats
            document.getElementById('winner-img').src = currentPlayer.profileImage;
            document.getElementById('winner-name').innerText = `${currentPlayer.displayName} - סיימת!`;
            document.getElementById('winner-score').innerText = `ניקוד סופי: ${playerScore} | דירוג: #${playerRank}`;

            // Update message
            document.querySelector('#end-screen h1').innerText = `🎉 כל הכבוד! סיימת את החידון! 🎉`;
            document.querySelector('#winner-info h2').innerText = 'התוצאות שלך';

            // Show stats
            const statsHTML = `
                <div style="display: flex; justify-content: space-around; margin-top: 20px; gap: 20px;">
                    <div style="background: rgba(0, 191, 255, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #00bfff; flex: 1;">
                        <div style="color: #888; font-size: 14px;">שאלות שענית</div>
                        <div style="color: #00bfff; font-size: 28px; font-weight: bold;">${playerStats.questionsAnswered}</div>
                    </div>
                    <div style="background: rgba(0, 255, 157, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #00ff9d; flex: 1;">
                        <div style="color: #888; font-size: 14px;">תשובות נכונות</div>
                        <div style="color: #00ff9d; font-size: 28px; font-weight: bold;">${playerStats.correctAnswers}</div>
                    </div>
                    <div style="background: rgba(0, 191, 255, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #00bfff; flex: 1;">
                        <div style="color: #888; font-size: 14px;">אחוז הצלחה</div>
                        <div style="color: #00bfff; font-size: 28px; font-weight: bold;">${Math.round((playerStats.correctAnswers / playerStats.questionsAnswered) * 100)}%</div>
                    </div>
                </div>
            `;
            document.getElementById('winner-info').innerHTML += statsHTML;

            // Update final leaderboard
            const finalLeaderboard = document.getElementById('final-leaderboard');
            finalLeaderboard.innerHTML = players.map((player, index) => `
                <div class="player-card ${index === 0 ? 'leader' : ''} ${player.id === currentPlayer.id ? 'leader' : ''}" style="margin: 10px auto; max-width: 400px;">
                    <span style="font-size: 24px; margin-left: 10px; color: #00ff9d;">#${index + 1}</span>
                    <img src="${player.profileImage}">
                    <div>
                        <strong style="color: ${player.id === currentPlayer.id ? '#00ff9d' : '#e0e0e0'}">${player.displayName} ${player.id === currentPlayer.id ? '(את/ה)' : ''}</strong><br>
                        <span style="color: #00bfff;">${player.points} נק'</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Error loading personal end screen:", e);
    }

    // Show end screen
    showSection('end-screen');
}

let timerInterval = null; // Global timer reference
let questionStartTime = null; // Track when question was displayed
let leaderboardInterval = null; // Global leaderboard refresh interval
let quizFinished = false; // Flag to track if player finished the quiz

function renderQuestion(question) {
    if (!question || quizFinished) return;
    currentQuestion = question;
    const title = document.getElementById('question-title');
    const container = document.getElementById('answers-container');
    const timerDisplay = document.getElementById('timer');

    // Clear previous timer if exists
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Record when this question started
    questionStartTime = Date.now();

    title.innerText = question.questionText || "שאלה ללא כותרת";
    const timeLimit = question.timeLimit || 20;
    timerDisplay.innerText = timeLimit;

    // Get answers from shuffledAnswers array (coming from backend)
    const answers = question.shuffledAnswers || [];

    // ניקוי הקונטיינר
    container.innerHTML = "";

    // בדיקה: אם אין תשובות, נציג הודעה במקום להשאיר ריק
    if (answers.length === 0) {
        container.innerHTML = "<p style='color: #ef4444; font-weight: bold;'>שגיאה: לא נמצאו תשובות לשאלה זו בבסיס הנתונים.</p>";
        return;
    }

    // Render answer buttons
    answers.forEach(answerText => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerText = answerText;
        btn.onclick = () => submitAnswer(answerText, btn);
        container.appendChild(btn);
    });

    // Start timer
    let timeLeft = timeLimit;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            // Auto-submit or move to next question when time runs out
            loadQuestion();
        }
    }, 1000);
}

async function submitAnswer(answer, clickedButton) {
    // Don't allow answer submission if quiz is finished
    if (quizFinished) return;

    // Calculate actual time taken
    const timeTaken = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;

    // Clear timer to prevent double submission
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Disable all buttons to prevent multiple clicks
    const allButtons = document.querySelectorAll('.answer-btn');
    allButtons.forEach(btn => btn.disabled = true);

    // Check if answer is correct
    const isCorrect = answer === currentQuestion.correctAnswer;

    // Mark this question as answered
    answeredQuestionIds.add(currentQuestion.id);

    // Update player stats
    playerStats.questionsAnswered++;
    if (isCorrect) {
        playerStats.correctAnswers++;
    }

    // Update highlights bar
    updateHighlightsBar();

    // Show visual feedback with neon colors
    if (isCorrect) {
        clickedButton.style.background = 'rgba(0, 255, 157, 0.3)';
        clickedButton.style.color = '#00ff9d';
        clickedButton.style.border = '2px solid #00ff9d';
        clickedButton.style.boxShadow = '0 0 30px rgba(0, 255, 157, 0.6)';
    } else {
        clickedButton.style.background = 'rgba(255, 0, 100, 0.3)';
        clickedButton.style.color = '#ff0064';
        clickedButton.style.border = '2px solid #ff0064';
        clickedButton.style.boxShadow = '0 0 30px rgba(255, 0, 100, 0.6)';

        // Highlight the correct answer in green
        allButtons.forEach(btn => {
            if (btn.innerText === currentQuestion.correctAnswer) {
                btn.style.background = 'rgba(0, 255, 157, 0.3)';
                btn.style.color = '#00ff9d';
                btn.style.border = '2px solid #00ff9d';
                btn.style.boxShadow = '0 0 30px rgba(0, 255, 157, 0.6)';
            }
        });
    }

    try {
        const response = await fetch(`/api/player/submit-answer?playerId=${currentPlayer.id}&questionId=${currentQuestion.id}&answer=${encodeURIComponent(answer)}&timeTaken=${timeTaken}`, { method: 'POST' });
        if (response.ok) {
            loadLeaderboard();

            // Wait 1.5 seconds to show feedback, then load next question
            // loadQuestion() will check if there are more questions or show end screen
            setTimeout(() => {
                loadQuestion();
            }, 1500);
        }
    } catch (e) { console.error("Submit answer error", e); }
}

function updateHighlightsBar() {
    document.getElementById('player-questions-answered').innerText = playerStats.questionsAnswered;
    document.getElementById('player-correct-answers').innerText = playerStats.correctAnswers;
    if (currentPlayer) {
        document.getElementById('player-current-score').innerText = currentPlayer.points || 0;
    }
}

// ---------------- LEADERBOARD ----------------
async function loadLeaderboard() {
    if (!currentQuizId) return;
    try {
        const response = await fetch(`/api/player/leaderboard/${currentQuizId}`);
        const players = await response.json();
        const list = document.getElementById('players-list');
        if (!players || players.length === 0) {
            list.innerHTML = "<p>אין שחקנים</p>";
            return;
        }

        // Find current player rank and update score
        if (currentPlayer) {
            const playerIndex = players.findIndex(p => p.id === currentPlayer.id);
            if (playerIndex >= 0) {
                currentPlayer.points = players[playerIndex].points;
                document.getElementById('player-rank').innerText = `#${playerIndex + 1}`;
                document.getElementById('player-current-score').innerText = currentPlayer.points;
            }
        }

        list.innerHTML = players.map((player, index) => `
            <div class="player-card ${index === 0 ? 'leader' : ''}">
                <span style="margin-left: 10px; color: #00ff9d; font-weight: bold;">#${index + 1}</span>
                <img src="${player.profileImage}">
                <div>
                    <strong>${player.displayName}</strong><br>
                    <span style="color: #00bfff;">${player.points} נק'</span>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error("Leaderboard error:", e); }
}

// Start leaderboard refresh interval when quiz begins
function startLeaderboardRefresh() {
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
    }
    leaderboardInterval = setInterval(() => {
        if (currentQuizId && !quizFinished) {
            loadLeaderboard();
        }
    }, 3000);
}

// ---------------- QUESTION MANAGEMENT ----------------
let currentManageQuizId = null;

async function manageQuestions(quizId, quizTitle) {
    currentManageQuizId = quizId;
    document.getElementById('qm-quiz-title').innerText = quizTitle;
    showSection('question-manager');
    loadQuestions();
}

async function loadQuestions() {
    try {
        const response = await fetch(`/api/questions/quiz/${currentManageQuizId}`);
        const questions = await response.json();
        const list = document.getElementById('questions-list');

        if (!questions || questions.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #888;">אין שאלות בחידון זה. הוסף שאלה חדשה!</p>';
            return;
        }

        list.innerHTML = questions.map((q, index) => `
            <div class="quiz-item" style="display: block; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="color: #00ff9d; font-weight: bold; margin-bottom: 8px;">שאלה ${index + 1}</div>
                        <div style="font-size: 18px; margin-bottom: 10px;">${q.questionText}</div>
                        <div style="font-size: 14px; color: #888;">
                            ✅ ${q.answer1} | ❌ ${q.answer2} | ❌ ${q.answer3}${q.answer4 ? ' | ❌ ' + q.answer4 : ''}
                        </div>
                        <div style="margin-top: 8px; font-size: 14px;">
                            <span style="color: #00bfff;">⭐ ${q.points} נק'</span> |
                            <span style="color: #00bfff;">⏱️ ${q.timeLimit || 20}s</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-edit" onclick="editQuestion(${q.id})">✏️ ערוך</button>
                        <button onclick="deleteQuestion(${q.id})" style="color:#ff0064;background:#1a1a1a;border:1px solid #ff0064;padding:8px 15px;border-radius:6px;cursor:pointer;">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading questions:', e);
        document.getElementById('questions-list').innerHTML = '<p style="color: #ff0064;">שגיאה בטעינת שאלות</p>';
    }
}

function showAddQuestionForm() {
    document.getElementById('add-question-form').classList.remove('hidden');
    clearQuestionForm();
}

function cancelQuestionForm() {
    document.getElementById('add-question-form').classList.add('hidden');
    clearQuestionForm();
}

function clearQuestionForm() {
    document.getElementById('edit-question-id').value = '';
    document.getElementById('question-text').value = '';
    document.getElementById('answer-1').value = '';
    document.getElementById('answer-2').value = '';
    document.getElementById('answer-3').value = '';
    document.getElementById('answer-4').value = '';
    document.getElementById('question-points').value = '10';
    document.getElementById('question-time').value = '20';
}

async function saveQuestion() {
    const questionId = document.getElementById('edit-question-id').value;
    const questionData = {
        quizId: currentManageQuizId,
        questionText: document.getElementById('question-text').value,
        answer1: document.getElementById('answer-1').value,
        answer2: document.getElementById('answer-2').value,
        answer3: document.getElementById('answer-3').value,
        answer4: document.getElementById('answer-4').value,
        points: parseInt(document.getElementById('question-points').value),
        timeLimit: parseInt(document.getElementById('question-time').value)
    };

    if (!questionData.questionText || !questionData.answer1 || !questionData.answer2 || !questionData.answer3) {
        alert('נא למלא לפחות שאלה ו-3 תשובות');
        return;
    }

    try {
        const url = questionId ? `/api/questions/${questionId}` : '/api/questions';
        const method = questionId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });

        if (response.ok) {
            alert(questionId ? 'השאלה עודכנה בהצלחה!' : 'השאלה נוספה בהצלחה!');
            cancelQuestionForm();
            loadQuestions();
        } else {
            alert('שגיאה בשמירת שאלה');
        }
    } catch (e) {
        console.error('Error saving question:', e);
        alert('שגיאה בשמירת שאלה');
    }
}

async function editQuestion(questionId) {
    try {
        const response = await fetch(`/api/questions/${questionId}`);
        const question = await response.json();

        document.getElementById('edit-question-id').value = question.id;
        document.getElementById('question-text').value = question.questionText;
        document.getElementById('answer-1').value = question.answer1;
        document.getElementById('answer-2').value = question.answer2;
        document.getElementById('answer-3').value = question.answer3;
        document.getElementById('answer-4').value = question.answer4 || '';
        document.getElementById('question-points').value = question.points;
        document.getElementById('question-time').value = question.timeLimit || 20;

        document.getElementById('add-question-form').classList.remove('hidden');
    } catch (e) {
        console.error('Error loading question for edit:', e);
        alert('שגיאה בטעינת שאלה');
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('האם למחוק שאלה זו?')) return;

    try {
        const response = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('השאלה נמחקה');
            loadQuestions();
        } else {
            alert('שגיאה במחיקת שאלה');
        }
    } catch (e) {
        console.error('Error deleting question:', e);
        alert('שגיאה במחיקת שאלה');
    }
}