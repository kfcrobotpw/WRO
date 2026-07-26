import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tablet, Tv, Cpu, ShieldAlert, ArrowRight, RefreshCw, ServerCrash, Lock, KeyRound, ShieldCheck, LogOut } from 'lucide-react';
import { QueueItem, ViewMode } from './types';
import IpadRegister from './components/IpadRegister';
import PcDashboard from './components/PcDashboard';
import {
  subscribeToQueue,
  addQueueItem,
  updateQueueItemStatus,
  resetQueue,
  subscribeToPenalties,
  updatePenaltyCount,
  clearPenaltyCount
} from './lib/firebase';

const REQUIRED_PASSWORD = 'helloworldkfc@1234';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wro_arena_auth') === 'true' || localStorage.getItem('wro_arena_auth') === 'true';
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [penalties, setPenalties] = useState<Record<string, number>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === REQUIRED_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
      setShowPasswordModal(false);
      setPasswordInput('');
      sessionStorage.setItem('wro_arena_auth', 'true');
      localStorage.setItem('wro_arena_auth', 'true');
      setViewMode('pc');
    } else {
      setPasswordError(true);
    }
  };

  const handleSelectPcMode = () => {
    if (isAuthenticated) {
      setViewMode('pc');
    } else {
      setShowPasswordModal(true);
      setPasswordError(false);
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('wro_arena_auth');
    localStorage.removeItem('wro_arena_auth');
    setPasswordInput('');
    setPasswordError(false);
    setShowPasswordModal(false);
    setViewMode('select');
  };

  // Real-time updates subscription using Firestore onSnapshot
  useEffect(() => {
    const unsubscribeQueue = subscribeToQueue((updatedQueue) => {
      setQueue(updatedQueue);
      setIsConnected(true);
      setConnectionError(false);
    });

    const unsubscribePenalties = subscribeToPenalties((updatedPenalties) => {
      setPenalties(updatedPenalties);
    });

    return () => {
      unsubscribeQueue();
      unsubscribePenalties();
    };
  }, []);

  // Compute the last queue number dynamically from current queue state
  const lastNumber = queue.reduce((max, item) => (item.number > max ? item.number : max), 100);

  // Register a new practitioner (iPad) via Firestore
  const handleRegister = async (name: string, remarks?: string): Promise<QueueItem | null> => {
    try {
      const newItem = await addQueueItem(name, remarks);
      return newItem;
    } catch (err) {
      console.error('Registration failed:', err);
      setConnectionError(true);
      return null;
    }
  };

  // Update ticket status (PC) via Firestore
  const handleUpdateStatus = async (id: string, status: 'waiting' | 'called' | 'completed' | 'skipped') => {
    try {
      await updateQueueItemStatus(id, status);
    } catch (err) {
      console.error('Status update failed:', err);
      setConnectionError(true);
    }
  };

  // Reset queue (PC Action) via Firestore
  const handleReset = async () => {
    try {
      await resetQueue();
    } catch (err) {
      console.error('Queue reset failed:', err);
      setConnectionError(true);
    }
  };

  // Update penalty count for a practitioner/team (+1 or -1)
  const handleUpdatePenalty = async (name: string, delta: number) => {
    try {
      await updatePenaltyCount(name, delta);
    } catch (err) {
      console.error('Update penalty failed:', err);
    }
  };

  // Clear all penalty count for a practitioner/team
  const handleClearPenalty = async (name: string) => {
    try {
      await clearPenaltyCount(name);
    } catch (err) {
      console.error('Clear penalty failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Password Modal for PC Caller Screen Access */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 text-white"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    호출 스크린 접속 인증
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    [PC/TV] 관리자 및 호출 스크린에 접근하려면 비밀번호를 입력해주세요.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    비밀번호 (Password)
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(false);
                    }}
                    placeholder="비밀번호를 입력하세요..."
                    autoFocus
                    className={`w-full px-4 py-3 bg-slate-950 border rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition ${
                      passwordError
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-bold text-rose-400 flex items-center gap-1 pt-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      비밀번호가 올바르지 않습니다. 다시 확인해 주세요.
                    </motion.p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-sm transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    접속 승인
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* VIEW 1: Role Selection Portal Splash Screen */}
        {viewMode === 'select' && (
          <motion.div
            key="select-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full filter blur-3xl pointer-events-none" />

            <div className="max-w-2xl w-full text-center space-y-10 relative z-10">
              {/* Logo icon */}
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-900/40 inline-flex items-center justify-center animate-bounce duration-1000">
                  <Cpu className="w-12 h-12 text-white stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                    WRO Arena <span className="text-blue-400">Management</span> System
                  </h1>
                  <p className="text-sm md:text-base text-slate-400 font-medium">
                    World Robot Olympiad 연습 경기장의 혼잡을 줄이기 위한 스마트 로테이션 솔루션
                  </p>
                </div>
              </div>

              {/* Cloud Connection Status */}
              <div className="flex items-center justify-center gap-2">
                {connectionError ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-black">
                    <ServerCrash className="w-4 h-4 animate-pulse" />
                    클라우드 오프라인 (재시도 중...)
                  </span>
                ) : isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    실시간 클라우드 DB 연동 중
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-xs font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    클라우드 DB 연결 중...
                  </span>
                )}
              </div>

              {/* Selection cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
                {/* Mode Option 1: iPad Register */}
                <button
                  onClick={() => setViewMode('ipad')}
                  className="bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/60 hover:border-blue-500 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-left transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-950/50 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl inline-block group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <Tablet className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        [iPad] 연습팀 번호표 등록 패드
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        경기장 대기선 입구 태블릿에 설정하는 화면입니다. 이름이나 연습할 미션을 간편하게 기입하여 접수증을 출력합니다.
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-1.5 text-xs text-blue-400 font-extrabold group-hover:translate-x-1.5 transition-transform">
                    등록 화면 실행하기 <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Mode Option 2: PC Display Dashboard */}
                <button
                  onClick={handleSelectPcMode}
                  className="bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/60 hover:border-blue-500 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-left transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-950/50 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl inline-block group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <Tv className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        [PC/TV] 호출 스크린 & 코치 보드
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        강단 스크린이나 코치 컴퓨터 화면용입니다. 대기 현황을 한눈에 표시하며, 딩동 차임 소리와 TTS 음성으로 호명합니다.
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-1.5 text-xs text-blue-400 font-extrabold group-hover:translate-x-1.5 transition-transform">
                    대시보드 화면 실행하기 <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Arena Information Footer */}
              <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-600" />
                  <span>같은 네트워크의 다양한 기기(스마트폰, 아이패드, 노트북)에서 동시에 접속하여 실시간 연동됩니다.</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
                  title="잠금 / 로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  잠금
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: iPad Registration Panel */}
        {viewMode === 'ipad' && (
          <motion.div
            key="ipad-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <IpadRegister
              queue={queue}
              penalties={penalties}
              onBack={() => setViewMode('select')}
              onRegister={handleRegister}
            />
          </motion.div>
        )}

        {/* VIEW 3: PC Caller Screen Dashboard */}
        {viewMode === 'pc' && (
          <motion.div
            key="pc-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PcDashboard
              queue={queue}
              penalties={penalties}
              onBack={() => setViewMode('select')}
              onUpdateStatus={handleUpdateStatus}
              onRegister={handleRegister}
              onReset={handleReset}
              onUpdatePenalty={handleUpdatePenalty}
              onClearPenalty={handleClearPenalty}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
