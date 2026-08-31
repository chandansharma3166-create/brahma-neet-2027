import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertCircle, RotateCcw, Play, Pause, 
  BarChart2, PlusCircle, RefreshCw, X, Trash2, Check,
  BrainCircuit, Calendar, TrendingUp, BookOpen, ExternalLink,
  Home, CheckSquare, Edit3, Award, Flame, Bell, Filter, Timer, 
  BellRing, ChevronRight, ChevronDown, History, Zap, Image, Eye,
  Activity, CheckCircle2, CalendarDays
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area 
} from 'recharts';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyRjm0L9b_-804uxLitV3kCw3aBeSuqqFhzm8xgPpqd81yiDs75CejBs1OTI1NCcE2F/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const todayDateStr = new Date().toISOString().split('T')[0];

  // 1. Google Sheets Live Schedule
  const [sheetSchedule, setSheetSchedule] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. Daily Tasks & Date Filtering
  const [selectedTaskDate, setSelectedTaskDate] = useState(todayDateStr);
  const [dailyTasks, setDailyTasks] = useState(() => {
    const saved = localStorage.getItem('brahma_daily_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: todayDateStr, text: 'Solve 45 Physics Numericals (Kinematics)', completed: true, timeSlot: '09:00 - 11:30' },
      { id: 2, date: todayDateStr, text: 'NCERT Organic Chemistry Line-by-Line Reading', completed: true, timeSlot: '12:00 - 14:00' },
      { id: 3, date: todayDateStr, text: 'Cell Biology Diagram Practice & Flashcards', completed: false, timeSlot: '15:00 - 16:30' }
    ];
  });
  const [newTaskInput, setNewTaskInput] = useState({ text: '', timeSlot: '' });

  // Execution Analytics Filter Scope
  const [analyticsScope, setAnalyticsScope] = useState('7'); // '7', '30', 'all'

  // 3. 50/10 Pomodoro + Standard Block Timers
  const [timerMode, setTimerMode] = useState('blocks');
  const [pomoState, setPomoState] = useState({
    mode: 'work',
    timeLeft: 50 * 60,
    isRunning: false,
    workDuration: 50,
    breakDuration: 10,
    completedSessions: 0
  });

  const [slots, setSlots] = useState([
    { id: 'phy', name: 'Physics Block', durationMinutes: 150, timeLeft: 150 * 60, isRunning: false, subject: 'Physics' },
    { id: 'chem', name: 'Chemistry Block', durationMinutes: 120, timeLeft: 120 * 60, isRunning: false, subject: 'Chemistry' },
    { id: 'bio', name: 'Biology Block', durationMinutes: 90, timeLeft: 90 * 60, isRunning: false, subject: 'Biology' },
    { id: 'rev', name: 'Targeted Revision', durationMinutes: 120, timeLeft: 120 * 60, isRunning: false, subject: 'Revision' }
  ]);

  // 4. Adaptive Spaced Repetition (SM-2) Deck
  const [revisionDeck, setRevisionDeck] = useState(() => {
    const saved = localStorage.getItem('brahma_sm2_deck');
    return saved ? JSON.parse(saved) : [
      { id: 1, subject: 'Physics', topic: 'Ray Optics: Lens Maker Formula', repetition: 2, interval: 6, easeFactor: 2.5, lastReviewed: '2026-08-25', nextDue: todayDateStr, retentionScore: 85 },
      { id: 2, subject: 'Chemistry', topic: 'Aldehydes: Nucleophilic Addition', repetition: 1, interval: 1, easeFactor: 2.36, lastReviewed: '2026-08-30', nextDue: todayDateStr, retentionScore: 70 },
      { id: 3, subject: 'Biology', topic: 'Plant Kingdom: Life Cycles', repetition: 3, interval: 14, easeFactor: 2.6, lastReviewed: '2026-08-17', nextDue: '2026-09-05', retentionScore: 95 }
    ];
  });

  // 5. Hierarchical Question Bank with Image & Attempts
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('brahma_questions_v3');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        subject: 'Physics', 
        chapter: 'Rotational Motion', 
        topic: 'Moment of Inertia', 
        questionText: 'Hollow cylinder vs Solid cylinder rolling acceleration ratio down an incline.',
        image: null,
        errorType: 'Calculation Error',
        difficulty: 'Hard',
        attempts: [110, 65, 30]
      },
      { 
        id: 2, 
        subject: 'Chemistry', 
        chapter: 'Thermodynamics', 
        topic: 'Entropy & Gibbs Energy', 
        questionText: 'Spontaneity criteria when delta H is positive and delta S is positive.',
        image: null,
        errorType: 'Conceptual Error',
        difficulty: 'Moderate',
        attempts: [85, 40]
      },
      { 
        id: 3, 
        subject: 'Biology', 
        chapter: 'Molecular Basis of Inheritance', 
        topic: 'Lac Operon', 
        questionText: 'Identify labels A, B, C from the NCERT Lac Operon transcription diagram.',
        image: null,
        errorType: 'Misread Question',
        difficulty: 'Easy',
        attempts: [45, 18, 12]
      }
    ];
  });

  // Filters
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterChapter, setFilterChapter] = useState('All');
  const [filterTopic, setFilterTopic] = useState('All');

  // Modals & Image Viewer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [selectedTopicForReview, setSelectedTopicForReview] = useState(null);
  const [attemptModalData, setAttemptModalData] = useState(null);
  const [newAttemptSeconds, setNewAttemptSeconds] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Forms
  const [newTopic, setNewTopic] = useState({ subject: 'Physics', topic: '', nextDue: todayDateStr });
  const [newQ, setNewQ] = useState({ 
    subject: 'Physics', 
    chapter: '', 
    topic: '', 
    questionText: '', 
    image: null,
    errorType: 'Conceptual Error', 
    difficulty: 'Moderate',
    initialTime: 60 
  });

  // Mock Tests
  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('brahma_mock_telemetry');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Major Test 1', date: '2026-08-05', timeframe: 'Monthly', physics: 125, chemistry: 140, biology: 310, total: 575, negativeMarks: 24, rank: 420 },
      { id: 2, name: 'Major Test 2', date: '2026-08-12', timeframe: 'Weekly', physics: 135, chemistry: 145, biology: 325, total: 605, negativeMarks: 16, rank: 280 },
      { id: 3, name: 'Major Test 3', date: '2026-08-19', timeframe: 'Weekly', physics: 140, chemistry: 152, biology: 335, total: 627, negativeMarks: 12, rank: 195 },
      { id: 4, name: 'Major Test 4', date: '2026-08-26', timeframe: 'Monthly', physics: 155, chemistry: 160, biology: 345, total: 660, negativeMarks: 8, rank: 85 }
    ];
  });
  const [mockFilter, setMockFilter] = useState('All');
  const [newMock, setNewMock] = useState({ name: '', date: todayDateStr, timeframe: 'Weekly', physics: 0, chemistry: 0, biology: 0, negativeMarks: 0, rank: 0 });

  // Web Audio Synth Notification
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const triggerDeviceAlert = (title, message) => {
    playAlertSound();
    if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 500]);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') triggerDeviceAlert("🔔 Alerts Enabled", "Brahma NEET notification engine is active.");
      });
    }
  };

  // LocalStorage Sync
  useEffect(() => { localStorage.setItem('brahma_daily_tasks', JSON.stringify(dailyTasks)); }, [dailyTasks]);
  useEffect(() => { localStorage.setItem('brahma_sm2_deck', JSON.stringify(revisionDeck)); }, [revisionDeck]);
  useEffect(() => { localStorage.setItem('brahma_questions_v3', JSON.stringify(questions)); }, [questions]);
  useEffect(() => { localStorage.setItem('brahma_mock_telemetry', JSON.stringify(mockTests)); }, [mockTests]);

  // Google Sheets Fetch
  const fetchGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: 'GET', redirect: 'follow' });
      const json = await res.json();
      if (json && json.status === 'success' && Array.isArray(json.data)) {
        setSheetSchedule(json.data);
      }
    } catch (err) {
      console.error("Fetch Sheet error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchGoogleSheet();
  }, []);

  const updateSheetItem = async (rowIndex, status, strength, scheduledDate) => {
    setSheetSchedule(prev => prev.map(item => item.rowIndex === rowIndex ? {
      ...item,
      Status: status !== undefined ? status : item.Status,
      Strength: strength !== undefined ? strength : item.Strength,
      ScheduledDate: scheduledDate !== undefined ? scheduledDate : item.ScheduledDate
    } : item));

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update', rowIndex, status, strength, scheduledDate })
      });
    } catch (err) {
      console.error("Sheet update sync failed:", err);
    }
  };

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSlots(prevSlots =>
        prevSlots.map(slot => {
          if (slot.isRunning && slot.timeLeft > 0) {
            if (slot.timeLeft === 1) triggerDeviceAlert(`⏰ ${slot.subject} Complete!`, "Session completed! Record errors in question bank.");
            return { ...slot, timeLeft: slot.timeLeft - 1 };
          }
          return slot;
        })
      );

      setPomoState(prev => {
        if (!prev.isRunning || prev.timeLeft <= 0) return prev;
        if (prev.timeLeft === 1) {
          if (prev.mode === 'work') {
            triggerDeviceAlert("🔥 50-Min Session Complete!", "Great focus! Take a 10-minute break.");
            return { ...prev, mode: 'break', timeLeft: prev.breakDuration * 60, completedSessions: prev.completedSessions + 1 };
          } else {
            triggerDeviceAlert("☕ 10-Min Break Over!", "Ready to start your next 50-minute study block?");
            return { ...prev, mode: 'work', timeLeft: prev.workDuration * 60 };
          }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Task Handlers
  const displayedTasks = dailyTasks.filter(t => t.date === selectedTaskDate);
  const completedTodayCount = displayedTasks.filter(t => t.completed).length;
  const progressPercent = displayedTasks.length > 0 ? Math.round((completedTodayCount / displayedTasks.length) * 100) : 0;

  const toggleTask = (id) => {
    setDailyTasks(dailyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.text.trim()) return;
    setDailyTasks([...dailyTasks, {
      id: Date.now(),
      date: selectedTaskDate,
      text: newTaskInput.text,
      timeSlot: newTaskInput.timeSlot || 'Flexible',
      completed: false
    }]);
    setNewTaskInput({ text: '', timeSlot: '' });
  };

  const deleteTask = (id) => {
    setDailyTasks(dailyTasks.filter(t => t.id !== id));
  };

  // === DEDICATED EXECUTION ANALYTICS ENGINE ===
  const generateExecutionAnalytics = () => {
    // Group all tasks by date
    const dateMap = {};
    dailyTasks.forEach(task => {
      const d = task.date || todayDateStr;
      if (!dateMap[d]) {
        dateMap[d] = { date: d, total: 0, completed: 0, tasks: [] };
      }
      dateMap[d].total += 1;
      if (task.completed) dateMap[d].completed += 1;
      dateMap[d].tasks.push(task);
    });

    let datesArray = Object.values(dateMap).map(item => ({
      ...item,
      rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter by Scope
    if (analyticsScope === '7') {
      datesArray = datesArray.slice(-7);
    } else if (analyticsScope === '30') {
      datesArray = datesArray.slice(-30);
    }

    const totalTasksInRange = datesArray.reduce((acc, curr) => acc + curr.total, 0);
    const completedTasksInRange = datesArray.reduce((acc, curr) => acc + curr.completed, 0);
    const avgCompletionRate = totalTasksInRange > 0 ? Math.round((completedTasksInRange / totalTasksInRange) * 100) : 0;

    return { datesArray, totalTasksInRange, completedTasksInRange, avgCompletionRate };
  };

  const executionAnalytics = generateExecutionAnalytics();

  // SM-2 Helpers
  const dueRevisionsToday = revisionDeck.filter(item => item.nextDue <= todayDateStr);

  const deleteRevisionTopic = (id) => {
    setRevisionDeck(revisionDeck.filter(item => item.id !== id));
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopic.topic.trim()) return;
    setRevisionDeck([{
      id: Date.now(),
      subject: newTopic.subject,
      topic: newTopic.topic,
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      lastReviewed: todayDateStr,
      nextDue: newTopic.nextDue || todayDateStr,
      retentionScore: 100
    }, ...revisionDeck]);
    setNewTopic({ subject: 'Physics', topic: '', nextDue: todayDateStr });
    setIsTopicModalOpen(false);
  };

  const submitSM2Review = (rating) => {
    if (!selectedTopicForReview) return;
    const item = selectedTopicForReview;
    let { repetition, interval, easeFactor } = item;
    const q = rating;

    let newEF = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEF < 1.3) newEF = 1.3;

    let newRepetition = repetition;
    let newInterval = interval;

    if (q < 3) {
      newRepetition = 0;
      newInterval = 1;
    } else {
      if (repetition === 0) newInterval = 1;
      else if (repetition === 1) newInterval = 6;
      else newInterval = Math.round(interval * newEF);
      newRepetition += 1;
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + newInterval);

    setRevisionDeck(revisionDeck.map(t => t.id === item.id ? {
      ...t,
      repetition: newRepetition,
      interval: newInterval,
      easeFactor: Number(newEF.toFixed(2)),
      lastReviewed: todayDateStr,
      nextDue: nextDueDate.toISOString().split('T')[0],
      retentionScore: q * 20
    } : t));
    setSelectedTopicForReview(null);
  };

  // Question Filters
  const subjectsList = ['All', ...new Set(questions.map(q => q.subject))];
  const chaptersList = ['All', ...new Set(questions.filter(q => filterSubject === 'All' || q.subject === filterSubject).map(q => q.chapter))];
  const topicsList = ['All', ...new Set(questions.filter(q => 
    (filterSubject === 'All' || q.subject === filterSubject) &&
    (filterChapter === 'All' || q.chapter === filterChapter)
  ).map(q => q.topic))];

  const filteredQuestions = questions.filter(q => {
    if (filterSubject !== 'All' && q.subject !== filterSubject) return false;
    if (filterChapter !== 'All' && q.chapter !== filterChapter) return false;
    if (filterTopic !== 'All' && q.topic !== filterTopic) return false;
    return true;
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewQ(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQ.chapter.trim()) return;
    setQuestions([{
      id: Date.now(),
      subject: newQ.subject,
      chapter: newQ.chapter,
      topic: newQ.topic || 'General Problem',
      questionText: newQ.questionText,
      image: newQ.image,
      errorType: newQ.errorType,
      difficulty: newQ.difficulty,
      attempts: [Number(newQ.initialTime) || 60]
    }, ...questions]);
    setNewQ({ subject: 'Physics', chapter: '', topic: '', questionText: '', image: null, errorType: 'Conceptual Error', difficulty: 'Moderate', initialTime: 60 });
    setIsModalOpen(false);
  };

  const updateQuestionMastery = (id, newDifficulty) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, difficulty: newDifficulty } : q));
  };

  const updateQuestionErrorType = (id, newErrorType) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, errorType: newErrorType } : q));
  };

  const logNewAttempt = (e) => {
    e.preventDefault();
    if (!attemptModalData || !newAttemptSeconds) return;
    setQuestions(questions.map(q => q.id === attemptModalData.id ? {
      ...q,
      attempts: [...q.attempts, Number(newAttemptSeconds)]
    } : q));
    setNewAttemptSeconds('');
    setAttemptModalData(null);
  };

  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Mock Helpers
  const handleAddMock = (e) => {
    e.preventDefault();
    if (!newMock.name.trim()) return;
    const totalScore = Number(newMock.physics) + Number(newMock.chemistry) + Number(newMock.biology);
    setMockTests([...mockTests, {
      id: Date.now(),
      name: newMock.name,
      date: newMock.date || todayDateStr,
      timeframe: newMock.timeframe || 'Weekly',
      physics: Number(newMock.physics),
      chemistry: Number(newMock.chemistry),
      biology: Number(newMock.biology),
      total: totalScore,
      negativeMarks: Number(newMock.negativeMarks),
      rank: Number(newMock.rank)
    }]);
    setNewMock({ name: '', date: todayDateStr, timeframe: 'Weekly', physics: 0, chemistry: 0, biology: 0, negativeMarks: 0, rank: 0 });
    setIsMockModalOpen(false);
  };

  const deleteMock = (id) => {
    setMockTests(mockTests.filter(m => m.id !== id));
  };

  const filteredMockTests = mockTests.filter(m => {
    if (mockFilter === 'All') return true;
    return m.timeframe === mockFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
            🕉️
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Brahma NEET 2027 Command Center
            </h1>
            <p className="text-xs text-slate-400">Target: 700+ | High-Yield Cognitive System</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={requestNotificationPermission}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-amber-400 font-medium transition"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enable Alerts</span>
          </button>
          
          <button 
            onClick={fetchGoogleSheet}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400 font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex space-x-1 p-2 bg-slate-900 border-b border-slate-800 text-sm overflow-x-auto">
        {[
          { id: 'home', label: 'Daily Command (Home)', icon: Home },
          { id: 'analytics', label: 'Execution Analytics & History', icon: Activity },
          { id: 'daily', label: 'Timers & Macro Schedule', icon: Clock },
          { id: 'spaced', label: 'Adaptive Revision (SM-2)', icon: RotateCcw },
          { id: 'questions', label: 'Diagnostic Question Bank', icon: AlertCircle },
          { id: 'mock', label: 'Mock Telemetry & Analytics', icon: BarChart2 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto space-y-6">
        
        {/* TAB 0: HOME PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold text-slate-400">Execution Score</span>
                    <span className="text-xs text-amber-400 font-mono font-bold">{selectedTaskDate}</span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-extrabold font-mono text-amber-400">{progressPercent}%</span>
                    <span className="text-xs text-slate-400">({completedTodayCount}/{displayedTasks.length} tasks)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold text-slate-400">Due Revisions (Today)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-950 text-rose-400 border border-rose-800/40">
                      {dueRevisionsToday.length} Due
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto">
                    {dueRevisionsToday.length === 0 ? (
                      <p className="text-xs text-slate-500">All spaced reviews cleared for today! 🎉</p>
                    ) : (
                      dueRevisionsToday.map(r => (
                        <div key={r.id} className="text-xs flex justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                          <span className="font-semibold text-slate-200">{r.topic}</span>
                          <span className="text-amber-400 font-bold font-mono">{r.subject}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <button onClick={() => setActiveTab('spaced')} className="text-xs text-amber-400 hover:underline mt-2 text-left font-medium">
                  Open SM-2 Deck →
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">Focus Timers State</span>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {slots.map(s => (
                      <div key={s.id} className="bg-slate-950/50 p-2 rounded-xl border border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400">{s.subject}</span>
                        <span className="text-xs font-bold font-mono text-amber-400">{Math.floor(s.timeLeft / 60)}m left</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setActiveTab('daily')} className="text-xs text-amber-400 hover:underline mt-2 text-left font-medium">
                  Open Timer Control →
                </button>
              </div>
            </div>

            {/* Daily Execution Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-slate-100">Daily Execution History & Log</h3>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Date:</span>
                  </span>
                  <input 
                    type="date"
                    value={selectedTaskDate}
                    onChange={(e) => setSelectedTaskDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                  {selectedTaskDate !== todayDateStr && (
                    <button 
                      onClick={() => setSelectedTaskDate(todayDateStr)} 
                      className="px-2 py-1 bg-amber-950 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-800/50"
                    >
                      Reset to Today
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={addTask} className="flex gap-2 text-xs">
                <input 
                  type="text" 
                  placeholder={`Add task for ${selectedTaskDate}...`} 
                  value={newTaskInput.text}
                  onChange={(e) => setNewTaskInput({ ...newTaskInput, text: e.target.value })}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
                <input 
                  type="text" 
                  placeholder="Time slot (e.g. 10:00-12:00)" 
                  value={newTaskInput.timeSlot}
                  onChange={(e) => setNewTaskInput({ ...newTaskInput, timeSlot: e.target.value })}
                  className="w-44 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white hidden sm:block"
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-1">
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </form>

              <div className="divide-y divide-slate-800/60">
                {displayedTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No tasks recorded for {selectedTaskDate}. Add one above!</p>
                ) : (
                  displayedTasks.map(t => (
                    <div key={t.id} className="py-2.5 flex justify-between items-center hover:bg-slate-800/30 px-2 rounded-xl transition">
                      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => toggleTask(t.id)}>
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          t.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.text}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                          {t.timeSlot}
                        </span>
                        <button onClick={() => deleteTask(t.id)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DEDICATED EXECUTION ANALYTICS & LONG-TERM HISTORY */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>Execution Analytics & Daily Log Progression</span>
                </h2>
                <p className="text-xs text-slate-400">Track task volume and consistency percentage trends over time.</p>
              </div>

              {/* Time Scope Toggle */}
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                {[
                  { id: '7', label: 'Past 7 Days' },
                  { id: '30', label: 'Past 30 Days' },
                  { id: 'all', label: 'All Recorded Time' }
                ].map(scope => (
                  <button
                    key={scope.id}
                    onClick={() => setAnalyticsScope(scope.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${analyticsScope === scope.id ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aggregated KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tasks In Period</span>
                <h3 className="text-3xl font-extrabold font-mono text-white mt-2">{executionAnalytics.totalTasksInRange}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Total targets set</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Cleared</span>
                <h3 className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">{executionAnalytics.completedTasksInRange}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Tasks executed</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Execution Rate</span>
                <h3 className="text-3xl font-extrabold font-mono text-amber-400 mt-2">{executionAnalytics.avgCompletionRate}%</h3>
                <p className="text-[11px] text-slate-500 mt-1">Productivity efficiency</p>
              </div>
            </div>

            {/* Graphs: Execution Rate (%) and Tasks Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Execution Rate Line Chart */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Daily Execution Rate Trend (%)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={executionAnalytics.datesArray}>
                      <defs>
                        <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="rate" name="Execution %" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#rateGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Completed vs Total Tasks Stacked Bar */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Task Volume (Total vs Completed)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={executionAnalytics.datesArray}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="total" name="Total Planned" fill="#475569" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Daily Chronological Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200">Day-by-Day Historical Log</h3>
                <span className="text-xs text-slate-400">{executionAnalytics.datesArray.length} recorded active days</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Planned Targets</th>
                      <th className="p-3">Completed Targets</th>
                      <th className="p-3">Score %</th>
                      <th className="p-3">Tasks Executed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {executionAnalytics.datesArray.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-slate-500">No execution logs found in this timeframe.</td></tr>
                    ) : (
                      executionAnalytics.datesArray.slice().reverse().map(item => (
                        <tr key={item.date} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 font-mono font-bold text-white flex items-center space-x-2">
                            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.date}</span>
                          </td>
                          <td className="p-3 font-mono">{item.total} tasks</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{item.completed} cleared</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                              item.rate >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                              item.rate >= 50 ? 'bg-amber-950 text-amber-400 border border-amber-800/50' :
                              'bg-rose-950 text-rose-400 border border-rose-800/50'
                            }`}>
                              {item.rate}%
                            </span>
                          </td>
                          <td className="p-3 max-w-sm truncate text-slate-400">
                            {item.tasks.map(t => t.text).join(' • ')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIMERS & MACRO SCHEDULE */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setTimerMode('blocks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${timerMode === 'blocks' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                >
                  NEET Subject Blocks
                </button>
                <button
                  onClick={() => setTimerMode('pomodoro')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${timerMode === 'pomodoro' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                >
                  50/10 Pomodoro Engine
                </button>
              </div>
            </div>

            {timerMode === 'blocks' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{slot.subject}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">{slot.durationMinutes / 60} hrs</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold font-mono tracking-tight text-white">{formatTime(slot.timeLeft)}</h3>
                      <p className="text-xs text-slate-400 mt-1">Focus Window</p>
                    </div>
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-800/60">
                      <button
                        onClick={() => setSlots(slots.map(s => s.id === slot.id ? { ...s, isRunning: !s.isRunning } : { ...s, isRunning: false }))}
                        className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-medium text-xs transition ${
                          slot.isRunning ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {slot.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{slot.isRunning ? 'Pause' : 'Start'}</span>
                      </button>
                      <button onClick={() => setSlots(slots.map(s => s.id === slot.id ? { ...s, timeLeft: s.durationMinutes * 60, isRunning: false } : s))} className="p-2 rounded-xl bg-slate-800 text-slate-400">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {timerMode === 'pomodoro' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800/40">
                  {pomoState.mode === 'work' ? '🔥 50-Min Deep Study Window' : '☕ 10-Min Recovery Break'}
                </div>
                <h2 className="text-6xl font-black font-mono text-white tracking-tight">{formatTime(pomoState.timeLeft)}</h2>
                <p className="text-xs text-slate-400">Sessions Cleared Today: <span className="text-amber-400 font-bold font-mono">{pomoState.completedSessions}</span></p>

                <div className="flex justify-center space-x-3 pt-2">
                  <button 
                    onClick={() => setPomoState({ ...pomoState, isRunning: !pomoState.isRunning })}
                    className={`px-6 py-3 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      pomoState.isRunning ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {pomoState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{pomoState.isRunning ? 'Pause Pomodoro' : 'Start 50-Min Focus'}</span>
                  </button>
                  <button 
                    onClick={() => setPomoState({ ...pomoState, timeLeft: (pomoState.mode === 'work' ? pomoState.workDuration : pomoState.breakDuration) * 60, isRunning: false })}
                    className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 2-Way Google Sheet Interactive Roadmap */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-200">Interactive Google Sheet Syllabus (Live 2-Way Sync)</h3>
                </div>
                <span className="text-xs text-slate-400">Total Chapters: {sheetSchedule.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Chapter</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Scheduled Date</th>
                      <th className="p-3">Chapter Strength</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sheetSchedule.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-500">Loading schedule from Google Sheet...</td>
                      </tr>
                    ) : (
                      sheetSchedule.map((row) => (
                        <tr key={row.rowIndex} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 font-semibold text-white">{row.Subject}</td>
                          <td className="p-3">{row.Chapter}</td>
                          <td className="p-3 font-mono">{row.TargetHours}h</td>
                          
                          <td className="p-3">
                            <input 
                              type="date" 
                              value={row.ScheduledDate ? String(row.ScheduledDate).split('T')[0] : ''} 
                              onChange={(e) => updateSheetItem(row.rowIndex, undefined, undefined, e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-[11px]"
                            />
                          </td>

                          <td className="p-3">
                            <select
                              value={row.Strength || 'Moderate'}
                              onChange={(e) => updateSheetItem(row.rowIndex, undefined, e.target.value, undefined)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-semibold"
                            >
                              <option value="Strong">🟢 Strong</option>
                              <option value="Moderate">🟡 Moderate</option>
                              <option value="Weak">🔴 Weak</option>
                            </select>
                          </td>

                          <td className="p-3">
                            <select
                              value={row.Status || 'Pending'}
                              onChange={(e) => updateSheetItem(row.rowIndex, e.target.value, undefined, undefined)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-semibold"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In-Progress">In-Progress</option>
                              <option value="Doubt">Doubt</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPACED REPETITION (SM-2) */}
        {activeTab === 'spaced' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-amber-400" />
                <span>SM-2 Memory Scheduler & Auto-Reminders</span>
              </h2>
              <button onClick={() => setIsTopicModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition">
                <PlusCircle className="w-4 h-4" />
                <span>Add Revision Topic</span>
              </button>
            </div>

            {dueRevisionsToday.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl flex items-center space-x-3 text-xs text-amber-200">
                <Bell className="w-5 h-5 text-amber-400 shrink-0" />
                <span><strong>Reminder:</strong> You have {dueRevisionsToday.length} topic(s) due for active recall review today!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revisionDeck.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/40">{item.subject}</span>
                      <h3 className="font-semibold text-sm text-slate-100 mt-2">{item.topic}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">Next Due: <strong className={item.nextDue <= todayDateStr ? "text-rose-400" : "text-emerald-400"}>{item.nextDue}</strong></p>
                    </div>
                    <button onClick={() => deleteRevisionTopic(item.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
                    <div><span className="block text-[10px] text-slate-500">Rep #</span><span className="text-xs font-bold text-amber-400">{item.repetition}x</span></div>
                    <div><span className="block text-[10px] text-slate-500">Interval</span><span className="text-xs font-bold text-cyan-400">{item.interval}d</span></div>
                    <div><span className="block text-[10px] text-slate-500">Ease</span><span className="text-xs font-bold text-emerald-400">{item.easeFactor}</span></div>
                  </div>

                  <button onClick={() => setSelectedTopicForReview(item)} className="w-full bg-slate-800 hover:bg-amber-600 text-slate-200 py-2 rounded-xl text-xs font-semibold transition">
                    Grade Recall & Reschedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SMART DIAGNOSTIC QUESTION BANK */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Smart Diagnostic Question Bank</span>
                </h2>
                <p className="text-xs text-slate-400">Hierarchical filtering, diagram picture support, solve speed progression, and error tagging.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition shadow-lg shadow-amber-600/20">
                <PlusCircle className="w-4 h-4" />
                <span>Log New Question</span>
              </button>
            </div>

            {/* Cascading Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">1. Subject</label>
                <select 
                  value={filterSubject} 
                  onChange={(e) => { setFilterSubject(e.target.value); setFilterChapter('All'); setFilterTopic('All'); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                >
                  {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">2. Chapter</label>
                <select 
                  value={filterChapter} 
                  onChange={(e) => { setFilterChapter(e.target.value); setFilterTopic('All'); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                >
                  {chaptersList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">3. Topic</label>
                <select 
                  value={filterTopic} 
                  onChange={(e) => setFilterTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                >
                  {topicsList.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Question Cards */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No questions match your current filters. Clear the dropdowns or log a new question above!
                </div>
              ) : (
                filteredQuestions.map(q => (
                  <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-amber-400">{q.subject}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-semibold text-slate-200">{q.chapter}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-slate-400">{q.topic}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          value={q.difficulty || 'Moderate'}
                          onChange={(e) => updateQuestionMastery(q.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-200"
                        >
                          <option value="Easy">🟢 Easy</option>
                          <option value="Moderate">🟡 Moderate</option>
                          <option value="Hard">🔴 Hard</option>
                        </select>

                        <select
                          value={q.errorType}
                          onChange={(e) => updateQuestionErrorType(q.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-300"
                        >
                          <option value="Calculation Error">Calculation Error</option>
                          <option value="Conceptual Error">Conceptual Error</option>
                          <option value="Formula Lapse">Formula Lapse</option>
                          <option value="Misread Question">Misread Question</option>
                          <option value="Unit/Sign Error">Unit/Sign Error</option>
                          <option value="Overthinking">Overthinking</option>
                        </select>

                        <button onClick={() => deleteQuestion(q.id)} className="text-slate-500 hover:text-rose-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {q.questionText && (
                        <div className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
                          {q.questionText}
                        </div>
                      )}

                      {q.image && (
                        <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 w-fit">
                          <img 
                            src={q.image} 
                            alt="Question Diagram" 
                            className="w-16 h-16 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-80 transition"
                            onClick={() => setPreviewImage(q.image)}
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-300 block">Question Diagram / Graph Attached</span>
                            <button 
                              onClick={() => setPreviewImage(q.image)}
                              className="text-xs text-amber-400 hover:underline flex items-center space-x-1 mt-0.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Click to enlarge full diagram</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center space-x-2">
                        <History className="w-4 h-4 text-cyan-400" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solve Speed Progression:</span>
                        <div className="flex items-center space-x-1.5 font-mono text-xs">
                          {q.attempts && q.attempts.map((att, idx) => (
                            <React.Fragment key={idx}>
                              <span className={`px-2 py-0.5 rounded-md font-bold ${
                                idx === q.attempts.length - 1 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {att}s
                              </span>
                              {idx < q.attempts.length - 1 && <span className="text-slate-600">→</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setAttemptModalData(q)}
                        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Log Re-Attempt ({q.attempts?.length || 0} done)</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MOCK TELEMETRY */}
        {activeTab === 'mock' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>Mock Telemetry, Rank Tracking & Score Graphs</span>
                </h2>
                <p className="text-xs text-slate-400">Weekly and monthly progression toward 700+</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                  {['All', 'Weekly', 'Monthly'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMockFilter(f)}
                      className={`px-3 py-1 rounded-lg font-bold transition ${mockFilter === f ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsMockModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition">
                  <PlusCircle className="w-4 h-4" />
                  <span>Log Test</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Total Score Progression (Target: 700+)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredMockTests}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis domain={[400, 720]} stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total Marks" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Rank Progression (Lower is Better)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredMockTests}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis reversed stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="rank" name="Projected Rank" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Subject Breakdown (Physics / Chemistry / Biology)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredMockTests}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="physics" name="Physics (/180)" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="chemistry" name="Chemistry (/180)" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="biology" name="Biology (/360)" fill="#c084fc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Test Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Timeframe</th>
                    <th className="p-3">Phy</th>
                    <th className="p-3">Chem</th>
                    <th className="p-3">Bio</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Negative</th>
                    <th className="p-3">Rank</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMockTests.map(m => (
                    <tr key={m.id}>
                      <td className="p-3 font-bold text-white">{m.name}</td>
                      <td className="p-3 font-mono">{m.date}</td>
                      <td className="p-3">{m.timeframe}</td>
                      <td className="p-3 font-mono">{m.physics}</td>
                      <td className="p-3 font-mono">{m.chemistry}</td>
                      <td className="p-3 font-mono">{m.biology}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{m.total}</td>
                      <td className="p-3 font-mono text-rose-400">-{m.negativeMarks}</td>
                      <td className="p-3 font-mono text-emerald-400">#{m.rank}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => deleteMock(m.id)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full border border-slate-700 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="Diagram full view" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}

      {/* MODAL: LOG RE-ATTEMPT SPEED */}
      {attemptModalData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Log Re-Attempt Solve Time</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{attemptModalData.chapter}</h3>
              </div>
              <button onClick={() => setAttemptModalData(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={logNewAttempt} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Time taken to solve (in seconds):</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 25"
                  value={newAttemptSeconds} 
                  onChange={(e) => setNewAttemptSeconds(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-base"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setAttemptModalData(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Save Speed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW QUESTION WITH IMAGE UPLOAD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Log Question Mistake</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Subject</label>
                  <select value={newQ.subject} onChange={(e) => setNewQ({ ...newQ, subject: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Biology">Biology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chapter</label>
                  <input type="text" required placeholder="e.g. Rotational Motion" value={newQ.chapter} onChange={(e) => setNewQ({ ...newQ, chapter: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specific Subtopic</label>
                <input type="text" placeholder="e.g. Moment of Inertia" value={newQ.topic} onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Question Summary / Concept</label>
                <textarea rows="2" placeholder="Describe the critical point where the mistake happened..." value={newQ.questionText} onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center space-x-1.5">
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  <span>Attach Question Picture / Diagram (Optional)</span>
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                />
                {newQ.image && (
                  <div className="mt-2 relative w-fit">
                    <img src={newQ.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                    <button 
                      type="button" 
                      onClick={() => setNewQ(prev => ({ ...prev, image: null }))}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Initial Mastery</label>
                  <select value={newQ.difficulty} onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="Easy">Easy</option><option value="Moderate">Moderate</option><option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Error Type</label>
                  <select value={newQ.errorType} onChange={(e) => setNewQ({ ...newQ, errorType: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="Calculation Error">Calculation</option>
                    <option value="Conceptual Error">Concept</option>
                    <option value="Formula Lapse">Formula</option>
                    <option value="Misread Question">Misread</option>
                    <option value="Unit/Sign Error">Unit/Sign</option>
                    <option value="Overthinking">Overthinking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">1st Time (s)</label>
                  <input type="number" value={newQ.initialTime} onChange={(e) => setNewQ({ ...newQ, initialTime: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SM-2 RECALL REVIEW */}
      {selectedTopicForReview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">SM-2 Quality Grading</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedTopicForReview.topic}</h3>
              </div>
              <button onClick={() => setSelectedTopicForReview(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { grade: 5, label: 'Grade 5: 100% Instant Perfect Recall' },
                { grade: 4, label: 'Grade 4: 80% High Recall (Minor hesitation)' },
                { grade: 3, label: 'Grade 3: 60% Moderate Recall (Required effort)' },
                { grade: 2, label: 'Grade 2: 40% Weak (Reset interval)' },
                { grade: 1, label: 'Grade 1: 0% Total Blackout (Reset)' }
              ].map((btn) => (
                <button key={btn.grade} onClick={() => submitSM2Review(btn.grade)} className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-amber-500 transition font-medium text-slate-200">
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SM-2 TOPIC */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Add SM-2 Revision Topic</h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddTopic} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <select value={newTopic.subject} onChange={(e) => setNewTopic({ ...newTopic, subject: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                  <option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Biology">Biology</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Topic Name</label>
                <input type="text" required placeholder="e.g. Photoelectric Effect Equations" value={newTopic.topic} onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Revision Date</label>
                <input type="date" value={newTopic.nextDue} onChange={(e) => setNewTopic({ ...newTopic, nextDue: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Add Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MOCK */}
      {isMockModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Log Mock Test Result</h3>
              <button onClick={() => setIsMockModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddMock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Test Name</label>
                <input type="text" required placeholder="e.g. Major Test 5" value={newMock.name} onChange={(e) => setNewMock({ ...newMock, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input type="date" value={newMock.date} onChange={(e) => setNewMock({ ...newMock, date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Analytics Scope</label>
                  <select value={newMock.timeframe} onChange={(e) => setNewMock({ ...newMock, timeframe: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="Weekly">Weekly Mock</option>
                    <option value="Monthly">Monthly Major Test</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-slate-400 mb-1">Phy (/180)</label><input type="number" max="180" value={newMock.physics} onChange={(e) => setNewMock({ ...newMock, physics: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 mb-1">Chem (/180)</label><input type="number" max="180" value={newMock.chemistry} onChange={(e) => setNewMock({ ...newMock, chemistry: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 mb-1">Bio (/360)</label><input type="number" max="360" value={newMock.biology} onChange={(e) => setNewMock({ ...newMock, biology: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-slate-400 mb-1">Negative Lost</label><input type="number" value={newMock.negativeMarks} onChange={(e) => setNewMock({ ...newMock, negativeMarks: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 mb-1">Rank Projected</label><input type="number" value={newMock.rank} onChange={(e) => setNewMock({ ...newMock, rank: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsMockModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Save Score</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}