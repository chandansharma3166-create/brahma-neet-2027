import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertCircle, RotateCcw, Play, Pause, 
  BarChart2, PlusCircle, RefreshCw, X, Trash2, Check,
  BrainCircuit, Calendar, TrendingUp, BookOpen, ExternalLink,
  Home, CheckSquare, Edit3, Award, Flame, Bell, Filter, Timer
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyRjm0L9b_-804uxLitV3kCw3aBeSuqqFhzm8xgPpqd81yiDs75CejBs1OTI1NCcE2F/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const todayDateStr = new Date().toISOString().split('T')[0];

  // 1. Google Sheets Live Schedule
  const [sheetSchedule, setSheetSchedule] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. Daily Custom Checklist & Productivity Record
  const [dailyTasks, setDailyTasks] = useState(() => {
    const saved = localStorage.getItem('brahma_daily_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: todayDateStr, text: 'Solve 45 Physics Numericals (Kinematics)', completed: false, timeSlot: '09:00 - 11:30' },
      { id: 2, date: todayDateStr, text: 'NCERT Organic Chemistry Line-by-Line Reading', completed: false, timeSlot: '12:00 - 14:00' },
      { id: 3, date: todayDateStr, text: 'Cell Biology Diagram Practice & Flashcards', completed: false, timeSlot: '15:00 - 16:30' }
    ];
  });
  const [newTaskInput, setNewTaskInput] = useState({ text: '', timeSlot: '' });

  // 3. Pomodoro + Standard Block Timers
  const [timerMode, setTimerMode] = useState('blocks'); // 'blocks' or 'pomodoro'
  const [pomoState, setPomoState] = useState({
    mode: 'work', // 'work' or 'break'
    timeLeft: 25 * 60,
    isRunning: false,
    workDuration: 25,
    breakDuration: 5,
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

  // 5. Hierarchical Question Error Bank
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('brahma_questions');
    return saved ? JSON.parse(saved) : [
      { id: 1, subject: 'Physics', chapter: 'Rotational Motion', topic: 'Moment of Inertia', questionText: 'Hollow cylinder vs Solid cylinder rolling acceleration ratio', errorType: 'Calculation Mistake', timeSpent: 110, revCount: 1 },
      { id: 2, subject: 'Chemistry', chapter: 'Thermodynamics', topic: 'Entropy & Gibbs Free Energy', questionText: 'Spontaneity criteria at low vs high temperature', errorType: 'Conceptual Error', timeSpent: 75, revCount: 2 },
      { id: 3, subject: 'Biology', chapter: 'Molecular Basis of Inheritance', topic: 'Lac Operon', questionText: 'Role of allolactose vs IPTG in inducer binding', errorType: 'Misread Question', timeSpent: 35, revCount: 3 }
    ];
  });

  // 6. Mock Test Telemetry
  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('brahma_mock_telemetry');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Major Test 1', date: '2026-08-05', timeframe: 'Monthly', physics: 125, chemistry: 140, biology: 310, total: 575, negativeMarks: 24, rank: 420 },
      { id: 2, name: 'Major Test 2', date: '2026-08-12', timeframe: 'Weekly', physics: 135, chemistry: 145, biology: 325, total: 605, negativeMarks: 16, rank: 280 },
      { id: 3, name: 'Major Test 3', date: '2026-08-19', timeframe: 'Weekly', physics: 140, chemistry: 152, biology: 335, total: 627, negativeMarks: 12, rank: 195 },
      { id: 4, name: 'Major Test 4', date: '2026-08-26', timeframe: 'Monthly', physics: 155, chemistry: 160, biology: 345, total: 660, negativeMarks: 8, rank: 85 }
    ];
  });
  const [mockFilter, setMockFilter] = useState('All'); // 'All', 'Weekly', 'Monthly'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [selectedTopicForReview, setSelectedTopicForReview] = useState(null);

  // Forms
  const [newTopic, setNewTopic] = useState({ subject: 'Physics', topic: '', nextDue: todayDateStr });
  const [newQ, setNewQ] = useState({ subject: 'Physics', chapter: '', topic: '', questionText: '', errorType: 'Conceptual Error', timeSpent: 60, revCount: 0 });
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

  // Sync with LocalStorage
  useEffect(() => { localStorage.setItem('brahma_daily_tasks', JSON.stringify(dailyTasks)); }, [dailyTasks]);
  useEffect(() => { localStorage.setItem('brahma_sm2_deck', JSON.stringify(revisionDeck)); }, [revisionDeck]);
  useEffect(() => { localStorage.setItem('brahma_questions', JSON.stringify(questions)); }, [questions]);
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

  // Update Sheet Row directly from website
  const updateSheetItem = async (rowIndex, status, strength, scheduledDate) => {
    // Optimistic UI update
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
        body: JSON.stringify({
          action: 'update',
          rowIndex,
          status,
          strength,
          scheduledDate
        })
      });
    } catch (err) {
      console.error("Sheet update sync failed:", err);
    }
  };

  // Timers Tick Engine
  useEffect(() => {
    const timer = setInterval(() => {
      // Focus Blocks
      setSlots(prevSlots =>
        prevSlots.map(slot => {
          if (slot.isRunning && slot.timeLeft > 0) {
            if (slot.timeLeft === 1) playAlertSound();
            return { ...slot, timeLeft: slot.timeLeft - 1 };
          }
          return slot;
        })
      );

      // Pomodoro Engine
      setPomoState(prev => {
        if (!prev.isRunning || prev.timeLeft <= 0) return prev;
        if (prev.timeLeft === 1) {
          playAlertSound();
          if (prev.mode === 'work') {
            return {
              ...prev,
              mode: 'break',
              timeLeft: prev.breakDuration * 60,
              completedSessions: prev.completedSessions + 1
            };
          } else {
            return {
              ...prev,
              mode: 'work',
              timeLeft: prev.workDuration * 60
            };
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

  // Checklist Helpers
  const toggleTask = (id) => {
    setDailyTasks(dailyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.text.trim()) return;
    setDailyTasks([...dailyTasks, {
      id: Date.now(),
      date: todayDateStr,
      text: newTaskInput.text,
      timeSlot: newTaskInput.timeSlot || 'Flexible',
      completed: false
    }]);
    setNewTaskInput({ text: '', timeSlot: '' });
  };

  const deleteTask = (id) => {
    setDailyTasks(dailyTasks.filter(t => t.id !== id));
  };

  // Completion calculation
  const completedCount = dailyTasks.filter(t => t.completed).length;
  const progressPercent = dailyTasks.length > 0 ? Math.round((completedCount / dailyTasks.length) * 100) : 0;

  // Spaced Repetition Due Today
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

  // Question Bank Helpers
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQ.chapter.trim()) return;
    setQuestions([{ id: Date.now(), ...newQ }, ...questions]);
    setNewQ({ subject: 'Physics', chapter: '', topic: '', questionText: '', errorType: 'Conceptual Error', timeSpent: 60, revCount: 0 });
    setIsModalOpen(false);
  };

  const incrementQuestionRevision = (id) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, revCount: (q.revCount || 0) + 1 } : q));
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
            <p className="text-xs text-slate-400">Integrated Daily Dashboard & Telemetry</p>
          </div>
        </div>

        <button 
          onClick={fetchGoogleSheet}
          disabled={isSyncing}
          className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400 font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Brahma Sheet'}</span>
        </button>
      </header>

      {/* Tabs */}
      <nav className="flex space-x-1 p-2 bg-slate-900 border-b border-slate-800 text-sm overflow-x-auto">
        {[
          { id: 'home', label: 'Daily Command (Home)', icon: Home },
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

      {/* Main Body */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto space-y-6">
        
        {/* TAB 0: HOME PAGE DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Daily Execution Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">Daily Execution Score</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-4xl font-extrabold font-mono text-amber-400">{progressPercent}%</span>
                    <span className="text-xs text-slate-400">({completedCount}/{dailyTasks.length} tasks)</span>
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
                      {dueRevisionsToday.length} Pending
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
                  <span className="text-xs uppercase font-bold text-slate-400">Focus Timers Quick State</span>
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

            {/* Daily Editable Checklist Window */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-slate-100">Today's Execution Checklist ({todayDateStr})</h3>
                </div>
                <span className="text-xs text-slate-400">Auto-persisted daily log</span>
              </div>

              <form onSubmit={addTask} className="flex gap-2 text-xs">
                <input 
                  type="text" 
                  placeholder="e.g. Solve 50 Rotational Motion PYQs..." 
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
                {dailyTasks.map(t => (
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
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: TIMERS (BLOCKS + POMODORO) & GOOGLE SHEET MACRO SCHEDULE */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* Mode Switcher */}
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
                  Pomodoro Engine
                </button>
              </div>
            </div>

            {/* Standard Subject Blocks */}
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

            {/* Pomodoro Timer */}
            {timerMode === 'pomodoro' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800/40">
                  {pomoState.mode === 'work' ? '🔥 Focus Session' : '☕ Rest Break'}
                </div>
                <h2 className="text-6xl font-black font-mono text-white tracking-tight">{formatTime(pomoState.timeLeft)}</h2>
                <p className="text-xs text-slate-400">Sessions Completed Today: <span className="text-amber-400 font-bold font-mono">{pomoState.completedSessions}</span></p>

                <div className="flex justify-center space-x-3 pt-4">
                  <button 
                    onClick={() => setPomoState({ ...pomoState, isRunning: !pomoState.isRunning })}
                    className={`px-6 py-3 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      pomoState.isRunning ? 'bg-amber-500 text-slate-950' : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {pomoState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{pomoState.isRunning ? 'Pause Session' : 'Start Pomodoro'}</span>
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

            {/* TWO-WAY GOOGLE SHEET MACRO SCHEDULE */}
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
                          
                          {/* Date slot selector directly synced */}
                          <td className="p-3">
                            <input 
                              type="date" 
                              value={row.ScheduledDate ? String(row.ScheduledDate).split('T')[0] : ''} 
                              onChange={(e) => updateSheetItem(row.rowIndex, undefined, undefined, e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-[11px]"
                            />
                          </td>

                          {/* Strength Selector */}
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

                          {/* Status Selector */}
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

        {/* TAB 2: SPACED REPETITION (SM-2) */}
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

            {/* Reminder Alert Banner */}
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

        {/* TAB 3: QUESTION BANK & ERROR LOG */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Diagnostic Question Error Bank</h2>
                <p className="text-xs text-slate-400">Hierarchical logging: Subject → Chapter → Topic → Question Mistake</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition">
                <PlusCircle className="w-4 h-4" />
                <span>Log New Question</span>
              </button>
            </div>

            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Chapter & Topic</th>
                    <th className="p-3.5">Question Text / Core Concept</th>
                    <th className="p-3.5">Error Type</th>
                    <th className="p-3.5">Time</th>
                    <th className="p-3.5">Revisions</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td className="p-3.5 font-bold text-white">{q.subject}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{q.chapter}</div>
                        <div className="text-[11px] text-amber-400">{q.topic || 'General'}</div>
                      </td>
                      <td className="p-3.5 max-w-xs">{q.questionText || 'Question details'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/40">
                          {q.errorType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{q.timeSpent}s</td>
                      <td className="p-3.5">
                        <button 
                          onClick={() => incrementQuestionRevision(q.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 font-mono font-bold transition flex items-center space-x-1"
                        >
                          <span>{q.revCount || 0}x</span>
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <button onClick={() => deleteQuestion(q.id)} className="text-slate-500 hover:text-red-400">
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

        {/* TAB 4: MOCK TELEMETRY & ANALYTICS */}
        {activeTab === 'mock' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>Mock Telemetry, Rank Tracking & Score Graphs</span>
                </h2>
                <p className="text-xs text-slate-400">Filtered progression analytics</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Filter Selector */}
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

            {/* Overall Score + Rank Progression Dual Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Score Growth */}
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

              {/* Rank Progression */}
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

            {/* Subject Specific Score Distribution */}
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

            {/* Table with Delete option */}
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

      {/* MODAL: ADD MOCK TEST */}
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

      {/* MODAL: ADD TOPIC */}
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

      {/* MODAL: ADD HIERARCHICAL QUESTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
                  <input type="text" required placeholder="e.g. Optics" value={newQ.chapter} onChange={(e) => setNewQ({ ...newQ, chapter: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specific Topic</label>
                <input type="text" placeholder="e.g. Total Internal Reflection" value={newQ.topic} onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Question Summary / Concept</label>
                <textarea rows="2" placeholder="Describe the critical step where the error happened..." value={newQ.questionText} onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Error Type</label>
                  <select value={newQ.errorType} onChange={(e) => setNewQ({ ...newQ, errorType: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="Conceptual Error">Conceptual Error</option>
                    <option value="Calculation Mistake">Calculation Mistake</option>
                    <option value="Misread Question">Misread Question</option>
                    <option value="Formula Memory Lapse">Formula Memory Lapse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time Spent (seconds)</label>
                  <input type="number" value={newQ.timeSpent} onChange={(e) => setNewQ({ ...newQ, timeSpent: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
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
    </div>
  );
}