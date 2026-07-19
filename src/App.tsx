import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tablet, Tv, Cpu, ShieldAlert, ArrowRight, RefreshCw, ServerCrash } from 'lucide-react';
import { QueueItem, ViewMode } from './types';
import IpadRegister from './components/IpadRegister';
import PcDashboard from './components/PcDashboard';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [lastNumber, setLastNumber] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Fetch current queue state from server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
        setLastNumber(data.lastNumber || 100);
        setIsConnected(true);
        setConnectionError(false);
      } else {
        throw new Error('API return non-ok status');
      }
    } catch (err) {
      console.error('Failed to fetch queue state:', err);
      setConnectionError(true);
    }
  };

  // Real-time updates subscription using Server-Sent Events (SSE) + robust active polling
  useEffect(() => {
    fetchState(); // Initial fetch

    // Always run backup polling every 3 seconds to ensure 100% reliability across any proxy, network, or iframe constraints
    const pollInterval = setInterval(fetchState, 3000);

    let eventSource: EventSource | null = null;

    // Try to connect to Server-Sent Events stream for instant push updates where supported
    try {
      eventSource = new EventSource('/api/queue/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(false);
        console.log('SSE real-time stream connected.');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setQueue(data.queue || []);
          setLastNumber(data.lastNumber || 100);
          setIsConnected(true);
        } catch (parseErr) {
          console.error('Error parsing SSE payload:', parseErr);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('SSE stream encountered an error. Relying on active polling.', err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    } catch (sseErr) {
      console.error('SSE initialization failed. Relying on active polling:', sseErr);
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }, []);

  // API Call: Register a new practitioner (iPad)
  const handleRegister = async (name: string, remarks?: string): Promise<QueueItem | null> => {
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, remarks }),
      });

      if (res.ok) {
        const newItem = await res.json();
        // Optimistically append locally for rapid iPad print feedback, avoiding duplicates
        setQueue((prev) => {
          if (prev.some((item) => item.id === newItem.id)) {
            return prev;
          }
          return [...prev, newItem];
        });
        return newItem;
      } else {
        const errData = await res.json();
        console.error('Registration failed on server:', errData.error);
        return null;
      }
    } catch (err) {
      console.error('Network error during registration:', err);
      return null;
    }
  };

  // API Call: Update queue status (PC)
  const handleUpdateStatus = async (id: string, status: 'waiting' | 'called' | 'completed' | 'skipped') => {
    try {
      const res = await fetch(`/api/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        // Optimistically update locally
        setQueue((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
      } else {
        console.error('Failed to update status on server');
      }
    } catch (err) {
      console.error('Network error during status update:', err);
    }
  };

  // API Call: Reset queue (PC)
  const handleReset = async () => {
    try {
      const res = await fetch('/api/queue/reset', {
        method: 'POST',
      });

      if (res.ok) {
        setQueue([]);
        setLastNumber(100);
      } else {
        console.error('Failed to reset queue on server');
      }
    } catch (err) {
      console.error('Network error during queue reset:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
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

              {/* Server Connection Status */}
              <div className="flex items-center justify-center gap-2">
                {connectionError ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-black">
                    <ServerCrash className="w-4 h-4 animate-pulse" />
                    서버 오프라인 (재시도 중...)
                  </span>
                ) : isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    System Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-xs font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    서버 상태 조회 중...
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
                  onClick={() => setViewMode('pc')}
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
              onBack={() => setViewMode('select')}
              onUpdateStatus={handleUpdateStatus}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
