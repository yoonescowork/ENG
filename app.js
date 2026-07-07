// ==========================================
// 1. DEFAULT DATA CONFIGURATION
// ==========================================

const DEFAULT_PDFS = [
  // LC Files
  { id: "lc-main", filename: "LC.pdf", title: "해커스 TOEIC LC 종합서", category: "lc", progress: 0, url: "" },
  { id: "lc-ans", filename: "LC 해설.pdf", title: "해커스 LC 종합서 해설집", category: "lc", progress: 0, url: "" },
  { id: "lc-p1", filename: "part 1.pdf", title: "LC Part 1 집중 트레이닝", category: "lc", progress: 0, url: "" },
  { id: "lc-p2", filename: "part 2.pdf", title: "LC Part 2 집중 트레이닝", category: "lc", progress: 0, url: "" },
  { id: "lc-p3", filename: "part 3.pdf", title: "LC Part 3 집중 트레이닝", category: "lc", progress: 0, url: "" },
  { id: "lc-p4", filename: "part 4.pdf", title: "LC Part 4 집중 트레이닝", category: "lc", progress: 0, url: "" },
  { id: "lc-diag", filename: "진단고사.pdf", title: "LC 수준 진단 모의고사", category: "lc", progress: 0, url: "" },
  { id: "lc-t1", filename: "test 1.pdf", title: "LC 실전 모의고사 Test 1", category: "lc", progress: 0, url: "" },
  { id: "lc-t2", filename: "test 2.pdf", title: "LC 실전 모의고사 Test 2", category: "lc", progress: 0, url: "" },
  
  // RC Grammar Files
  { id: "rc-g1", filename: "G1.pdf", title: "RC 문법 - 품사 (기초)", category: "rc", progress: 0, url: "" },
  { id: "rc-g2", filename: "G2.pdf", title: "RC 문법 - 동사의 시제", category: "rc", progress: 0, url: "" },
  { id: "rc-g3", filename: "G3.pdf", title: "RC 문법 - 주어-동사 수일치", category: "rc", progress: 0, url: "" },
  { id: "rc-g4", filename: "G4.pdf", title: "RC 문법 - 관계사/관계대명사", category: "rc", progress: 0, url: "" },
  { id: "rc-g5", filename: "G5.pdf", title: "RC 문법 - 분사 및 준동사", category: "rc", progress: 0, url: "" },
  { id: "rc-g6", filename: "G6.pdf", title: "RC 문법 - 전치사 vs 접속사", category: "rc", progress: 0, url: "" },
  
  // RC Vocabulary & Readings
  { id: "rc-v1", filename: "V1.pdf", title: "TOEIC 필수 단어장 Day 1~10", category: "rc", progress: 0, url: "" },
  { id: "rc-v5", filename: "V5.pdf", title: "TOEIC 필수 단어장 Day 11~20", category: "rc", progress: 0, url: "" },
  { id: "rc-r2-1", filename: "R2-1.pdf", title: "RC 독해 Part 7 유형 분석", category: "rc", progress: 0, url: "" },
  { id: "rc-r2-5", filename: "R2-5.pdf", title: "RC 독해 Part 7 시간 단축법", category: "rc", progress: 0, url: "" }
];

const INITIAL_STATE = {
  studyDays: 0,
  vocabCount: 0,
  mockExams: 0,
  shadowingHours: 0,
  
  scores: [650], // Initial score is 650
  
  weeklyCheck: {
    lc: false,
    rc: false,
    vocab: false,
    shadow: false,
    mock: false,
    note: false
  },
  
  roadmapCheck: {
    g1: false,
    g2: false,
    g3: false,
    g4: false,
    g5: false,
    g6: false
  },
  
  todayCheckedDate: "",
  todayCheck: {
    lc: false,
    rc: false,
    vocab: false
  },
  
  incorrectNotes: [],
  vocabList: [
    { id: "v-default-1", word: "implementation", meaning: "구현, 실행", status: "learning" },
    { id: "v-default-2", word: "delegate", meaning: "위임하다, 대표자", status: "learning" },
    { id: "v-default-3", word: "recipient", meaning: "수령인, 수신자", status: "memorized" },
    { id: "v-default-4", word: "precursor", meaning: "선구자, 선조, 전조", status: "learning" }
  ],
  pdfLibrary: [...DEFAULT_PDFS],
  
  practicalIntro: "",
  
  gistToken: "",
  gistId: "",
  lastSyncTimestamp: 0
};

// ==========================================
// 2. STATE MANAGEMENT & SYNCHRONIZATION
// ==========================================

let state = { ...INITIAL_STATE };

// 로컬 스토리지에서 상태 읽어오기
function loadState() {
  const localData = localStorage.getItem("toeic_planner_state");
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      
      // 혹시 새로 추가된 속성이 있으면 초기화 방지용 병합
      state = { ...INITIAL_STATE, ...parsed };
      
      // PDF 리스트가 이전 구조면 머지
      if (!state.pdfLibrary || state.pdfLibrary.length === 0) {
        state.pdfLibrary = [...DEFAULT_PDFS];
      } else {
        // 기존 진행률 보존하며 DEFAULT 목록에 추가된 것 있는지 확인
        const mergedPdfs = DEFAULT_PDFS.map(defPdf => {
          const userPdf = state.pdfLibrary.find(p => p.id === defPdf.id || p.filename === defPdf.filename);
          return userPdf ? { ...defPdf, ...userPdf } : defPdf;
        });
        state.pdfLibrary = mergedPdfs;
      }
    } catch (e) {
      console.error("데이터 로드 중 에러 발생, 초기값으로 실행합니다.", e);
      state = { ...INITIAL_STATE };
    }
  } else {
    state = { ...INITIAL_STATE };
  }
  
  // 오늘 날짜 체크 후 일일 학습 체크 초기화 검사
  checkDailyReset();
}

