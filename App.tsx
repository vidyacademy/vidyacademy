
import React, { useState, useRef, useEffect } from 'react';
import { AIState, Course, Message, AppSettings, Announcement, HomeworkSubmission, Quiz, QuizResult, Student, Resource, QuizAttempt, UserProfile } from './types';
import { gemini } from './services/geminiService';
import { audioPlayer } from './services/audioPlayer';
import VidyaCore from './components/VidyaAvatar';
import CourseCard from './components/CourseCard';
import { TypingDots, VoiceWave } from './components/FeedbackUI';

const DEFAULT_LOGO = 'https://i.ibb.co/vzY8MPr/vidya-logo.png';

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Aman Verma', email: 'aman@vidya.edu', grade: '12th', joinedDate: '2024-01-10' },
  { id: 's2', name: 'Sneha Rao', email: 'sneha@vidya.edu', grade: '10th', joinedDate: '2024-02-15' },
  { id: 's3', name: 'Rahul Singh', email: 'rahul@vidya.edu', grade: '11th', joinedDate: '2024-03-01' },
  { id: 's4', name: 'Priya Das', email: 'priya@vidya.edu', grade: '12th', joinedDate: '2024-04-20' },
];

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'ai' | 'live' | 'admin' | 'quiz'>('home');
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'students' | 'resources' | 'quiz' | 'brand'>('dashboard');
  
  // Auth States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vidya_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('vidya_admin_session') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [aiState, setAiState] = useState<AIState>(AIState.IDLE);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(() => {
    const today = new Date().toISOString().substring(0, 10);
    const saved = localStorage.getItem(`vidya_quiz_${today}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [userQuizResult, setUserQuizResult] = useState<QuizResult | null>(() => {
    const today = new Date().toISOString().substring(0, 10);
    const saved = localStorage.getItem(`vidya_quiz_result_${today}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [leaderboard, setLeaderboard] = useState<QuizAttempt[]>(() => {
    const today = new Date().toISOString().substring(0, 10);
    const saved = localStorage.getItem(`vidya_leaderboard_${today}`);
    return saved ? JSON.parse(saved) : [
      { studentName: 'Aman Verma', score: 5, total: 5, submittedAt: '2024-05-20T10:00:00Z', answers: [] },
      { studentName: 'Sneha Rao', score: 4, total: 5, submittedAt: '2024-05-20T10:05:00Z', answers: [] },
      { studentName: 'Rahul Singh', score: 3, total: 5, submittedAt: '2024-05-20T11:00:00Z', answers: [] },
      { studentName: 'Priya Das', score: 4, total: 5, submittedAt: '2024-05-20T09:30:00Z', answers: [] },
    ].sort((a, b) => b.score - a.score);
  });

  const [quizSelection, setQuizSelection] = useState<number[]>([]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('vidya_settings');
    return saved ? JSON.parse(saved) : {
      appName: "VIDYA AI",
      tagline: "Vidya hi Jeevan Hai",
      logoUrl: DEFAULT_LOGO,
      aiEnabled: true,
      liveYoutubeId: 'jfKfPfyJRdk',
      isLive: false,
      liveTitle: 'Physics Live Session: Class 12',
      adminUid: 'ADMIN_1234'
    };
  });

  // Simulation of Firestore "Check and Generate"
  useEffect(() => {
    const checkAndGenerateQuiz = async () => {
      const today = new Date().toISOString().substring(0, 10);
      const savedQuiz = localStorage.getItem(`vidya_quiz_${today}`);
      
      if (!savedQuiz && settings.aiEnabled) {
        setAiState(AIState.THINKING);
        const newQuizData = await gemini.generateDailyQuiz();
        if (newQuizData) {
          const finalQuiz = {
            ...newQuizData,
            date: today,
            createdBy: 'VIDYA_AI'
          };
          localStorage.setItem(`vidya_quiz_${today}`, JSON.stringify(finalQuiz));
          setDailyQuiz(finalQuiz);
        }
        setAiState(AIState.IDLE);
      }
    };
    if (!showSplash && (currentUser || isAdmin)) checkAndGenerateQuiz();
  }, [showSplash, currentUser, isAdmin]);

  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem('vidya_resources');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', type: 'pdf', title: 'Calculus Cheat Sheet', url: '#', category: 'Maths' },
      { id: 'r2', type: 'video', title: 'Concept of Atoms', url: 'https://youtube.com', category: 'Physics' },
    ];
  });

  const [systemAdmin, setSystemAdmin] = useState(() => {
    const saved = localStorage.getItem('vidya_system_admin');
    return saved ? JSON.parse(saved) : { adminEmail: "", locked: false };
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('vidya_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('vidya_courses');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Calculus: Mastering Limits', instructor: 'Vidya Academy', thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400', price: 0, isFree: true, category: 'Maths' },
      { id: '2', title: 'Quantum Mechanics: The Basics', instructor: 'Vidya Academy', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400', price: 499, isFree: false, category: 'Physics' },
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pressTimer = useRef<number | null>(null);
  const [pressProgress, setPressProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('vidya_settings', JSON.stringify(settings));
    localStorage.setItem('vidya_announcements', JSON.stringify(announcements));
    localStorage.setItem('vidya_courses', JSON.stringify(courses));
    localStorage.setItem('vidya_resources', JSON.stringify(resources));
    localStorage.setItem('vidya_system_admin', JSON.stringify(systemAdmin));
  }, [settings, announcements, courses, resources, systemAdmin]);

  useEffect(() => {
    if (activeTab === 'ai' && chatHistory.length === 0) {
      setChatHistory([{
        role: 'model',
        text: `Namaste 🙏\nMain ${settings.appName} ka AI hoon.\nAaj aap kya seekhna chahte ho?`,
        timestamp: new Date()
      }]);
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, aiState]);

  const handleAuth = () => {
    if (authMode === 'signup') {
      if (!authForm.name || !authForm.email || !authForm.password) return alert("Please fill all fields");
      const newUser: UserProfile = {
        uid: Math.random().toString(36).substring(7),
        name: authForm.name,
        email: authForm.email,
        role: 'student',
        joinedAt: new Date().toISOString(),
        active: true
      };
      // Simulate saving to a "students" collection
      const existingStudents = JSON.parse(localStorage.getItem('vidya_all_students') || '[]');
      localStorage.setItem('vidya_all_students', JSON.stringify([...existingStudents, newUser]));
      
      setCurrentUser(newUser);
      localStorage.setItem('vidya_current_user', JSON.stringify(newUser));
    } else {
      // Login simulation
      const allStudents = JSON.parse(localStorage.getItem('vidya_all_students') || '[]');
      const user = allStudents.find((u: any) => u.email === authForm.email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('vidya_current_user', JSON.stringify(user));
      } else {
        alert("Student not found. Please Sign up.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vidya_current_user');
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('vidya_admin_session');
    setIsAdmin(false);
    setActiveTab('home');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;
    const currentInput = input;
    const currentImage = selectedImage;
    const userMsg: Message = { role: 'user', text: currentInput, image: currentImage || undefined, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setAiState(AIState.THINKING);
    try {
      const base64Image = currentImage ? currentImage.split(',')[1] : undefined;
      const responseText = await gemini.ask(currentInput || "Analyze this learning material.", base64Image);
      setChatHistory((prev) => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
      setAiState(AIState.TALKING);
      const audioData = await gemini.generateSpeech(responseText);
      if (audioData) await audioPlayer.play(audioData);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setAiState(AIState.IDLE);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.onstart = () => { setIsRecording(true); setAiState(AIState.LISTENING); };
    recognition.onresult = (event: any) => setInput(event.results[0][0].transcript);
    recognition.onend = () => { setIsRecording(false); setAiState(AIState.IDLE); };
    recognition.start();
  };

  const handleLogoPressStart = () => {
    setPressProgress(0);
    const startTime = Date.now();
    const duration = 5000;
    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setPressProgress(progress);
      if (progress >= 100) clearInterval(progressInterval);
    }, 50);
    pressTimer.current = window.setTimeout(() => {
      clearInterval(progressInterval);
      setPressProgress(0);
      setShowAdminLogin(true);
    }, duration);
    (pressTimer as any).interval = progressInterval;
  };

  const handleLogoPressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      clearInterval((pressTimer as any).interval);
    }
    setPressProgress(0);
  };

  const handleAdminLogin = async () => {
    if (adminPassword === "vidya2024") {
      if (!systemAdmin.locked) setSystemAdmin({ adminEmail, locked: true });
      sessionStorage.setItem('vidya_admin_session', 'true');
      setIsAdmin(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
    } else {
      alert("Invalid Creds");
    }
  };

  const submitQuiz = () => {
    if (!dailyQuiz || !currentUser) return;
    const today = new Date().toISOString().substring(0, 10);
    let score = 0;
    dailyQuiz.questions.forEach((q, idx) => {
      if (quizSelection[idx] === q.answer) score++;
    });

    const attempt: QuizAttempt = {
      studentName: currentUser.name, 
      answers: quizSelection,
      score,
      total: dailyQuiz.questions.length,
      submittedAt: new Date().toISOString()
    };

    const newLeaderboard = [...leaderboard, attempt].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    setLeaderboard(newLeaderboard);
    localStorage.setItem(`vidya_leaderboard_${today}`, JSON.stringify(newLeaderboard));

    const result: QuizResult = {
      userId: currentUser.uid,
      score,
      totalQuestions: dailyQuiz.questions.length,
      date: today,
      rank: (newLeaderboard.indexOf(attempt) + 1).toString()
    };
    
    setUserQuizResult(result);
    localStorage.setItem(`vidya_quiz_result_${today}`, JSON.stringify(result));
  };

  const renderAuthScreen = () => (
    <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl border border-blue-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 to-blue-400"></div>
        <div className="text-center mb-10">
          <img src={settings.logoUrl} className="h-16 mx-auto mb-6" alt="Logo" />
          <h2 className="text-4xl font-black text-blue-950 tracking-tighter uppercase mb-2">Scholar Access</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Join the Future of Learning</p>
        </div>

        <div className="space-y-6">
          {authMode === 'signup' && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
              <input 
                type="text" 
                value={authForm.name} 
                onChange={e => setAuthForm({...authForm, name: e.target.value})}
                className="w-full bg-gray-50 p-5 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-lg transition-all" 
                placeholder="Rahul Kumar"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Email ID</label>
            <input 
              type="email" 
              value={authForm.email} 
              onChange={e => setAuthForm({...authForm, email: e.target.value})}
              className="w-full bg-gray-50 p-5 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-lg transition-all" 
              placeholder="rahul@example.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Secret Key</label>
            <input 
              type="password" 
              value={authForm.password} 
              onChange={e => setAuthForm({...authForm, password: e.target.value})}
              className="w-full bg-gray-50 p-5 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold text-lg transition-all" 
              placeholder="••••••••"
            />
          </div>

          <button 
            onClick={handleAuth}
            className="w-full bg-blue-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all mt-4"
          >
            {authMode === 'login' ? 'Enter Academy' : 'Create Account'}
          </button>

          <p className="text-center text-[11px] font-bold text-gray-400 pt-4">
            {authMode === 'login' ? "Don't have an account?" : "Already a member?"} 
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-blue-600 font-black ml-1 uppercase"
            >
              {authMode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const renderAdminPanel = () => (
    <div className="max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase">Command Center</h2>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">ADMIN SESSION ACTIVE</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setAdminSubTab('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminSubTab === 'dashboard' ? 'bg-blue-100 text-blue-900' : 'text-gray-400'}`}>Dashboard</button>
          <button onClick={handleAdminLogout} className="bg-red-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-gray-100">
          <h3 className="text-xl font-black text-blue-900 mb-6 flex items-center gap-3">🧠 Quiz Performance Matrix</h3>
          <div className="space-y-4">
             {leaderboard.map((l, i) => (
               <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                 <span className="text-xs font-bold text-gray-700">{l.studentName}</span>
                 <span className="text-xs font-black text-blue-600">{l.score}/{l.total}</span>
               </div>
             ))}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-gray-100">
          <h3 className="text-xl font-black text-blue-900 mb-6 flex items-center gap-3">📢 Global Push</h3>
          <textarea id="ann-input" className="w-full bg-gray-50 p-6 rounded-2xl outline-none border focus:border-blue-400 font-medium text-sm mb-4" placeholder="Announcement..."></textarea>
          <button onClick={() => {}} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Broadcast Now</button>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-6">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-2xl font-black text-blue-900 tracking-tight">Today's Leaderboard</h3>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Top 10 Performers</span>
      </div>
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-blue-900 text-white">
            <tr className="text-[10px] font-black uppercase tracking-widest">
              <th className="py-4 px-6">Rank</th>
              <th className="py-4 px-6">Scholar</th>
              <th className="py-4 px-6 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leaderboard.slice(0, 10).map((entry, idx) => (
              <tr key={idx} className={`hover:bg-blue-50/50 transition-colors ${entry.studentName === currentUser?.name ? 'bg-amber-50/50' : ''}`}>
                <td className="py-4 px-6">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-gray-400 font-black ml-1">{idx + 1}</span>}
                </td>
                <td className="py-4 px-6">
                  <span className="font-black text-blue-950 text-sm">{entry.studentName}</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="font-black text-blue-600">{entry.score} / {entry.total}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLiveClass = () => (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-700 h-[calc(100vh-100px)] flex flex-col">
       {!settings.isLive ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[4rem] border shadow-2xl">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-xl">
               <span className="text-6xl grayscale opacity-30">📽️</span>
            </div>
            <h2 className="text-4xl font-black text-blue-950 mb-4 tracking-tighter">No Live Sessions Active</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] max-w-sm leading-relaxed">Please check the broadcast schedule in the announcements section or wait for the notification.</p>
            <button onClick={() => setActiveTab('home')} className="mt-10 text-blue-600 font-black uppercase tracking-widest text-[10px] hover:underline">Return to Hub</button>
         </div>
       ) : (
         <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden h-full">
            <div className="flex-[3] flex flex-col bg-black rounded-[3rem] overflow-hidden shadow-2xl relative">
               <div className="absolute top-6 left-6 z-10">
                  <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-xl flex items-center gap-2">
                     <div className="w-2 h-2 bg-white rounded-full"></div> Live Now
                  </span>
               </div>
               <iframe 
                  className="w-full h-full border-none"
                  src={`https://www.youtube.com/embed/${settings.liveYoutubeId}?autoplay=1&modestbranding=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
               ></iframe>
               <div className="bg-white/10 backdrop-blur-3xl p-8 border-t border-white/5">
                  <h2 className="text-2xl font-black text-white tracking-tight">{settings.liveTitle}</h2>
                  <p className="text-blue-300 font-bold text-[10px] uppercase tracking-widest mt-2">Streaming via Vidya Secure Link</p>
               </div>
            </div>
            
            <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-w-[320px]">
               <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Interactions</span>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <span className="text-[9px] font-black text-gray-900 uppercase">Active Chat</span>
                  </div>
               </div>
               <iframe 
                  className="flex-1 border-none"
                  src={`https://www.youtube.com/live_chat?v=${settings.liveYoutubeId}&embed_domain=${window.location.hostname}`}
               ></iframe>
            </div>
         </div>
       )}
    </div>
  );

  const renderQuiz = () => {
    if (!dailyQuiz) return (
      <div className="text-center py-40">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">📡</div>
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Syncing with VIDYA AI Neural Link...</p>
      </div>
    );

    if (userQuizResult) return (
      <div className="max-w-4xl mx-auto p-12 mt-10">
        <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-blue-50 overflow-hidden text-center animate-in zoom-in-95 p-12 relative">
          <div className="absolute top-0 right-0 p-8 text-8xl opacity-10">🎓</div>
          <div className="relative z-10">
            <span className="bg-blue-100 text-blue-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest mb-6 inline-block">Daily Report Card</span>
            <h2 className="text-5xl font-black text-blue-950 mb-2 leading-none">Shabash!</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12">Performance Summary for {dailyQuiz.subject}</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
               <div className="p-10 bg-blue-50 rounded-[3.5rem] border-2 border-blue-100 min-w-[240px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">Accuracy</p>
                  <p className="text-7xl font-black text-blue-900 tracking-tighter">{userQuizResult.score}<span className="text-2xl text-blue-300"> / {userQuizResult.totalQuestions}</span></p>
               </div>
               <div className="p-10 bg-amber-50 rounded-[3.5rem] border-2 border-amber-100 min-w-[240px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-2">Daily Rank</p>
                  <p className="text-7xl font-black text-amber-600 tracking-tighter">#{userQuizResult.rank}</p>
               </div>
            </div>

            <p className="text-gray-500 max-w-md mx-auto font-medium mb-12 italic">"Education is the most powerful weapon which you can use to change the world." - Vidya Academy</p>
            
            <button onClick={() => setActiveTab('home')} className="bg-blue-950 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Continue Journey</button>
          </div>
        </div>

        {renderLeaderboard()}
      </div>
    );

    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-8">
        <div className="bg-blue-900 p-12 rounded-[3.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden group">
           <div className="relative z-10">
             <span className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-md border border-white/5">Neural IQ Check</span>
             <h2 className="text-5xl font-black tracking-tighter">Daily Challenge</h2>
             <p className="text-blue-300 font-bold mt-2 opacity-80 uppercase tracking-widest text-[10px]">Active Node: {dailyQuiz.subject}</p>
           </div>
           <div className="absolute right-0 top-0 p-10 text-9xl opacity-10 rotate-12 transition-transform group-hover:rotate-0">🧠</div>
        </div>

        <div className="space-y-8 pb-20">
          {dailyQuiz.questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 transition-all hover:border-blue-100 group">
              <div className="flex items-start gap-5 mb-8">
                <span className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">0{qIdx + 1}</span>
                <h3 className="text-2xl font-black text-blue-950 leading-tight pt-1">{q.q}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <button 
                    key={oIdx} 
                    onClick={() => {
                      const newSel = [...quizSelection];
                      newSel[qIdx] = oIdx;
                      setQuizSelection(newSel);
                    }}
                    className={`p-6 rounded-2xl border-2 font-black text-left transition-all relative overflow-hidden ${quizSelection[qIdx] === oIdx ? 'bg-blue-900 text-white border-blue-900 shadow-xl scale-[1.02]' : 'bg-gray-50 border-transparent hover:bg-blue-50 hover:border-blue-100'}`}
                  >
                    <span className="relative z-10">{opt}</span>
                    {quizSelection[qIdx] === oIdx && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">✨</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-10 flex justify-center px-10">
          <button 
            onClick={submitQuiz}
            className={`w-full max-w-lg py-7 rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-[0_20px_50px_rgba(30,58,138,0.3)] transition-all ${quizSelection.length >= 5 ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'}`}
            disabled={quizSelection.length < 5}
          >
            {quizSelection.length < 5 ? `Finish all questions (${quizSelection.filter(x => x !== undefined).length}/5)` : 'Submit IQ Evaluation'}
          </button>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex items-center justify-between mb-16">
        <div className="space-y-2">
          <div className="bg-[#1E3A8A] text-white px-4 py-1.5 rounded-full text-[10px] font-black w-fit mb-4 tracking-widest uppercase shadow-md">Vidya Academy Prime</div>
          <h1 className="text-6xl font-black text-[#1E3A8A] tracking-tighter leading-none mb-4">India's First <br/>Personalized AI Tutor.</h1>
          <p className="text-gray-500 max-w-lg pt-4 leading-relaxed font-bold text-lg">{settings.tagline} — Har Sawal Ka Step-by-Step Jawab.</p>
        </div>
        <div className="hidden lg:block relative group">
           <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full -z-10 group-hover:scale-125 transition-transform duration-1000"></div>
           <img src={settings.logoUrl} alt="V" className="w-56 h-56 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
        <div className="vidya-gradient rounded-[3.5rem] p-16 text-white relative overflow-hidden shadow-[0_30px_60px_rgba(30,58,138,0.4)] group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => setActiveTab('ai')}>
          <div className="relative z-10">
            <span className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block backdrop-blur-md border border-white/5">Voice + Visual</span>
            <h2 className="text-5xl font-black mb-8 leading-none tracking-tight">Talk to <br/>VIDYA AI ✨</h2>
            <div className="flex items-center gap-4 text-sm font-black uppercase tracking-widest">Start Session <svg className="w-6 h-6 group-hover:translate-x-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12 group-hover:rotate-6 group-hover:scale-125 transition-all duration-1000">
             <img src={settings.logoUrl} className="w-80 h-80 object-contain invert" alt="" />
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-16 text-gray-800 border-2 border-blue-50 shadow-xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]" onClick={() => setActiveTab('quiz')}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-4 bg-amber-100 rounded-[2rem] text-3xl shadow-inner">🧠</span>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Knowledge Drop</span>
            </div>
            <h2 className="text-5xl font-black text-blue-950 mb-8 leading-none tracking-tighter">AI Daily IQ Challenge.</h2>
            <div className="flex items-center gap-4 text-sm font-black text-blue-600 uppercase tracking-widest group-hover:gap-6 transition-all">Rank Today <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></div>
          </div>
          <div className="absolute right-0 bottom-0 p-12 text-9xl opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all">🎓</div>
        </div>
      </div>
      
      {settings.isLive && (
         <div 
          onClick={() => setActiveTab('live')}
          className="mb-20 bg-red-600 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-red-700 transition-all group overflow-hidden relative"
         >
            <div className="relative z-10">
               <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block border border-white/10">Broadcast Alert</span>
               <h3 className="text-4xl font-black tracking-tighter mb-2">{settings.liveTitle}</h3>
               <p className="font-bold opacity-80 uppercase tracking-widest text-[10px]">Session is Live & Active • Click to Join Matrix</p>
            </div>
            <div className="mt-8 md:mt-0 relative z-10">
               <div className="bg-white text-red-600 w-20 h-20 rounded-full flex items-center justify-center shadow-xl group-hover:scale-125 transition-transform">
                  <svg className="w-10 h-10 translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
               </div>
            </div>
         </div>
      )}

      <div className="mb-20">
        <div className="flex items-center justify-between mb-12 px-6">
          <h3 className="text-4xl font-black text-blue-950 tracking-tighter">Academic Hub</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-6 py-2 rounded-full border">Curated Pathways</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} onClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFEFF] flex flex-col selection:bg-blue-100 overflow-x-hidden">
      {showSplash && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center animate-pulse">
            <img src={settings.logoUrl} alt="V" className="w-32 h-32 mb-6" />
            <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tighter">{settings.appName}</h1>
            <p className="text-amber-500 font-bold italic text-[10px] tracking-[0.5em] mt-2 uppercase">Connecting Neural Link...</p>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-blue-400 to-blue-900"></div>
            <h3 className="text-3xl font-black text-[#1E3A8A] tracking-tighter uppercase mb-8 text-center leading-none">Admin <br/>Authentication</h3>
            <div className="space-y-6">
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Email ID" className="w-full bg-gray-50 p-6 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold" />
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-50 p-6 rounded-2xl border-2 border-transparent focus:border-blue-400 outline-none font-bold" />
              <button onClick={handleAdminLogin} className="w-full bg-blue-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">Enter Command Hub</button>
              <button onClick={() => setShowAdminLogin(false)} className="w-full text-gray-400 font-black text-[10px] uppercase tracking-widest">Abort Handshake</button>
            </div>
          </div>
        </div>
      )}
      
      {!currentUser && !isAdmin ? (
        renderAuthScreen()
      ) : (
        <>
          <nav className="sticky top-0 z-[60] px-10 py-5 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-3xl shadow-sm">
            <div className="flex items-center gap-5 cursor-pointer relative" onMouseDown={handleLogoPressStart} onMouseUp={handleLogoPressEnd} onTouchStart={handleLogoPressStart} onTouchEnd={handleLogoPressEnd} onClick={() => setActiveTab('home')}>
              <div className="relative">
                <img src={settings.logoUrl} alt="V" className="h-11 w-auto drop-shadow-sm" />
                {pressProgress > 0 && (
                  <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90">
                    <circle cx="50%" cy="50%" r="26" fill="none" stroke="#1E3A8A" strokeWidth="4" strokeDasharray={`${pressProgress * 1.63}, 163`} className="transition-all duration-75" />
                  </svg>
                )}
              </div>
              <div className="font-black text-[#1E3A8A] tracking-tighter text-2xl uppercase leading-none">{settings.appName}</div>
            </div>
            <div className="flex items-center bg-gray-100/50 p-1.5 rounded-[2rem] border border-gray-200">
              {[
                { id: 'home', label: 'Home' },
                { id: 'ai', label: 'Vidya AI' },
                { id: 'live', label: 'Live Class' },
                { id: 'quiz', label: 'Quiz' },
                ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : [])
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-2.5 rounded-[1.5rem] text-[11px] font-black transition-all uppercase tracking-widest relative ${activeTab === tab.id ? 'bg-white text-blue-900 shadow-[0_5px_15px_rgba(30,58,138,0.15)] transform scale-105' : 'text-gray-400 hover:text-blue-900'}`}>
                   {tab.label}
                   {tab.id === 'live' && settings.isLive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                   )}
                </button>
              ))}
            </div>
            <div className="hidden xl:flex items-center gap-6 text-right">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{isAdmin ? 'Super Admin' : currentUser?.name}</span>
                <button onClick={isAdmin ? handleAdminLogout : handleLogout} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Sign Out</button>
              </div>
            </div>
          </nav>

          <main className="flex-1 overflow-x-hidden">
            {activeTab === 'home' && renderHome()}
            {activeTab === 'ai' && (
              <div className="h-[calc(100vh-100px)] max-w-6xl mx-auto px-6 flex flex-col pt-10">
                <div className="flex-1 overflow-y-auto pb-10 space-y-12 no-scrollbar">
                  <div className="h-[320px] rounded-[3.5rem] overflow-hidden shadow-2xl"><VidyaCore state={aiState} /></div>
                  <div className="max-w-4xl mx-auto space-y-10">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                        <div className={`p-8 rounded-[2.5rem] max-w-[85%] shadow-sm leading-relaxed font-medium ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border-2 border-blue-50 text-blue-950 rounded-tl-none'}`}>
                           {m.image && <img src={m.image} className="rounded-3xl mb-6 shadow-xl w-full object-cover max-h-[400px]" alt="Visual input" />}
                           <p className="whitespace-pre-wrap text-lg">{m.text}</p>
                           {m.role === 'model' && i === chatHistory.length - 1 && aiState === AIState.TALKING && (
                              <div className="mt-6 pt-6 border-t border-blue-50 flex items-center justify-between">
                                 <VoiceWave active={true} />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Audio Feedback</span>
                              </div>
                           )}
                        </div>
                      </div>
                    ))}
                    {aiState === AIState.THINKING && <div className="flex justify-start"><TypingDots /></div>}
                    <div ref={chatEndRef} />
                  </div>
                </div>
                <div className="p-10 bg-white border-t border-gray-100 flex gap-6 items-center rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                   <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-gray-50 rounded-3xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-inner"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg></button>
                   <input type="file" ref={fileInputRef} hidden onChange={handleImageSelect} />
                   <div className="flex-1 relative">
                     <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="w-full bg-gray-50 p-6 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-400 shadow-inner font-bold text-lg" placeholder="Ask anything, Scholar..." />
                     <button onClick={handleVoiceInput} className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white shadow-xl animate-pulse' : 'text-blue-600 hover:bg-blue-50'}`}><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg></button>
                   </div>
                   <button onClick={handleSendMessage} disabled={aiState === AIState.THINKING} className="bg-blue-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(30,58,138,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50">Send</button>
                </div>
              </div>
            )}
            {activeTab === 'live' && renderLiveClass()}
            {activeTab === 'admin' && isAdmin && renderAdminPanel()}
            {activeTab === 'quiz' && renderQuiz()}
          </main>
        </>
      )}
      <footer className="py-20 text-center opacity-20 text-[10px] uppercase font-black tracking-[1em] hover:opacity-100 transition-opacity">Vidya Academy Neural Ops</footer>
    </div>
  );
};

export default App;
