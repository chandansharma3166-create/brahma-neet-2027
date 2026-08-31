import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertCircle, RotateCcw, Play, Pause, 
  BarChart2, PlusCircle, RefreshCw, X, Trash2, Check,
  BrainCircuit, Calendar, TrendingUp, BookOpen, ExternalLink,
  Home, CheckSquare, Edit3, Award, Flame, Bell, Filter, Timer, 
  BellRing, ChevronRight, ChevronDown, History, Zap, Image, Eye,
  Activity, CheckCircle2, CalendarDays, User, LogOut, Lock, Sparkles,
  CloudUpload, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area 
} from 'recharts';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyRjm0L9b_-804uxLitV3kCw3aBeSuqqFhzm8xgPpqd81yiDs75CejBs1OTI1NCcE2F/exec";

// Canvas Image Compressor (~25KB Output)
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
    };
  });
};

export default function App() {
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('brahma_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [authForm, setAuthForm] = useState({ username: '', password: '', isRegister: false });
  const [authError, setAuthError] = useState('');

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const users = JSON.parse(localStorage.getItem('brahma_registered_users') || '{}');
    const u = authForm.username.trim().toLowerCase();
    const p = authForm.password.trim();

    if (!u || !p) {
      setAuthError('Please enter both username and password.');
      return;
    }

    if (authForm.isRegister) {
      if (users[u]) {
        setAuthError('Username already exists. Please login instead.');
        return;
      }
      users[u] = { username: u, password: p, createdAt: todayDateStr };
      localStorage.setItem('brahma_registered_users', JSON.stringify(users));
      const session = { username: u };
      localStorage.setItem('brahma_active_session', JSON.stringify(session));
      setCurrentUser(session);
    } else {
      if (!users[u] || users[u].password !== p) {
        setAuthError('Invalid username or password.');
        return;
      }
      const session = { username: u };
      localStorage.setItem('brahma_active_session', JSON.stringify(session));
      setCurrentUser(session);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('brahma_active_session');
    setCurrentUser(null);
  };

  // Main UI State
  const [activeTab, setActiveTab] = useState('home');
  const [sheetSchedule, setSheetSchedule] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Daily Tasks
  const [selectedTaskDate, setSelectedTaskDate] = useState(todayDateStr);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState({ text: '', timeSlot: '' });

  // DWAR Journal
  const [dwarLogs, setDwarLogs] = useState([]);
  const [dwarForm, setDwarForm] = useState({
    date: todayDateStr,
    did: '',
    will: '',
    achievement: '',
    regret: '',
    score: 8
  });

  const [analyticsScope, setAnalyticsScope] = useState('7');

  // Timers State
  const [timerMode, setTimerMode] = useState('blocks');
  const [pomoState, setPomoState] = useState({
    mode: 'work',
    timeLeft: 50 * 60,
    isRunning: false,
    workDuration: 50,
    breakDuration: 10,
    targetEndTime: null,
    completedSessions: 0
  });

  const [slots, setSlots] = useState([
    { id: 'phy', name: 'Physics Block', durationMinutes: 150, timeLeft: 150 * 60, isRunning: false, targetEndTime: null, subject: 'Physics' },
    { id: 'chem', name: 'Chemistry Block', durationMinutes: 120, timeLeft: 120 * 60, isRunning: false, targetEndTime: null, subject: 'Chemistry' },
    { id: 'bio', name: 'Biology Block', durationMinutes: 90, timeLeft: 90 * 60, isRunning: false, targetEndTime: null, subject: 'Biology' },
    { id: 'rev', name: 'Targeted Revision', durationMinutes: 120, timeLeft: 120 * 60, isRunning: false, targetEndTime: null, subject: 'Revision' }
  ]);

  const [revisionDeck, setRevisionDeck] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterChapter, setFilterChapter] = useState('All');
  const [filterTopic, setFilterTopic] = useState('All');

  const [mockTests, setMockTests] = useState([]);
  const [mockFilter, setMockFilter] = useState('All');

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [selectedTopicForReview, setSelectedTopicForReview] = useState(null);
  const [attemptModalData, setAttemptModalData] = useState(null);
  const [newAttemptSeconds, setNewAttemptSeconds] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const [newTopic, setNewTopic] = useState({ subject: 'Physics', topic: '', nextDue: todayDateStr });
  const [newQ, setNewQ] = useState({ subject: 'Physics', chapter: '', topic: '', questionText: '', image: null, errorType: 'Conceptual Error', difficulty: 'Moderate', initialTime: 60 });
  const [newMock, setNewMock] = useState({ name: '', date: todayDateStr, timeframe: 'Weekly', physics: 0, chemistry: 0, biology: 0, negativeMarks: 0, rank: 0 });

  // Restore Per-User Data
  useEffect(() => {
    if (!currentUser) return;
    const prefix = `brahma_user_${currentUser.username}_`;

    const savedTasks = localStorage.getItem(prefix + 'tasks');
    setDailyTasks(savedTasks ? JSON.parse(savedTasks) : []);

    const savedDwar = localStorage.getItem(prefix + 'dwar');
    setDwarLogs(savedDwar ? JSON.parse(savedDwar) : []);

    const savedDeck = localStorage.getItem(prefix + 'deck');
    setRevisionDeck(savedDeck ? JSON.parse(savedDeck) : []);

    const savedQuestions = localStorage.getItem(prefix + 'questions');
    setQuestions(savedQuestions ? JSON.parse(savedQuestions) : []);

    const savedMocks = localStorage.getItem(prefix + 'mocks');
    setMockTests(savedMocks ? JSON.parse(savedMocks) : []);

    const savedSlots = localStorage.getItem(prefix + 'slots');
    if (savedSlots) {
      const parsedSlots = JSON.parse(savedSlots);
      const now = Date.now();
      const updated = parsedSlots.map(s => {
        if (s.isRunning && s.targetEndTime) {
          const remaining = Math.max(0, Math.round((s.targetEndTime - now) / 1000));
          return { ...s, timeLeft: remaining, isRunning: remaining > 0 };
        }
        return s;
      });
      setSlots(updated);
    }

    const savedPomo = localStorage.getItem(prefix + 'pomo');
    if (savedPomo) {
      const parsedPomo = JSON.parse(savedPomo);
      const now = Date.now();
      if (parsedPomo.isRunning && parsedPomo.targetEndTime) {
        const remaining = Math.max(0, Math.round((parsedPomo.targetEndTime - now) / 1000));
        setPomoState({ ...parsedPomo, timeLeft: remaining, isRunning: remaining > 0 });
      } else {
        setPomoState(parsedPomo);
      }
    }
  }, [currentUser]);

  // Sync to LocalStorage
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_tasks`, JSON.stringify(dailyTasks)); }, [dailyTasks, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_dwar`, JSON.stringify(dwarLogs)); }, [dwarLogs, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_deck`, JSON.stringify(revisionDeck)); }, [revisionDeck, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_questions`, JSON.stringify(questions)); }, [questions, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_mocks`, JSON.stringify(mockTests)); }, [mockTests, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_slots`, JSON.stringify(slots)); }, [slots, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`brahma_user_${currentUser.username}_pomo`, JSON.stringify(pomoState)); }, [pomoState, currentUser]);

  // Sound Engine
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playTone = (freq, start, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      playTone(587.33, 0, 0.25);
      playTone(880.00, 0.2, 0.35);
      playTone(1174.66, 0.45, 0.6);
    } catch (e) {
      console.log('Audio alert:', e);
    }
  };

  const triggerDeviceAlert = (title, message) => {
    playAlertSound();
    if (navigator.vibrate) navigator.vibrate([600, 300, 600, 300, 900]);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.svg', requireInteraction: true });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') triggerDeviceAlert("🔔 Brahma Alarms Active", "Timer alerts are configured.");
      });
    }
  };

  // Google Sheets Fetch & Backup
  const fetchCloudData = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Syncing from Google Sheets...');
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { method: 'GET', redirect: 'follow' });
      const json = await res.json();
      if (json && json.status === 'success') {
        if (Array.isArray(json.schedule)) setSheetSchedule(json.schedule);
        if (Array.isArray(json.tasks) && json.tasks.length > 0) setDailyTasks(json.tasks);
        if (Array.isArray(json.dwar) && json.dwar.length > 0) setDwarLogs(json.dwar);
        if (Array.isArray(json.questions) && json.questions.length > 0) {
          const parsedQ = json.questions.map(q => ({
            ...q,
            attempts: typeof q.attempts === 'string' ? JSON.parse(q.attempts || '[]') : (q.attempts || [])
          }));
          setQuestions(parsedQ);
        }
        if (Array.isArray(json.mocks) && json.mocks.length > 0) setMockTests(json.mocks);
        if (Array.isArray(json.sm2Deck) && json.sm2Deck.length > 0) setRevisionDeck(json.sm2Deck);
        setSyncStatusMsg('Synced with Google Sheets Cloud!');
      }
    } catch (err) {
      console.error("Cloud fetch error:", err);
      setSyncStatusMsg('Cloud offline (Local Active)');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  const backupAllToGoogleSheets = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Backing up all data to Cloud Sheet...');
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAll',
          tasks: dailyTasks,
          dwar: dwarLogs,
          questions: questions,
          mocks: mockTests,
          sm2Deck: revisionDeck
        })
      });
      setSyncStatusMsg('✅ 100% Backed up to Google Sheets!');
    } catch (err) {
      console.error("Cloud backup error:", err);
      setSyncStatusMsg('Backup failed. Check internet.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  useEffect(() => {
    if (currentUser) fetchCloudData();
  }, [currentUser]);

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
        body: JSON.stringify({ action: 'updateSchedule', rowIndex, status, strength, scheduledDate })
      });
    } catch (err) {
      console.error("Sheet update sync failed:", err);
    }
  };

  // Timestamp Tick Engine
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      setSlots(prevSlots =>
        prevSlots.map(slot => {
          if (slot.isRunning && slot.targetEndTime) {
            const diff = Math.round((slot.targetEndTime - now) / 1000);
            if (diff <= 0) {
              triggerDeviceAlert(`⏰ ${slot.subject} Finished!`, "Session completed! Record errors in question bank.");
              return { ...slot, timeLeft: 0, isRunning: false, targetEndTime: null };
            }
            return { ...slot, timeLeft: diff };
          }
          return slot;
        })
      );

      setPomoState(prev => {
        if (!prev.isRunning || !prev.targetEndTime) return prev;
        const diff = Math.round((prev.targetEndTime - now) / 1000);
        if (diff <= 0) {
          if (prev.mode === 'work') {
            triggerDeviceAlert("🔥 50-Min Focus Completed!", "Take a 10-minute break.");
            const newTarget = Date.now() + (prev.breakDuration * 60 * 1000);
            return { ...prev, mode: 'break', timeLeft: prev.breakDuration * 60, targetEndTime: newTarget, isRunning: true, completedSessions: prev.completedSessions + 1 };
          } else {
            triggerDeviceAlert("☕ 10-Min Break Over!", "Start your next 50-minute study sprint?");
            const newTarget = Date.now() + (prev.workDuration * 60 * 1000);
            return { ...prev, mode: 'work', timeLeft: prev.workDuration * 60, targetEndTime: newTarget, isRunning: true };
          }
        }
        return { ...prev, timeLeft: diff };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleBlockTimer = (id) => {
    setSlots(slots.map(s => {
      if (s.id === id) {
        if (s.isRunning) return { ...s, isRunning: false, targetEndTime: null };
        const currentRemaining = s.timeLeft > 0 ? s.timeLeft : s.durationMinutes * 60;
        return { ...s, isRunning: true, timeLeft: currentRemaining, targetEndTime: Date.now() + (currentRemaining * 1000) };
      }
      return s;
    }));
  };

  const resetBlockTimer = (id) => {
    setSlots(slots.map(s => s.id === id ? { ...s, timeLeft: s.durationMinutes * 60, isRunning: false, targetEndTime: null } : s));
  };

  const togglePomoTimer = () => {
    if (pomoState.isRunning) {
      setPomoState({ ...pomoState, isRunning: false, targetEndTime: null });
    } else {
      const remaining = pomoState.timeLeft > 0 ? pomoState.timeLeft : (pomoState.mode === 'work' ? pomoState.workDuration : pomoState.breakDuration) * 60;
      setPomoState({ ...pomoState, isRunning: true, timeLeft: remaining, targetEndTime: Date.now() + (remaining * 1000) });
    }
  };

  const resetPomoTimer = () => {
    const duration = pomoState.mode === 'work' ? pomoState.workDuration : pomoState.breakDuration;
    setPomoState({ ...pomoState, timeLeft: duration * 60, isRunning: false, targetEndTime: null });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Task Helpers
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

  // Analytics Engine
  const generateExecutionAnalytics = () => {
    const dateMap = {};
    dailyTasks.forEach(task => {
      const d = task.date || todayDateStr;
      if (!dateMap[d]) dateMap[d] = { date: d, total: 0, completed: 0, tasks: [] };
      dateMap[d].total += 1;
      if (task.completed) dateMap[d].completed += 1;
      dateMap[d].tasks.push(task);
    });

    let datesArray = Object.values(dateMap).map(item => ({
      ...item,
      rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (analyticsScope === '7') datesArray = datesArray.slice(-7);
    else if (analyticsScope === '30') datesArray = datesArray.slice(-30);

    const totalTasksInRange = datesArray.reduce((acc, curr) => acc + curr.total, 0);
    const completedTasksInRange = datesArray.reduce((acc, curr) => acc + curr.completed, 0);
    const avgCompletionRate = totalTasksInRange > 0 ? Math.round((completedTasksInRange / totalTasksInRange) * 100) : 0;

    return { datesArray, totalTasksInRange, completedTasksInRange, avgCompletionRate };
  };

  const executionAnalytics = generateExecutionAnalytics();

  // DWAR Handlers
  const handleSaveDwar = (e) => {
    e.preventDefault();
    if (!dwarForm.did.trim() && !dwarForm.will.trim()) return;
    const existingIndex = dwarLogs.findIndex(d => d.date === dwarForm.date);
    if (existingIndex > -1) {
      const updated = [...dwarLogs];
      updated[existingIndex] = { id: Date.now(), ...dwarForm, score: Number(dwarForm.score) };
      setDwarLogs(updated);
    } else {
      setDwarLogs([{ id: Date.now(), ...dwarForm, score: Number(dwarForm.score) }, ...dwarLogs]);
    }
    setDwarForm({ date: todayDateStr, did: '', will: '', achievement: '', regret: '', score: 8 });
  };

  const deleteDwarLog = (id) => {
    setDwarLogs(dwarLogs.filter(d => d.id !== id));
  };

  const dwarChartData = [...dwarLogs].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressedData = await compressImage(file, 600, 0.6);
      setNewQ(prev => ({ ...prev, image: compressedData }));
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

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-orange-500/30">
              🕉️
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Brahma NEET 2027 Portal
            </h1>
            <p className="text-xs text-slate-400">Personalized Cognitive Telemetry & Study Space</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {authError && (
              <div className="bg-rose-950/60 border border-rose-800/80 p-3 rounded-xl text-rose-300 font-medium text-center">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Aspirant Username / Roll</label>
              <input 
                type="text" 
                required
                placeholder="e.g. chandan_neet" 
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-orange-600/20 mt-2"
            >
              {authForm.isRegister ? 'Create Independent Study Account' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <button 
              onClick={() => { setAuthForm({ ...authForm, isRegister: !authForm.isRegister }); setAuthError(''); }}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              {authForm.isRegister ? 'Already have an account? Sign In' : 'New Aspirant? Create Your Private Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
            🕉️
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Brahma NEET 2027 Command Center
            </h1>
            <p className="text-xs text-slate-400">Target: 700+ | Logged in as: <strong className="text-amber-400 uppercase font-mono">{currentUser.username}</strong></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={backupAllToGoogleSheets}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-full border border-amber-500/50 text-xs text-white font-semibold shadow-md shadow-amber-600/20 transition"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup to Google Sheet</span>
          </button>

          <button 
            onClick={fetchCloudData}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400 font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Fetch Cloud</span>
          </button>

          <button 
            onClick={requestNotificationPermission}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-full border border-slate-700 text-xs text-amber-400 font-medium transition"
          >
            <BellRing className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center space-x-1 bg-rose-950/60 hover:bg-rose-900/80 px-3 py-1.5 rounded-full border border-rose-800/60 text-xs text-rose-300 font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {syncStatusMsg && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-1.5 text-center text-xs text-amber-300 font-medium transition animate-pulse">
          {syncStatusMsg}
        </div>
      )}

      <nav className="flex space-x-1 p-2 bg-slate-900 border-b border-slate-800 text-sm overflow-x-auto">
        {[
          { id: 'home', label: 'Daily Command (Home)', icon: Home },
          { id: 'dwar', label: 'D.W.A.R. Self-Analysis', icon: Sparkles },
          { id: 'analytics', label: 'Execution Analytics', icon: Activity },
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

      <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto space-y-6">
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
                  <span className="text-xs uppercase font-bold text-slate-400">D.W.A.R. Quick Status</span>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                    {dwarLogs.find(d => d.date === todayDateStr)?.did || 'No DWAR self-analysis submitted yet for today.'}
                  </p>
                </div>
                <button onClick={() => setActiveTab('dwar')} className="text-xs text-amber-400 hover:underline mt-2 text-left font-medium">
                  Open D.W.A.R. Journal →
                </button>
              </div>
            </div>

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

        {/* TAB 1: D.W.A.R. FRAMEWORK */}
        {activeTab === 'dwar' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>D.W.A.R. Daily Self-Analysis Framework</span>
              </h2>
              <p className="text-xs text-slate-400">Dr. Abhimanyu Kumawat's 4-Pillar Daily Evaluation: Did • Will • Achievement • Regret</p>
            </div>

            <form onSubmit={handleSaveDwar} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Submit D.W.A.R. Evaluation</span>
                </span>
                <input 
                  type="date" 
                  value={dwarForm.date} 
                  onChange={(e) => setDwarForm({ ...dwarForm, date: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>D — What You DID Today (Actual Output)</span>
                  </label>
                  <textarea 
                    rows="3" 
                    required
                    placeholder="e.g. Completed 6 hours of lecture, solved 45 Physics numericals on Mechanics, revised NCERT Cell cycle." 
                    value={dwarForm.did}
                    onChange={(e) => setDwarForm({ ...dwarForm, did: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-slate-200 leading-relaxed outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-cyan-400 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>W — What You WILL Do Tomorrow (Target Commitment)</span>
                  </label>
                  <textarea 
                    rows="3" 
                    required
                    placeholder="e.g. Finish Thermodynamics PYQs, memorize Organic reaction mechanisms, 1 mock review." 
                    value={dwarForm.will}
                    onChange={(e) => setDwarForm({ ...dwarForm, will: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-slate-200 leading-relaxed outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-amber-400 flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>A — Achievement of the Day (Positive Win)</span>
                  </label>
                  <textarea 
                    rows="2" 
                    placeholder="e.g. Achieved 90% accuracy in Physics chapter test without any negative marks." 
                    value={dwarForm.achievement}
                    onChange={(e) => setDwarForm({ ...dwarForm, achievement: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-slate-200 leading-relaxed outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-rose-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>R — Regret of the Day (Time Waste / Habit Trigger)</span>
                  </label>
                  <textarea 
                    rows="2" 
                    placeholder="e.g. Procrastinated for 45 minutes on phone after lunch, skipped Biology revision." 
                    value={dwarForm.regret}
                    onChange={(e) => setDwarForm({ ...dwarForm, regret: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-slate-200 leading-relaxed outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400 font-bold">Daily Self-Satisfaction Rating:</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5" 
                    value={dwarForm.score} 
                    onChange={(e) => setDwarForm({ ...dwarForm, score: e.target.value })}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    {dwarForm.score} / 10
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg shadow-amber-600/20"
                >
                  Save D.W.A.R. Analysis
                </button>
              </div>
            </form>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-200">D.W.A.R. Self-Discipline Rating Trend (/10)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dwarChartData}>
                    <defs>
                      <linearGradient id="dwarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis domain={[0, 10]} stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="score" name="Discipline Score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#dwarGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Historical D.W.A.R. Journal Entries</h3>
              {dwarLogs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No D.W.A.R. logs submitted yet. Fill out today's self-evaluation above!
                </div>
              ) : (
                dwarLogs.map(log => (
                  <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2.5">
                      <div className="flex items-center space-x-2 font-mono text-xs font-bold text-white">
                        <CalendarDays className="w-4 h-4 text-amber-400" />
                        <span>{log.date}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40">
                          Score: {log.score}/10
                        </span>
                        <button onClick={() => deleteDwarLog(log.id)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-emerald-400 block mb-1">D — What Was Done:</span>
                        <p className="text-slate-300 leading-relaxed">{log.did}</p>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-cyan-400 block mb-1">W — Planned for Next Day:</span>
                        <p className="text-slate-300 leading-relaxed">{log.will}</p>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-amber-400 block mb-1">A — Key Achievement:</span>
                        <p className="text-slate-300 leading-relaxed">{log.achievement || 'None recorded'}</p>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-rose-400 block mb-1">R — Primary Regret / Leakage:</span>
                        <p className="text-slate-300 leading-relaxed">{log.regret || 'None recorded'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EXECUTION ANALYTICS */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <th className="p-3">Planned</th>
                      <th className="p-3">Completed</th>
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

        {/* TAB 3: TIMERS & PERSISTENT BLOCKS */}
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
                      <p className="text-xs text-slate-400 mt-1">Focus Window {slot.isRunning && <span className="text-emerald-400 font-bold ml-1 animate-pulse">● Running</span>}</p>
                    </div>
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-800/60">
                      <button
                        onClick={() => toggleBlockTimer(slot.id)}
                        className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-medium text-xs transition ${
                          slot.isRunning ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {slot.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{slot.isRunning ? 'Pause' : 'Start'}</span>
                      </button>
                      <button onClick={() => resetBlockTimer(slot.id)} className="p-2 rounded-xl bg-slate-800 text-slate-400">
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
                    onClick={togglePomoTimer}
                    className={`px-6 py-3 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      pomoState.isRunning ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {pomoState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{pomoState.isRunning ? 'Pause Pomodoro' : 'Start 50-Min Focus'}</span>
                  </button>
                  <button 
                    onClick={resetPomoTimer}
                    className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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

        {/* TAB 4: SPACED REPETITION */}
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

        {/* TAB 5: QUESTION BANK */}
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
                            <span className="text-[11px] font-bold text-slate-300 block">Question Diagram Attached</span>
                            <button 
                              onClick={() => setPreviewImage(q.image)}
                              className="text-xs text-amber-400 hover:underline flex items-center space-x-1 mt-0.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Click to enlarge diagram</span>
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

        {/* TAB 6: MOCK TELEMETRY */}
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

      {/* Lightbox Modal */}
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

      {/* Re-attempt Modal */}
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

      {/* Add Question Modal */}
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
                  <span>Attach Question Picture / Diagram (Auto-Compressed)</span>
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

      {/* SM-2 Recall Modal */}
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

      {/* Add Topic Modal */}
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

      {/* Add Mock Modal */}
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