// 로컬 스토리지에 상태 저장 및 클라우드 업로드 트리거
function saveState(triggerSync = true) {
  state.lastSyncTimestamp = Date.now();
  localStorage.setItem("toeic_planner_state", JSON.stringify(state));
  
  // UI 요소 리렌더링
  renderAll();
  
  // Gist 자동 동기화
  if (triggerSync && state.gistToken && state.gistId) {
    syncWithGist(true); // 비동기 업로드 진행
  }
}

// 일일 날짜 확인 후 체크박스 리셋
function checkDailyReset() {
  const todayStr = new Date().toLocaleDateString();
  if (state.todayCheckedDate !== todayStr) {
    state.todayCheckedDate = todayStr;
    state.todayCheck = {
      lc: false,
      rc: false,
      vocab: false
    };
    // 바로 로컬 저장(Gist 업로드는 생략하여 잦은 통신 방지)
    localStorage.setItem("toeic_planner_state", JSON.stringify(state));
  }
}

// ==========================================
// 3. GITHUB GIST CLOUD SYNC API
// ==========================================

let isSyncing = false;

async function syncWithGist(forceUpload = false) {
  if (!state.gistToken || !state.gistId) {
    updateSyncBadge("disconnected", "동기화 미연동");
    return;
  }
  
  if (isSyncing) return;
  isSyncing = true;
  updateSyncBadge("syncing", "동기화 중...");

  const url = `https://api.github.com/gists/${state.gistId}`;
  const headers = {
    "Authorization": `token ${state.gistToken}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
  };

  try {
    // 1. 기스트 조회
    const getRes = await fetch(url, { headers });
    if (!getRes.ok) {
      throw new Error(`Gist를 찾을 수 없습니다. (상태코드: ${getRes.status})`);
    }
    
    const gistObj = await getRes.json();
    const fileName = "toeic_planner_data.json";
    
    // 기스트 내에 파일 존재 여부 확인
    if (gistObj.files && gistObj.files[fileName] && gistObj.files[fileName].content && !forceUpload) {
      // 기스트에 저장된 데이터 로드
      const cloudState = JSON.parse(gistObj.files[fileName].content);
      
      // 타임스탬프 비교하여 더 최신 데이터를 적용
      if (cloudState.lastSyncTimestamp > state.lastSyncTimestamp) {
        console.log("클라우드 데이터가 더 최신입니다. 로컬 데이터를 업데이트합니다.");
        state = { ...state, ...cloudState };
        localStorage.setItem("toeic_planner_state", JSON.stringify(state));
        renderAll();
        updateSyncBadge("connected", "동기화 완료 (클라우드 로드)");
        isSyncing = false;
        return;
      }
    }

    // 2. 로컬 데이터가 더 최신이거나 강제 업로드인 경우 기스트 업데이트
    const patchBody = {
      description: "TOEIC 850+ Study Tracker Data",
      files: {
        [fileName]: {
          content: JSON.stringify(state, null, 2)
        }
      }
    };

    const patchRes = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patchBody)
    });

    if (!patchRes.ok) {
      throw new Error(`Gist 업로드 실패. (상태코드: ${patchRes.status})`);
    }

    console.log("로컬 데이터를 클라우드 기스트에 성공적으로 동기화했습니다.");
    updateSyncBadge("connected", "동기화 완료 (백업 완료)");
  } catch (error) {
    console.error("동기화 중 오류 발생:", error);
    updateSyncBadge("error", "동기화 실패 (설정 확인)");
  } finally {
    isSyncing = false;
  }
}

function updateSyncBadge(status, text) {
  const badge = document.getElementById("sync-status-btn");
  const dot = badge.querySelector(".status-dot");
  const lbl = document.getElementById("sync-status-text");
  
  dot.className = "status-dot " + status;
  lbl.textContent = text;
}

// ==========================================
// 4. UI RENDER FUNCTIONS
// ==========================================

function renderAll() {
  renderKPIs();
  renderTodayStudy();
  renderWeeklyChecklist();
  renderRoadmapChecklist();
  renderIncorrectNotes();
  renderVocab();
  renderPDFLibrary();
  renderScoreChart();
  
  // 실무영어 자기소개 불러오기
  const introTextarea = document.getElementById("practical-intro-text");
  if (introTextarea && introTextarea.value !== state.practicalIntro) {
    introTextarea.value = state.practicalIntro || "";
  }
}

// KPI 진행바 및 텍스트 렌더링
function renderKPIs() {
  // 1. 공부 진행일 (180일 기준)
  updateKPICard("kpi-days", state.studyDays, 180);
  // 2. 단어 암기량 (5000개 기준)
  updateKPICard("kpi-vocab", state.vocabCount, 5000);
  // 3. 실전 모의고사 (30회 기준)
  updateKPICard("kpi-exams", state.mockExams, 30);
  // 4. LC 쉐도잉 시간 (120시간 기준)
  updateKPICard("kpi-shadowing", state.shadowingHours, 120);
}

function updateKPICard(cardId, current, total) {
  const card = document.getElementById(cardId);
  if (!card) return;
  
  const currentSpan = card.querySelector(".kpi-value .current");
  if (currentSpan) currentSpan.textContent = current;
  
  const progressPercent = Math.min((current / total) * 100, 100);
  const progressBar = card.querySelector(".kpi-bar");
  if (progressBar) progressBar.style.width = `${progressPercent}%`;
}

// 요일별 추천 학습 렌더링
const WEEKDAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const WEEKLY_CURRICULUM_DATA = {
  1: { // 월
    desc: "⭐ Part 2 집중 공략의 날! 스크립트 쉐도잉 훈련을 시작하세요.<br>📚 RC: 명사/형용사/부사 등 <strong>품사 문법</strong> 기본 이론을 학습하세요.",
    target: "700점 도약"
  },
  2: { // 화
    desc: "⭐ Part 3 지문 스키밍 연습을 진행하세요.<br>📚 RC: 과거/현재/미래 완료형을 포함한 <strong>시제 문법</strong>을 학습하세요.",
    target: "750점 도약"
  },
  3: { // 수
    desc: "⭐ Part 4 긴 지문 독해 듣기 날입니다. 귀를 열어두세요.<br>📚 RC: 주격/목적격/소유격 <strong>관계대명사 문법</strong>을 마스터하세요.",
    target: "800점 도약"
  },
  4: { // 목
    desc: "⭐ Part 2 복습 및 오답 문제를 다시 들으며 딕테이션하세요.<br>📚 RC: 현재분사와 과거분사를 구분하는 <strong>분사 문법</strong>을 마스터하세요.",
    target: "820점 보완"
  },
  5: { // 금
    desc: "⭐ Part 3 지문 스키밍 및 쉐도잉을 마저 진행하세요.<br>📚 RC: 혼동하기 쉬운 <strong>전치사/접속사 문법</strong>을 학습하세요.",
    target: "840점 완벽"
  },
  6: { // 토
    desc: "🔥 <strong>실전 모의고사 1회 풀이의 날!</strong> 실제 시험처럼 120분 타이머를 맞추고 집중해서 푸세요.<br>📝 채점 후 즉시 오답노트에 틀린 문제를 추가하세요.",
    target: "850+ 고득점"
  },
  0: { // 일
    desc: "📝 <strong>이번 주 총복습 및 취약 영역 보완의 날!</strong><br>오답노트에 작성된 미해결 문제를 다시 풀어보고, 단어장에 암기 중인 단어 카드를 복습하세요.",
    target: "850+ 최종 돌파"
  }
};

function renderTodayStudy() {
  const dayNum = new Date().getDay();
  const dayName = WEEKDAY_NAMES[dayNum];
  const curri = WEEKLY_CURRICULUM_DATA[dayNum];
  
  document.getElementById("today-day-name").textContent = dayName;
  document.getElementById("today-target-score").textContent = `목표: ${curri.target}`;
  document.getElementById("today-study-desc").innerHTML = curri.desc;
  
  // 체크박스 세팅
  const chkLc = document.getElementById("today-chk-lc");
  const chkRc = document.getElementById("today-chk-rc");
  const chkVocab = document.getElementById("today-chk-vocab");
  
  if (chkLc) chkLc.checked = state.todayCheck.lc;
  if (chkRc) chkRc.checked = state.todayCheck.rc;
  if (chkVocab) chkVocab.checked = state.todayCheck.vocab;
  
  // 달력 카드 하이라이트
  document.querySelectorAll(".weekly-day-card").forEach(card => {
    card.classList.remove("active-day-border");
    if (parseInt(card.dataset.day) === dayNum) {
      card.classList.add("active-day-border");
    }
  });
}

// 주간 체크리스트 렌더링
function renderWeeklyChecklist() {
  const checklist = state.weeklyCheck;
  const items = ["lc", "rc", "vocab", "shadow", "mock", "note"];
  
  let checkedCount = 0;
  items.forEach(item => {
    const chk = document.getElementById(`w-chk-${item}`);
    if (chk) {
      chk.checked = checklist[item] || false;
      if (checklist[item]) checkedCount++;
    }
  });
  
  const total = items.length;
  const percent = Math.round((checkedCount / total) * 100);
  
  document.getElementById("weekly-progress-percent").textContent = `${percent}%`;
  document.getElementById("weekly-progress-bar").style.width = `${percent}%`;
}

// 월간 로드맵 문법 정복 여부 렌더링
function renderRoadmapChecklist() {
  const roadmap = state.roadmapCheck;
  for (let key in roadmap) {
    const chk = document.getElementById(`rm-m1-${key}`);
    if (chk) {
      chk.checked = roadmap[key] || false;
    }
  }
}

// 오답노트 목록 렌더링
function renderIncorrectNotes() {
  const container = document.getElementById("incorrect-items-container");
  if (!container) return;
  
  // 필터값 획득
  const searchText = document.getElementById("filter-search").value.toLowerCase();
  const filterPart = document.getElementById("filter-part").value;
  const filterReason = document.getElementById("filter-reason").value;
  const filterSolved = document.getElementById("filter-solved").value;
  
  // 오답 목록 필터링
  const filtered = state.incorrectNotes.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchText) || 
                          (item.notes && item.notes.toLowerCase().includes(searchText)) ||
                          (item.vocab && item.vocab.toLowerCase().includes(searchText)) ||
                          (item.topic && item.topic.toLowerCase().includes(searchText));
    const matchesPart = filterPart ? item.part === filterPart : true;
    const matchesReason = filterReason ? item.reason === filterReason : true;
    const matchesSolved = filterSolved ? 
                          (filterSolved === "solved" ? item.solved : !item.solved) : true;
    return matchesSearch && matchesPart && matchesReason && matchesSolved;
  });
  
  // 통계 업데이트
  const totalCount = state.incorrectNotes.length;
  const unsolvedCount = state.incorrectNotes.filter(n => !n.solved).length;
  document.getElementById("stat-total-incorrect").textContent = totalCount;
  document.getElementById("stat-unsolved-incorrect").textContent = unsolvedCount;
  
  if (filtered.length === 0) {
    container.innerHTML = `<div class="card" style="text-align:center; padding:30px; color:var(--text-muted);">조건에 맞는 오답 기록이 없습니다.</div>`;
    return;
  }
  
  // 렌더링
  container.innerHTML = filtered.map(item => `
    <div class="incorrect-item-card ${item.solved ? 'solved' : ''}" data-id="${item.id}">
      <div class="incorrect-card-top">
        <div class="inc-date-part">
          <span class="inc-badge-part">${item.part}</span>
          <span class="inc-badge-reason">${item.reason}</span>
          <span style="font-size:11px; color:var(--text-muted);">${item.date}</span>
        </div>
        <div>
          <span class="inc-badge-resolved ${item.solved ? 'yes' : 'no'}" onclick="toggleResolveIncorrect('${item.id}')">
            ${item.solved ? '해결 완료 (O)' : '미해결 (X)'}
          </span>
        </div>
      </div>
      <h4 class="inc-title">${item.question}</h4>
      
      <div class="inc-meta-row">
        ${item.topic ? `<span>📌 문법: ${item.topic}</span>` : ''}
        ${item.vocab ? `<span>🔑 단어: ${item.vocab}</span>` : ''}
      </div>
      
      ${item.notes ? `<p class="inc-note-body">${item.notes}</p>` : ''}
      
      <div class="inc-actions">
        <button class="inc-act-btn delete" onclick="deleteIncorrect('${item.id}')">삭제</button>
      </div>
    </div>
  `).join("");
}

// 단어장 테이블 및 플래시카드 렌더링
let activeFlashIndex = 0;

function renderVocab() {
  const tableBody = document.getElementById("vocab-table-body");
  if (!tableBody) return;
  
  const searchText = document.getElementById("vocab-search").value.toLowerCase();
  
  // 검색 필터링
  const filtered = state.vocabList.filter(item => {
    return item.word.toLowerCase().includes(searchText) || 
           item.meaning.toLowerCase().includes(searchText);
  });
  
  // 통계 업데이트
  document.getElementById("vocab-total-count").textContent = state.vocabList.length;
  
  // 테이블 그리기
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">등록된 단어가 없습니다.</td></tr>`;
  } else {
    tableBody.innerHTML = filtered.map(item => `
      <tr>
        <td style="font-weight:700; color:var(--primary-color);">${item.word}</td>
        <td>${item.meaning}</td>
        <td>
          <span class="vocab-status-badge ${item.status}" onclick="toggleVocabStatus('${item.id}')">
            ${item.status === 'memorized' ? '완기' : '암기중'}
          </span>
        </td>
        <td>
          <button class="vocab-del-btn" onclick="deleteVocab('${item.id}')">✕</button>
        </td>
      </tr>
    `).join("");
  }
  
  // 플래시카드 업데이트
  const flashWord = document.getElementById("flash-word");
  const flashMeaning = document.getElementById("flash-meaning");
  const counterSpan = document.getElementById("flash-counter");
  const cardElement = document.getElementById("active-flashcard");
  
  if (cardElement) {
    // 혹시 모를 플립 리셋
    cardElement.classList.remove("flipped");
  }
  
  if (state.vocabList.length === 0) {
    flashWord.textContent = "단어를 추가해 주세요";
    flashMeaning.textContent = "뜻이 여기에 표시됩니다";
    counterSpan.textContent = "0 / 0";
  } else {
    if (activeFlashIndex >= state.vocabList.length) {
      activeFlashIndex = state.vocabList.length - 1;
    }
    if (activeFlashIndex < 0) {
      activeFlashIndex = 0;
    }
    
    const activeWord = state.vocabList[activeFlashIndex];
    flashWord.textContent = activeWord.word;
    flashMeaning.textContent = activeWord.meaning;
    counterSpan.textContent = `${activeFlashIndex + 1} / ${state.vocabList.length}`;
  }
}

