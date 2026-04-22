const TOTAL = 9;
const API_URL = 'https://opentdb.com/api.php?amount=9&category=26&difficulty=easy&type=multiple';

let questions = [];
let current = 0;
let score = 0;
let answered = false;

function decode(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadQuestions() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('error').style.display = 'none';

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (data.response_code !== 0) throw new Error('API returned an error code.');

    questions = data.results.map(q => ({
      question: decode(q.question),
      correct: decode(q.correct_answer),
      choices: shuffle([q.correct_answer, ...q.incorrect_answers].map(decode))
    }));

    current = 0;
    score = 0;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    renderQuestion();
  } catch (e) {
    document.getElementById('loading').style.display = 'none';
    const errEl = document.getElementById('error');
    errEl.style.display = 'block';
    errEl.textContent = 'Could not load questions. Please refresh and try again.';
    console.error(e);
  }
}

function renderQuestion() {
  answered = false;

  const q = questions[current];

  document.getElementById('q-meta').textContent = `Question ${current + 1} of ${TOTAL}`;
  document.getElementById('q-text').textContent = q.question;
  document.getElementById('progress-bar').style.width = `${(current / TOTAL) * 100}%`;
  document.getElementById('score-badge').textContent = `Score: ${score}`;
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = '';
  document.getElementById('next-btn').style.display = 'none';

  const container = document.getElementById('answers');
  container.innerHTML = '';

  q.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => selectAnswer(choice, btn));
    container.appendChild(btn);
  });
}

function selectAnswer(choice, clickedBtn) {
  if (answered) return;
  answered = true;

  const q = questions[current];
  const allBtns = document.querySelectorAll('.ans-btn');

  allBtns.forEach(btn => { btn.disabled = true; });

  const feedback = document.getElementById('feedback');

  if (choice === q.correct) {
    clickedBtn.classList.add('correct');
    score++;
    feedback.textContent = 'Correct!';
    feedback.className = 'correct';
  } else {
    clickedBtn.classList.add('wrong');
    allBtns.forEach(btn => {
      if (btn.textContent === q.correct) btn.classList.add('reveal-correct');
    });
    feedback.textContent = `Wrong — the answer was "${q.correct}"`;
    feedback.className = 'wrong';
  }

  document.getElementById('score-badge').textContent = `Score: ${score}`;

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'inline-block';
  nextBtn.textContent = current < TOTAL - 1 ? 'Next question →' : 'See results →';
}

document.getElementById('next-btn').addEventListener('click', () => {
  current++;
  if (current < TOTAL) {
    renderQuestion();
  } else {
    showResults();
  }
});

function showResults() {
  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';
  document.getElementById('progress-bar').style.width = '100%';

  const pct = Math.round((score / TOTAL) * 100);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / TOTAL) * circumference;

  document.getElementById('ring-arc').style.strokeDashoffset = offset;
  document.getElementById('final-score').textContent = score;
  document.getElementById('stat-correct').textContent = score;
  document.getElementById('stat-wrong').textContent = TOTAL - score;
  document.getElementById('stat-pct').textContent = pct + '%';

  let heading, sub;
  if (score === TOTAL) {
    heading = 'Perfect score!';
    sub = 'You nailed every question. A true celebrity expert!';
  } else if (score >= 7) {
    heading = 'Great job!';
    sub = 'You really know your celebrities.';
  } else if (score >= 5) {
    heading = 'Not bad!';
    sub = 'Solid effort — a few stumped you though.';
  } else if (score >= 3) {
    heading = 'Room to grow!';
    sub = 'Keep brushing up on your celebrity knowledge.';
  } else {
    heading = 'Better luck next time!';
    sub = 'The celebrity world is full of surprises.';
  }

  document.getElementById('result-heading').textContent = heading;
  document.getElementById('result-sub').textContent = sub;
}

document.getElementById('play-again').addEventListener('click', loadQuestions);

loadQuestions();
