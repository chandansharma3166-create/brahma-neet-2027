import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertCircle, RotateCcw, Play, Pause, 
  BarChart2, PlusCircle, RefreshCw, X, Trash2, Check,
  BrainCircuit, Calendar, TrendingUp, BookOpen, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyRjm0L9b_-804uxLitV3kCw3aBeSuqqFhzm8xgPpqd81yiDs75CejBs1OTI1NCcE2F/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('daily');
  
  // Google Sheets Schedule State
  const [sheetSchedule, setSheetSchedule] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Timer States
  const [slots, setSlots] = useState([
    { id: 'phy', name: 'Physics Block', durationMinutes: 150, timeLeft: 150 * 60, isRunning: false, subject: 'Physics' },
    { id: 'chem', name: 'Chemistry Block', durationMinutes: 120, timeLeft: 120 * 60, isRunning: false, subject: 'Chemistry' },
    { id: 'bio', name: 'Biology Block', durationMinutes: 90, timeLeft: 90 * 60, isRunning: false, subject: 'Biology' },
    { id: 'rev', name: 'Targeted Revision', durationMinutes: 120, timeLeft: 120 * 60, isRunning: false, subject: 'Revision' }
  ]);

  // Question Error Bank (Persisted in LocalStorage)
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('neet_questions');
    return saved ? JSON.parse(saved) : [
      { id: 1, subject: 'Physics', chapter: 'Rotational Motion', difficulty: 'Hard', timeSpent: 110, status: 'Conceptual Error', revCount: 1 },
      { id: 2, subject: 'Chemistry', chapter: 'Thermodynamics', difficulty: 'Moderate', timeSpent: 65, status: 'Silly Mistake', revCount: 2 },
      { id: 3, subject: 'Biology', chapter: 'Molecular Basis of Inheritance', difficulty: 'Easy', timeSpent: 40, status: 'Solved', revCount: 3 }
    ];
  });

  // SM-2 Spaced Repetition Deck
  const [revisionDeck, setRevisionDeck] = useState(() => {
    const saved = localStorage.getItem('neet_sm2_deck');
    return saved ? JSON.parse(saved) : [
      { id: 1, subject: 'Physics', topic: 'Ray Optics: Lens Formula', repetition: 2, interval: 6, easeFactor: 2.5, lastReviewed: '2026-08-25', nextDue: '2026-08-31', retentionScore: 85 },
      { id: 2, subject: 'Chemistry', topic: 'Aldehydes: Nucleophilic Addition', repetition: 1, interval: 1, easeFactor: 2.36, lastReviewed: '2026-08-30', nextDue: '2026-08-31', retentionScore: 70 },
      { id: 3, subject: 'Biology', topic: 'Plant Kingdom: Life Cycles', repetition: 3, interval: 14, easeFactor: 2.6, lastReviewed: '2026-08-17', nextDue: '2026-08-31', retentionScore: 95 }
    ];
  });

  // Mock Test Telemetry
  const [mockTests, setMockTests] = useState(() => {
    const saved = localStorage.getItem('neet_mock_telemetry');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Major Test 1', date: '05 Aug', physics: 125, chemistry: 140, biology: 310, total: 575, negativeMarks: 24, rank: 420 },
      { id: 2, name: 'Major Test 2', date: '12 Aug', physics: 135, chemistry: 145, biology: 325, total: 605, negativeMarks: 16, rank: 280 },
      { id: 3, name: 'Major Test 3', date: '19 Aug', physics: 140, chemistry: 152, biology: 335, total: 627, negativeMarks: 12, rank: 195 },
      { id: 4, name: 'Major Test 4', date: '26 Aug', physics: 155, chemistry: 160, biology: 345, total: 660, negativeMarks: 8, rank: 85 }
    ];
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [selectedTopicForReview, setSelectedTopicForReview] = useState(null);

  // Forms
  const [newTopic, setNewTopic] = useState({ subject: 'Physics', topic: '' });
  const [newQ, setNewQ] = useState({ subject: 'Physics', chapter: '', difficulty: 'Moderate', timeSpent: 60, status: 'Solved' });
  const [newMock, setNewMock] = useState({ name: '', date: '', physics: 0, chemistry: 0, biology: 0, negativeMarks: 0, rank: 0 });

  // Web Audio Synth Chime
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio notification error:', e);
    }
  };

  // Fetch Google Sheets Schedule
  const fetchGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        redirect: 'follow'
      });
      const json = await res.json();
      if (json && json.status === 'success' && Array.isArray(json.data)) {
        setSheetSchedule(json.data);
      }
    } catch (err) {
      console.error("Google Sheets sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchGoogleSheet();
  }, []);

  // LocalStorage Sync
  useEffect(() => { localStorage.setItem('neet_questions', JSON.stringify(questions)); }, [questions]);
  useEffect(() => { localStorage.setItem('neet_sm2_deck', JSON.stringify(revisionDeck)); }, [revisionDeck]);
  useEffect(() => { localStorage.setItem('neet_mock_telemetry', JSON.stringify(mockTests)); }, [mockTests]);

  // Timers with auto chime trigger
  useEffect(() => {
    const timer = setInterval(() => {
      setSlots(prevSlots =>
        prevSlots.map(slot => {
          if (slot.isRunning && slot.timeLeft > 0) {
            if (slot.timeLeft === 1) {
              playAlertSound();
            }
            return { ...slot, timeLeft: slot.timeLeft - 1 };
          }
          return slot;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTimer = (id) => {
    setSlots(slots.map(s => s.id === id ? { ...s, isRunning: !s.isRunning } : { ...s, isRunning: false }));
  };

  const resetTimer = (id) => {
    setSlots(slots.map(s => s.id === id ? { ...s, timeLeft: s.durationMinutes * 60, isRunning: false } : s));
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQ.chapter.trim()) return;
    setQuestions([{ id: Date.now(), ...newQ, revCount: 0 }, ...questions]);
    setNewQ({ subject: 'Physics', chapter: '', difficulty: 'Moderate', timeSpent: 60, status: 'Solved' });
    setIsModalOpen(false);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopic.topic.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    setRevisionDeck([{
      id: Date.now(),
      subject: newTopic.subject,
      topic: newTopic.topic,
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      lastReviewed: todayStr,
      nextDue: todayStr,
      retentionScore: 100
    }, ...revisionDeck]);
    setNewTopic({ subject: 'Physics', topic: '' });
    setIsTopicModalOpen(false);
  };

  const handleAddMock = (e) => {
    e.preventDefault();
    if (!newMock.name.trim()) return;
    const totalScore = Number(newMock.physics) + Number(newMock.chemistry) + Number(newMock.biology);
    setMockTests([...mockTests, {
      id: Date.now(),
      name: newMock.name,
      date: newMock.date || 'Test',
      physics: Number(newMock.physics),
      chemistry: Number(newMock.chemistry),
      biology: Number(newMock.biology),
      total: totalScore,
      negativeMarks: Number(newMock.negativeMarks),
      rank: Number(newMock.rank)
    }]);
    setNewMock({ name: '', date: '', physics: 0, chemistry: 0, biology: 0, negativeMarks: 0, rank: 0 });
    setIsMockModalOpen(false);
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

    const today = new Date();
    const nextDueDate = new Date();
    nextDueDate.setDate(today.getDate() + newInterval);

    setRevisionDeck(revisionDeck.map(t => t.id === item.id ? {
      ...t,
      repetition: newRepetition,
      interval: newInterval,
      easeFactor: Number(newEF.toFixed(2)),
      lastReviewed: today.toISOString().split('T')[0],
      nextDue: nextDueDate.toISOString().split('T')[0],
      retentionScore: q * 20
    } : t));
    setSelectedTopicForReview(null);
  };

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
              Brahma NEET 2027 Master Plan
            </h1>
            <p className="text-xs text-slate-400">Target: 700+ | High-Yield Cognitive System</p>
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
          { id: 'daily', label: 'Daily Timers & Schedule', icon: Clock },
          { id: 'spaced', label: 'Adaptive Revision (SM-2)', icon: RotateCcw },
          { id: 'questions', label: 'Question Bank & Error Log', icon: AlertCircle },
          { id: 'mock', label: 'Mock Telemetry & Graphs', icon: BarChart2 }
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
        
        {/* TAB 1: DAILY TIMERS & GOOGLE SHEET SYNCED SCHEDULE */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{slot.subject}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">{slot.durationMinutes / 60} hrs</span>
                  </div>
                  <div className="my-2">
                    <h3 className="text-3xl font-bold font-mono tracking-tight text-white">{formatTime(slot.timeLeft)}</h3>
                    <p className="text-xs text-slate-400 mt-1">Focus Window</p>
                  </div>
                  <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-800/60">
                    <button
                      onClick={() => toggleTimer(slot.id)}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-medium text-xs transition ${
                        slot.isRunning ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold' : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      {slot.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{slot.isRunning ? 'Pause' : 'Start Focus'}</span>
                    </button>
                    <button onClick={() => resetTimer(slot.id)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* LIVE GOOGLE SHEET MACRO SCHEDULE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-200">Google Sheet Macro Targets (Live)</h3>
                </div>
                <span className="text-xs text-slate-400">Total Chapters: {sheetSchedule.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Chapter</th>
                      <th className="p-3">Target Time</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sheetSchedule.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-slate-500">
                          Loading schedule from Google Sheet...
                        </td>
                      </tr>
                    ) : (
                      sheetSchedule.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 font-semibold text-white">{row.Subject}</td>
                          <td className="p-3">{row.Chapter}</td>
                          <td className="p-3 font-mono">{row.TargetHours} hrs</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.Status === 'In-Progress' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' :
                              row.Status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {row.Status || 'Pending'}
                            </span>
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

        {/* TAB 2: SPACED REPETITION */}
        {activeTab === 'spaced' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-amber-400" />
                <span>SM-2 Memory Scheduler</span>
              </h2>
              <button onClick={() => setIsTopicModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition">
                <PlusCircle className="w-4 h-4" />
                <span>Add Revision Topic</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revisionDeck.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/40">{item.subject}</span>
                    <h3 className="font-semibold text-sm text-slate-100 mt-2">{item.topic}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
                    <div><span className="block text-[10px] text-slate-500">Rep #</span><span className="text-xs font-bold text-amber-400">{item.repetition}x</span></div>
                    <div><span className="block text-[10px] text-slate-500">Interval</span><span className="text-xs font-bold text-cyan-400">{item.interval}d</span></div>
                    <div><span className="block text-[10px] text-slate-500">Ease</span><span className="text-xs font-bold text-emerald-400">{item.easeFactor}</span></div>
                  </div>
                  <button onClick={() => setSelectedTopicForReview(item)} className="w-full bg-slate-800 hover:bg-amber-600 text-slate-200 py-2 rounded-xl text-xs font-semibold transition">
                    Grade & Schedule Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUESTION BANK */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Diagnostic Question Bank</h2>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition">
                <PlusCircle className="w-4 h-4" />
                <span>Log Question</span>
              </button>
            </div>
            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Chapter</th>
                    <th className="p-3.5">Difficulty</th>
                    <th className="p-3.5">Time</th>
                    <th className="p-3.5">Diagnostic Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td className="p-3.5 font-medium text-white">{q.subject}</td>
                      <td className="p-3.5">{q.chapter}</td>
                      <td className="p-3.5 font-bold">{q.difficulty}</td>
                      <td className="p-3.5 font-mono">{q.timeSpent}s</td>
                      <td className="p-3.5">{q.status}</td>
                      <td className="p-3.5 text-right">
                        <button onClick={() => setQuestions(questions.filter(x => x.id !== q.id))} className="text-slate-500 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MOCK TELEMETRY */}
        {activeTab === 'mock' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Mock Test Telemetry</span>
              </h2>
              <button onClick={() => setIsMockModalOpen(true)} className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition">
                <PlusCircle className="w-4 h-4" />
                <span>Log Test Result</span>
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200">Overall Score Growth Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTests}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[400, 720]} stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: MOCK TEST */}
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
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-slate-400 mb-1">Phy (/180)</label><input type="number" max="180" value={newMock.physics} onChange={(e) => setNewMock({ ...newMock, physics: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 mb-1">Chem (/180)</label><input type="number" max="180" value={newMock.chemistry} onChange={(e) => setNewMock({ ...newMock, chemistry: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 mb-1">Bio (/360)</label><input type="number" max="360" value={newMock.biology} onChange={(e) => setNewMock({ ...newMock, biology: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" /></div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsMockModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Save Score</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SM-2 RATING */}
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
                { grade: 5, label: 'Grade 5: 100% Perfect Recall' },
                { grade: 4, label: 'Grade 4: 80% High Recall' },
                { grade: 3, label: 'Grade 3: 60% Moderate Recall' },
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
              <h3 className="text-sm font-bold">Add Revision Topic</h3>
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
                <label className="block text-slate-400 mb-1">Topic</label>
                <input type="text" required value={newTopic.topic} onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Add Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD QUESTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Log Question</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <select value={newQ.subject} onChange={(e) => setNewQ({ ...newQ, subject: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                  <option value="Physics">Physics</option><option value="Chemistry">Chemistry</option><option value="Biology">Biology</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Chapter</label>
                <input type="text" required value={newQ.chapter} onChange={(e) => setNewQ({ ...newQ, chapter: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Difficulty</label>
                  <select value={newQ.difficulty} onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="Easy">Easy</option><option value="Moderate">Moderate</option><option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time (seconds)</label>
                  <input type="number" value={newQ.timeSpent} onChange={(e) => setNewQ({ ...newQ, timeSpent: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-semibold transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}