// 교재 PDF 책장 렌더링
function renderPDFLibrary() {
  const container = document.getElementById("pdf-shelf-container");
  if (!container) return;
  
  container.innerHTML = state.pdfLibrary.map(pdf => `
    <div class="pdf-item-card" id="pdf-${pdf.id}">
      <div class="pdf-info-row">
        <div class="pdf-name-wrap">
          <span class="pdf-icon">📕</span>
          <div>
            <div class="pdf-title-text">${pdf.title}</div>
            <div style="font-size:10px; color:var(--text-muted);">${pdf.filename}</div>
          </div>
        </div>
        <span class="pdf-category-badge ${pdf.category}">${pdf.category.toUpperCase()}</span>
      </div>
      
      <div class="pdf-progress-row">
        <span>완독률</span>
        <div class="pdf-prog-bar-wrap">
          <div class="pdf-prog-bar" style="width: ${pdf.progress}%"></div>
        </div>
        <select class="pdf-prog-select" onchange="updatePDFProgress('${pdf.id}', this.value)">
          ${[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => `
            <option value="${val}" ${pdf.progress === val ? 'selected' : ''}>${val}%</option>
          `).join("")}
        </select>
      </div>

      <div class="pdf-link-editor">
        <input type="text" placeholder="구글드라이브/클라우드 링크 입력" value="${pdf.url || ''}" onchange="updatePDFUrl('${pdf.id}', this.value)">
        <button class="pdf-open-btn ${pdf.url ? '' : 'disabled'}" onclick="openPDFLink('${pdf.url}')">
          열기 ↗
        </button>
      </div>
    </div>
  `).join("");
}

function openPDFLink(url) {
  if (!url) {
    alert("구글 드라이브나 클라우드 교재 링크를 먼저 등록해주세요!");
    return;
  }
  window.open(url, "_blank");
}

function updatePDFUrl(id, value) {
  const pdf = state.pdfLibrary.find(p => p.id === id);
  if (pdf) {
    pdf.url = value.trim();
    saveState(true);
  }
}

function updatePDFProgress(id, value) {
  const pdf = state.pdfLibrary.find(p => p.id === id);
  if (pdf) {
    pdf.progress = parseInt(value);
    saveState(true);
  }
}

// 점수 곡선 차트 (SVG 차트) 렌더링
function renderScoreChart() {
  const svg = document.getElementById("score-chart");
  const dotsG = document.getElementById("chart-dots");
  const path = document.getElementById("actual-score-path");
  if (!svg || !dotsG || !path) return;
  
  dotsG.innerHTML = "";
  
  const scoreData = state.scores;
  if (!scoreData || scoreData.length === 0) {
    path.setAttribute("d", "");
    return;
  }
  
  // 7개의 점(현재, 1월, 2월, 3월, 4월, 5월, 6월)에 대응하는 x 좌표들
  const xCoords = [50, 120, 190, 260, 330, 400, 470];
  
  let pathD = "";
  
  scoreData.forEach((score, index) => {
    if (index >= xCoords.length) return;
    
    const x = xCoords[index];
    // 점수 650점(y=205) ~ 850점(y=30) 사이로 매핑
    const clampedScore = Math.max(650, Math.min(score, 850));
    const y = 205 - ((clampedScore - 650) / 200) * 175;
    
    // 점 그리기
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "5");
    circle.setAttribute("class", "chart-dot");
    
    // 호버 툴팁용 타이틀 추가
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${index === 0 ? '현재' : index + '월'}: ${score}점`;
    circle.appendChild(title);
    
    dotsG.appendChild(circle);
    
    // 라인 루트 생성
    if (index === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });
  
  path.setAttribute("d", pathD);
}

// ==========================================
// 5. INTERACTIVE EVENT HANDLERS
// ==========================================

// KPI 카운터 제어 함수
window.adjustKPI = function(kpiName, value) {
  if (kpiName === "studyDays") {
    state.studyDays = Math.max(0, state.studyDays + value);
  } else if (kpiName === "vocabCount") {
    state.vocabCount = Math.max(0, state.vocabCount + value);
  } else if (kpiName === "mockExams") {
    state.mockExams = Math.max(0, state.mockExams + value);
  } else if (kpiName === "shadowingHours") {
    state.shadowingHours = Math.max(0, state.shadowingHours + value);
  }
  saveState(true);
};

// 일일 학습 체크박스 처리
function setupDailyCheckEvents() {
  const chkLc = document.getElementById("today-chk-lc");
  const chkRc = document.getElementById("today-chk-rc");
  const chkVocab = document.getElementById("today-chk-vocab");
  
  const handleCheck = () => {
    state.todayCheck = {
      lc: chkLc ? chkLc.checked : false,
      rc: chkRc ? chkRc.checked : false,
      vocab: chkVocab ? chkVocab.checked : false
    };
    saveState(true);
  };
  
  if (chkLc) chkLc.addEventListener("change", handleCheck);
  if (chkRc) chkRc.addEventListener("change", handleCheck);
  if (chkVocab) chkVocab.addEventListener("change", handleCheck);
}

// 주간 체크박스 처리
function setupWeeklyCheckEvents() {
  const items = ["lc", "rc", "vocab", "shadow", "mock", "note"];
  items.forEach(item => {
    const chk = document.getElementById(`w-chk-${item}`);
    if (chk) {
      chk.addEventListener("change", () => {
        state.weeklyCheck[item] = chk.checked;
        saveState(true);
      });
    }
  });
  
  const resetBtn = document.getElementById("reset-weekly-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("주간 체크리스트를 초기화하고 새로운 주를 시작하시겠습니까?")) {
        state.weeklyCheck = {
          lc: false,
          rc: false,
          vocab: false,
          shadow: false,
          mock: false,
          note: false
        };
        saveState(true);
      }
    });
  }
}

// 6개월 로드맵 체크박스 처리
function setupRoadmapEvents() {
  const roadmapKeys = ["g1", "g2", "g3", "g4", "g5", "g6"];
  roadmapKeys.forEach(key => {
    const chk = document.getElementById(`rm-m1-${key}`);
    if (chk) {
      chk.addEventListener("change", () => {
        state.roadmapCheck[key] = chk.checked;
        saveState(true);
      });
    }
  });
}

// 모의고사 점수 추가
function setupScoreChartEvents() {
  const btn = document.getElementById("add-score-btn");
  const input = document.getElementById("new-score-val");
  
  if (btn && input) {
    btn.addEventListener("click", () => {
      const val = parseInt(input.value);
      if (isNaN(val) || val < 0 || val > 990) {
        alert("0점부터 990점 사이의 올바른 점수를 입력해주세요.");
        return;
      }
      
      if (state.scores.length >= 7) {
        if (confirm("점수 기록이 꽉 찼습니다(최대 7개). 기존 기록을 밀고 추가할까요?")) {
          state.scores.shift(); // 첫 점수 삭제
          state.scores.push(val);
        }
      } else {
        state.scores.push(val);
      }
      
      input.value = "";
      saveState(true);
    });
  }
}

// 오답노트 이벤트 설정
function setupIncorrectEvents() {
  const toggleHeader = document.getElementById("toggle-add-incorrect-header");
  const formWrapper = document.getElementById("add-incorrect-form-wrapper");
  const toggleIcon = toggleHeader ? toggleHeader.querySelector(".toggle-icon") : null;
  
  // 폼 열고 닫기
  if (toggleHeader && formWrapper) {
    toggleHeader.addEventListener("click", () => {
      const isHidden = formWrapper.style.display === "none";
      formWrapper.style.display = isHidden ? "block" : "none";
      if (toggleIcon) {
        toggleIcon.classList.toggle("rotated", isHidden);
      }
    });
  }
  
  // 오답 저장
  const form = document.getElementById("incorrect-form");
  if (form) {
    // 기본 날짜 설정
    const dateInput = document.getElementById("inc-date");
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }
    
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const newNote = {
        id: "inc-" + Date.now(),
        date: document.getElementById("inc-date").value,
        part: document.getElementById("inc-part").value,
        question: document.getElementById("inc-question").value.trim(),
        reason: document.getElementById("inc-reason").value,
        topic: document.getElementById("inc-topic").value.trim(),
        vocab: document.getElementById("inc-vocab").value.trim(),
        notes: document.getElementById("inc-notes").value.trim(),
        solved: false
      };
      
      state.incorrectNotes.unshift(newNote); // 리스트 맨 앞에 추가
      
      // 입력값 초기화
      document.getElementById("inc-question").value = "";
      document.getElementById("inc-topic").value = "";
      document.getElementById("inc-vocab").value = "";
      document.getElementById("inc-notes").value = "";
      if (dateInput) dateInput.valueAsDate = new Date();
      
      // 폼 닫기
      formWrapper.style.display = "none";
      if (toggleIcon) toggleIcon.classList.remove("rotated");
      
      saveState(true);
    });
    
    const cancelBtn = document.getElementById("cancel-incorrect-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        formWrapper.style.display = "none";
        if (toggleIcon) toggleIcon.classList.remove("rotated");
      });
    }
  }
  
  // 검색 및 필터 이벤트
  ["filter-search", "filter-part", "filter-reason", "filter-solved"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", renderIncorrectNotes);
      el.addEventListener("change", renderIncorrectNotes);
    }
  });
}

// 오답 해결 상태 토글
window.toggleResolveIncorrect = function(id) {
  const item = state.incorrectNotes.find(n => n.id === id);
  if (item) {
    item.solved = !item.solved;
    saveState(true);
  }
};

// 오답 삭제
window.deleteIncorrect = function(id) {
  if (confirm("정말 이 오답 기록을 삭제하시겠습니까?")) {
    state.incorrectNotes = state.incorrectNotes.filter(n => n.id !== id);
    saveState(true);
  }
};

// 단어장 이벤트 설정
function setupVocabEvents() {
  const form = document.getElementById("vocab-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const wordInput = document.getElementById("vocab-word");
      const meaningInput = document.getElementById("vocab-meaning");
      
      const word = wordInput.value.trim();
      const meaning = meaningInput.value.trim();
      
      if (!word || !meaning) return;
      
      const newVocab = {
        id: "vocab-" + Date.now(),
        word,
        meaning,
        status: "learning"
      };
      
      state.vocabList.unshift(newVocab);
      
      wordInput.value = "";
      meaningInput.value = "";
      
      // 단어 수 증가
      state.vocabCount += 1;
      
      saveState(true);
    });
  }
  
  // 단어 검색
  const searchInput = document.getElementById("vocab-search");
  if (searchInput) {
    searchInput.addEventListener("input", renderVocab);
  }
  
  // 플래시카드 플립
  const cardElement = document.getElementById("active-flashcard");
  if (cardElement) {
    cardElement.addEventListener("click", () => {
      cardElement.classList.toggle("flipped");
    });
  }
  
  // 플래시카드 슬라이더
  const prevBtn = document.getElementById("flash-prev-btn");
  const nextBtn = document.getElementById("flash-next-btn");
  
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // 카드 뒤집히는 것 방지
      if (state.vocabList.length > 0) {
        activeFlashIndex = (activeFlashIndex - 1 + state.vocabList.length) % state.vocabList.length;
        renderVocab();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.vocabList.length > 0) {
        activeFlashIndex = (activeFlashIndex + 1) % state.vocabList.length;
        renderVocab();
      }
    });
  }
}

// 단어 외움 상태 변경
window.toggleVocabStatus = function(id) {
  const item = state.vocabList.find(v => v.id === id);
  if (item) {
    item.status = item.status === "memorized" ? "learning" : "memorized";
    saveState(true);
  }
};

// 단어 삭제
window.deleteVocab = function(id) {
  if (confirm("이 단어를 단어장에서 지우시겠습니까?")) {
    state.vocabList = state.vocabList.filter(v => v.id !== id);
    saveState(true);
  }
};

// LC 7단계 쉐도잉 가이드 & 타이머
let shadowingTimerInterval = null;
let shadowingSeconds = 0;

function setupLCPressEvents() {
  const steps = document.querySelectorAll("#lc-steps-container .step-guide");
  const prevBtn = document.getElementById("lc-step-prev");
  const nextBtn = document.getElementById("lc-step-next");
  
  let currentStepIdx = 0; // 0-based
  
  function updateStepsUI() {
    steps.forEach((step, idx) => {
      step.classList.remove("active");
      if (idx === currentStepIdx) {
        step.classList.add("active");
        
        // 해당 단계로 스크롤 이동
        step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentStepIdx > 0) {
        currentStepIdx--;
        updateStepsUI();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        updateStepsUI();
      }
    });
  }
  
  // 쉐도잉 타이머 위젯
  const timerVal = document.getElementById("shadow-timer-val");
  const startBtn = document.getElementById("shadow-timer-start-btn");
  const resetBtn = document.getElementById("shadow-timer-reset-btn");
  
  if (startBtn && resetBtn && timerVal) {
    startBtn.addEventListener("click", () => {
      if (shadowingTimerInterval) {
        // 일시정지
        clearInterval(shadowingTimerInterval);
        shadowingTimerInterval = null;
        startBtn.textContent = "시작";
        
        // 쉐도잉 시간 누적 (초 단위 -> 시간 단위 환산 저장)
        const hrsDiff = parseFloat((shadowingSeconds / 3600).toFixed(2));
        if (hrsDiff > 0) {
          state.shadowingHours = parseFloat((state.shadowingHours + hrsDiff).toFixed(2));
          saveState(true);
        }
      } else {
        // 시작
        startBtn.textContent = "정지";
        shadowingTimerInterval = setInterval(() => {
          shadowingSeconds++;
          const mins = String(Math.floor(shadowingSeconds / 60)).padStart(2, "0");
          const secs = String(shadowingSeconds % 60).padStart(2, "0");
          timerVal.textContent = `${mins}:${secs}`;
        }, 1000);
      }
    });
    
    resetBtn.addEventListener("click", () => {
      clearInterval(shadowingTimerInterval);
      shadowingTimerInterval = null;
      shadowingSeconds = 0;
      timerVal.textContent = "00:00";
      startBtn.textContent = "시작";
    });
  }
}

// 실무 영어 이메일 템플릿 뷰어
const EMAIL_TEMPLATES = {
  asking: `Subject: Request for Information: [Product/Service Name]

Dear [Recipient Name],

I hope this email finds you well.
My name is [Your Name], and I am writing to request additional details regarding [Product/Service Name] mentioned in your recent announcements.

Specifically, I would appreciate it if you could provide:
1. Pricing structures and available packages.
2. A brief overview of the implementation timeline.

Thank you for your time and assistance. I look forward to hearing from you.

Best regards,
[Your Name]`,
  followup: `Subject: Follow-up regarding [Topic/Project Name]

Dear [Recipient Name],

I am writing to follow up on our previous conversation regarding [Topic/Project Name] on [Date].

I wanted to check if there are any updates on [specific question or next step]. If you need any further details or documents from my side, please let me know.

Thank you, and I look forward to your response.

Sincerely,
[Your Name]`,
  schedule: `Subject: Request to Schedule a Meeting: [Topic]

Dear [Recipient Name],

I would like to suggest scheduling a brief meeting to discuss [Topic].

Would you be available for a 30-minute call next week? I am open during the following time slots:
- [Option 1: e.g., Tuesday, July 14, at 10:00 AM KST]
- [Option 2: e.g., Thursday, July 16, at 2:00 PM KST]

Please let me know if either of these options works for you, or feel free to suggest an alternative time.

Best regards,
[Your Name]`
};

function setupPracticalEvents() {
  const select = document.getElementById("email-tpl-select");
  const viewer = document.getElementById("email-tpl-content");
  
  if (select && viewer) {
    const updateTpl = () => {
      const key = select.value;
      viewer.textContent = EMAIL_TEMPLATES[key] || "템플릿을 선택하세요.";
    };
    
    select.addEventListener("change", updateTpl);
    updateTpl(); // 초기화
  }
  
  // 1분 자기소개 저장
  const saveBtn = document.getElementById("save-intro-btn");
  const textarea = document.getElementById("practical-intro-text");
  if (saveBtn && textarea) {
    saveBtn.addEventListener("click", () => {
      state.practicalIntro = textarea.value.trim();
      saveState(true);
      alert("자기소개 템플릿이 저장되었습니다!");
    });
  }
}

// ==========================================
// 6. TABS NAVIGATION & MODAL CONTROLS
// ==========================================

function setupNavigation() {
  const tabButtons = document.querySelectorAll(".sidebar-menu .nav-item, .bottom-nav .nav-item");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      
      // 활성화 버튼 클래스 전환
      tabButtons.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(b => b.classList.add("active"));
      
      // 탭 콘텐츠 보이기
      tabContents.forEach(content => {
        content.classList.remove("active");
        if (content.id === tabId) {
          content.classList.add("active");
        }
      });
      
      // 상단 바 타이틀 변경
      let title = "대시보드";
      if (tabId === "tab-plan") title = "학습 계획";
      else if (tabId === "tab-incorrect") title = "오답노트";
      else if (tabId === "tab-vocab") title = "단어장";
      else if (tabId === "tab-study") title = "학습 자료실";
      
      document.getElementById("current-tab-title").textContent = title;
      
      // 모바일 스크롤 리셋
      const viewport = document.querySelector(".tab-viewport");
      if (viewport) viewport.scrollTop = 0;
    });
  });
  
  // 서브탭 관리 (학습계획 및 자료실)
  document.querySelectorAll(".sub-tab-bar").forEach(bar => {
    const subButtons = bar.querySelectorAll(".sub-tab");
    const parentSection = bar.closest(".tab-content");
    
    subButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const subId = btn.dataset.sub;
        
        subButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        parentSection.querySelectorAll(".sub-tab-content").forEach(content => {
          content.classList.remove("active");
          if (content.id === subId) {
            content.classList.add("active");
          }
        });
      });
    });
  });
}

// 모달 설정 제어
function setupModal() {
  const modal = document.getElementById("settings-modal");
  const openDesktop = document.getElementById("open-settings-desktop");
  const openMobile = document.getElementById("open-settings-mobile");
  const closeBtn = document.getElementById("close-settings");
  
  const showModal = () => {
    // 현재 기스트 토큰 정보 입력창에 세팅
    document.getElementById("gist-token").value = state.gistToken || "";
    document.getElementById("gist-id").value = state.gistId || "";
    document.getElementById("theme-select").value = document.body.getAttribute("data-theme") || "violet-dark";
    
    modal.classList.add("active");
  };
  
  const hideModal = () => {
    modal.classList.remove("active");
  };
  
  if (openDesktop) openDesktop.addEventListener("click", showModal);
  if (openMobile) openMobile.addEventListener("click", showModal);
  if (closeBtn) closeBtn.addEventListener("click", hideModal);
  
  // 모달 영역 외 클릭 시 닫기
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideModal();
    });
  }
  
  // 기스트 정보 저장
  const saveGistBtn = document.getElementById("save-gist-btn");
  if (saveGistBtn) {
    saveGistBtn.addEventListener("click", async () => {
      const token = document.getElementById("gist-token").value.trim();
      const gid = document.getElementById("gist-id").value.trim();
      
      if (!token || !gid) {
        alert("GitHub 토큰과 Gist ID를 모두 입력해주세요.");
        return;
      }
      
      state.gistToken = token;
      state.gistId = gid;
      
      saveState(false); // 로컬 저장
      alert("설정이 임시 저장되었습니다. 연결 테스트 및 동기화를 시작합니다.");
      await syncWithGist(true); // 강제 업로드하여 기스트 생성/연동 테스트
      hideModal();
    });
  }
  
  // 기스트로부터 데이터 당겨오기
  const loadGistBtn = document.getElementById("load-gist-btn");
  if (loadGistBtn) {
    loadGistBtn.addEventListener("click", async () => {
      const token = document.getElementById("gist-token").value.trim();
      const gid = document.getElementById("gist-id").value.trim();
      
      if (!token || !gid) {
        alert("GitHub 토큰과 Gist ID를 먼저 입력해야 불러올 수 있습니다.");
        return;
      }
      
      state.gistToken = token;
      state.gistId = gid;
      
      if (confirm("클라우드 Gist 데이터로 로컬 데이터를 덮어쓰시겠습니까? 최근 로컬 수정사항은 사라집니다.")) {
        // 타임스탬프를 0으로 강제 초기화하여 불러오는 데이터가 무조건 로컬 데이터보다 더 최신으로 취급되도록 함
        state.lastSyncTimestamp = 0;
        await syncWithGist(false);
        hideModal();
      }
    });
  }
  
  // 테마 전환
  const themeSelect = document.getElementById("theme-select");
  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      const selectedTheme = themeSelect.value;
      document.body.setAttribute("data-theme", selectedTheme);
      // 로컬 스토리지에 테마 유지
      localStorage.setItem("toeic_theme", selectedTheme);
    });
  }
  
  // 데이터 수동 백업 (JSON 파일 내보내기)
  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `toeic_planner_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }
  
  // 데이터 수동 복구 (JSON 파일 가져오기)
  const importFile = document.getElementById("import-file");
  if (importFile) {
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm("정말로 가져온 백업 파일로 기존 데이터를 교체하시겠습니까?")) {
            state = { ...INITIAL_STATE, ...parsed };
            saveState(true);
            alert("성공적으로 복원되었습니다!");
            hideModal();
          }
        } catch (error) {
          alert("올바른 JSON 백업 파일이 아닙니다.");
        }
      };
      reader.readAsText(file);
    });
  }
  
  // 모든 데이터 초기화
  const resetBtn = document.getElementById("reset-all-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("🚨 경고: 이 작업은 영구적입니다. 모든 오답노트, 단어장, 학습기록을 초기화하고 처음부터 시작하시겠습니까?")) {
        localStorage.removeItem("toeic_planner_state");
        state = { ...INITIAL_STATE };
        saveState(false);
        alert("모든 데이터가 초기화되었습니다.");
        location.reload();
      }
    });
  }
}

// 기스트 배지 버튼 클릭 시 모달 열기
function setupSyncBadgeClick() {
  const btn = document.getElementById("sync-status-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const openBtn = document.getElementById("open-settings-mobile");
      if (openBtn) openBtn.click();
    });
  }
}

// ==========================================
// 7. PWA SERVICE WORKER REGISTER
// ==========================================

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then((reg) => console.log("서비스 워커 등록 완료:", reg.scope))
        .catch((err) => console.error("서비스 워커 등록 실패:", err));
    });
  }
}

// ==========================================
// 8. APP INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // 테마 초기 로드
  const savedTheme = localStorage.getItem("toeic_theme") || "violet-dark";
  document.body.setAttribute("data-theme", savedTheme);
  
  // 데이터 불러오기
  loadState();
  
  // UI 요소 구성
  renderAll();
  
  // 이벤트 등록
  setupNavigation();
  setupModal();
  setupDailyCheckEvents();
  setupWeeklyCheckEvents();
  setupRoadmapEvents();
  setupScoreChartEvents();
  setupIncorrectEvents();
  setupVocabEvents();
  setupLCPressEvents();
  setupPracticalEvents();
  setupSyncBadgeClick();
  
  // 기스트 클라우드 자동 동기화 시도
  syncWithGist(false);
  
  // PWA 적용
  registerServiceWorker();
});
