import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Check,
  FastForward,
  RotateCcw,
  Users,
  CheckCircle,
  Bell,
  Trash2,
  Clock,
  ArrowLeft,
  XCircle,
  Megaphone,
  Sparkles,
  Settings,
  AlertTriangle,
  Siren,
  PackageCheck,
  Crown,
  Zap,
  UserCheck,
  Search,
  Plus,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { QueueItem, DEFAULT_PRACTITIONERS } from '../types';

// Helper to identify VIP practitioners who get 1st priority call placement
export const isVipItem = (item: QueueItem) => item.name === '박도현' || item.name.includes('박도현');

interface PcDashboardProps {
  queue: QueueItem[];
  penalties?: Record<string, number>;
  onBack: () => void;
  onUpdateStatus: (id: string, status: 'waiting' | 'called' | 'completed' | 'skipped') => Promise<void>;
  onRegister?: (name: string, remarks?: string) => Promise<QueueItem | null>;
  onReset: () => Promise<void>;
  onUpdatePenalty?: (name: string, delta: number) => Promise<void>;
  onClearPenalty?: (name: string) => Promise<void>;
}

// Safely instantiate and resume AudioContext for web browsers
function getActiveAudioCtx(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch((e) => console.warn('AudioContext resume error:', e));
    }
    return ctx;
  } catch (err) {
    console.error('AudioContext creation error:', err);
    return null;
  }
}

// Dynamically play Synthesized Web Audio API Chime (Ding-Dong)
function playDingDongChime() {
  try {
    const ctx = getActiveAudioCtx();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // "Ding" note - E5 (659Hz) and G5 (784Hz) for rich chord
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime);

    // "Dong" note after 0.3s - C5 (523Hz) and E5 (659Hz)
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime + 0.3);
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);

    // Fade out volume envelope
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 1.2);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (err) {
    console.error('Audio synthesizer failed to play:', err);
  }
}

// Dynamically play Synthesized Attention Bell (Extremely loud, long, and high-impact majestic chime)
function playAttentionBell() {
  try {
    const ctx = getActiveAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // --- STAGE 1: The Rising High-Impact Alarm Hook (0.0s to 0.4s) ---
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'triangle';
    sweepOsc.frequency.setValueAtTime(350, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(1500, now + 0.35);

    sweepGain.gain.setValueAtTime(0.01, now);
    sweepGain.gain.linearRampToValueAtTime(0.4, now + 0.15);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);

    sweepOsc.start(now);
    sweepOsc.stop(now + 0.45);

    // --- STAGE 2: The Epic Majestic Gong & Brass Chord (Impact starts at 0.3s) ---
    const impactTime = now + 0.28;

    const chordFrequencies = [110.00, 164.81, 261.63, 349.23, 440.00, 523.25, 698.46, 1174.66];

    chordFrequencies.forEach((freq, chordIdx) => {
      const noteStartTime = impactTime + (chordIdx * 0.015);
      
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const voiceGain = ctx.createGain();

      if (freq < 200) {
        oscA.type = 'sine';
        oscB.type = 'triangle';
      } else {
        oscA.type = 'triangle';
        oscB.type = 'sawtooth';
      }

      oscA.frequency.setValueAtTime(freq - 3, noteStartTime);
      oscB.frequency.setValueAtTime(freq + 3, noteStartTime);

      const baseVolume = freq < 200 ? 0.35 : 0.22;
      
      voiceGain.gain.setValueAtTime(0.001, noteStartTime);
      voiceGain.gain.linearRampToValueAtTime(baseVolume, noteStartTime + 0.08);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 2.5);

      oscA.connect(voiceGain);
      oscB.connect(voiceGain);
      voiceGain.connect(ctx.destination);

      oscA.start(noteStartTime);
      oscB.start(noteStartTime);

      oscA.stop(noteStartTime + 2.6);
      oscB.stop(noteStartTime + 2.6);
    });

  } catch (err) {
    console.error('Attention bell synthesizer failed to play:', err);
  }
}

// Dynamically play Synthesized Warning Alarm Sound (Sharp, urgent dual-tone siren blast)
function playWarningAlarmSound() {
  try {
    const ctx = getActiveAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bursts = [0, 0.18, 0.36, 0.54, 0.72];
    bursts.forEach((timeOffset, idx) => {
      const startTime = now + timeOffset;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      const freq = idx % 2 === 0 ? 1244.51 : 880.00;
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 0.5, startTime);

      osc1.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + 0.14);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + 0.17);
      osc2.stop(startTime + 0.17);
    });
  } catch (err) {
    console.error('Warning alarm synthesizer failed:', err);
  }
}

// Dynamically play Synthesized Cleanup & Robot Retrieval Chime (Bright 4-tone station announcement chime)
function playCleanupNoticeSound() {
  try {
    const ctx = getActiveAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.18;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 1.5, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + 0.65);
      osc2.stop(startTime + 0.65);
    });
  } catch (err) {
    console.error('Cleanup chime synthesizer failed:', err);
  }
}

// Helper to format team names into accurate Korean pronunciations for TTS
function formatPronunciation(text: string): string {
  return text
    .replace(/K\.?F\.?C\.?\s*Legend/gi, '케이에프씨 레전드')
    .replace(/K\.?F\.?C\.?\s*F=ma/gi, '케이에프씨 에프는엠에이')
    .replace(/K\.?F\.?C\.?\s*CodeChaser/gi, '케이에프씨 코드체이써');
}

// Text-to-Speech (TTS) Voice Call Function
function speakKorean(text: string) {
  if (!window.speechSynthesis) return;
  // Cancel current speech to prevent queuing lag
  window.speechSynthesis.cancel();

  const formattedText = formatPronunciation(text);
  const utterance = new SpeechSynthesisUtterance(formattedText);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.95; // Slightly slower for crisp robotics room echoes
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export default function PcDashboard({
  queue,
  penalties = {},
  onBack,
  onUpdateStatus,
  onRegister,
  onReset,
  onUpdatePenalty,
  onClearPenalty,
}: PcDashboardProps) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'called' | 'history'>('all');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltySearchInput, setPenaltySearchInput] = useState('');
  const [directCustomName, setDirectCustomName] = useState('');
  const [directCallToast, setDirectCallToast] = useState<string | null>(null);
  const [isDirectCalling, setIsDirectCalling] = useState(false);

  // Keep track of the last called ID to trigger automatic voice calling only when a new item is called
  const lastCalledIdRef = useRef<string | null>(null);

  // Separate lists (VIP '박도현' is prioritized unless penalized >= 3; teams with >=3 penalties are pushed to the very bottom)
  const waitingItems = queue
    .filter((item) => item.status === 'waiting')
    .sort((a, b) => {
      const aPen = penalties[a.name] || 0;
      const bPen = penalties[b.name] || 0;
      const aDemoted = aPen >= 3;
      const bDemoted = bPen >= 3;

      if (aDemoted && !bDemoted) return 1;
      if (!aDemoted && bDemoted) return -1;
      if (aDemoted && bDemoted) {
        if (aPen !== bPen) return aPen - bPen;
        return a.registeredAt - b.registeredAt;
      }

      const aVip = isVipItem(a);
      const bVip = isVipItem(b);
      if (aVip && !bVip) return -1;
      if (!aVip && bVip) return 1;
      return a.registeredAt - b.registeredAt;
    });
  const calledItems = queue.filter((item) => item.status === 'called');
  const historyItems = queue.filter((item) => item.status === 'completed' || item.status === 'skipped');

  // Currently called/active team on the main screen (newest called is featured)
  const currentCalled = calledItems.length > 0 
    ? [...calledItems].sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))[0] 
    : null;

  // Next waiting item
  const nextWaiting = waitingItems.length > 0 ? waitingItems[0] : null;

  // Automatically trigger Sound & Voice announcements when a new team is called
  useEffect(() => {
    if (currentCalled && currentCalled.id !== lastCalledIdRef.current) {
      lastCalledIdRef.current = currentCalled.id;
      
      // Play chime
      if (isSoundEnabled) {
        playDingDongChime();
      }

      // Delay TTS slightly to let the chime play first
      if (isVoiceEnabled) {
        setTimeout(() => {
          speakKorean(`띵동! ${currentCalled.name} 팀, ${currentCalled.name} 팀! 연습 경기장으로 입장해 주세요.`);
        }, 400);
      }
    } else if (!currentCalled) {
      lastCalledIdRef.current = null;
    }
  }, [currentCalled, isSoundEnabled, isVoiceEnabled]);

  const handleCallNext = async () => {
    if (nextWaiting) {
      await onUpdateStatus(nextWaiting.id, 'called');
    }
  };

  const handleDirectCallName = async (targetName: string) => {
    const trimmed = targetName.trim();
    if (!trimmed || isDirectCalling) return;

    setIsDirectCalling(true);
    try {
      // 1. First check if this practitioner is already waiting in queue
      const waitingMatch = queue.find(
        (item) => item.status === 'waiting' && item.name.trim() === trimmed
      );

      if (waitingMatch) {
        await onUpdateStatus(waitingMatch.id, 'called');
        setDirectCallToast(`'${waitingMatch.name}' 팀을 즉시 호명했습니다!`);
      } else {
        // 2. Check if they are currently called
        const calledMatch = queue.find(
          (item) => item.status === 'called' && item.name.trim() === trimmed
        );

        if (calledMatch) {
          if (isSoundEnabled) playDingDongChime();
          if (isVoiceEnabled) {
            setTimeout(() => {
              speakKorean(`다시 호명합니다. ${calledMatch.name} 팀, ${calledMatch.name} 팀, 연습 경기장으로 신속히 입장해 주세요.`);
            }, 400);
          }
          setDirectCallToast(`'${calledMatch.name}' 팀을 다시 호명했습니다!`);
        } else if (onRegister) {
          // 3. Not in queue or completed/skipped: auto-register and call
          const newItem = await onRegister(trimmed, '호출스크린 원클릭 호명');
          if (newItem && newItem.id) {
            await onUpdateStatus(newItem.id, 'called');
            setDirectCallToast(`'${trimmed}' 팀을 등록 후 즉시 호명했습니다!`);
          }
        }
      }
      setDirectCustomName('');
    } catch (err) {
      console.error('Direct call error:', err);
    } finally {
      setIsDirectCalling(false);
      setTimeout(() => {
        setDirectCallToast(null);
      }, 3500);
    }
  };

  const handleRecall = () => {
    if (currentCalled) {
      if (isSoundEnabled) playDingDongChime();
      if (isVoiceEnabled) {
        setTimeout(() => {
          speakKorean(`다시 호명합니다. ${currentCalled.name} 팀, ${currentCalled.name} 팀, 연습 경기장으로 신속히 입장해 주세요.`);
        }, 400);
      }
    }
  };

  const handleAttentionBellClick = () => {
    if (isSoundEnabled) {
      playAttentionBell();
    }
    if (isVoiceEnabled) {
      speakKorean("주목해 주시기 바랍니다. 안내 방송에 귀 기울여 주세요.");
    }
    setDirectCallToast('🔔 전체 대기열 주목 경보음(Bell)을 울렸습니다!');
  };

  const handleUrgeSpeedyAction = () => {
    if (isSoundEnabled) {
      playWarningAlarmSound();
    }

    if (isVoiceEnabled) {
      const message = currentCalled
        ? `경고 및 긴급 안내합니다! 현재 호명된 ${currentCalled.name} 팀! 연습 시간 지연으로 뒤에서 대기 중인 다른 팀들의 일정이 크게 밀리고 있습니다. 지체하지 말고 즉시 경기장에 입장하여 신속하게 연습과 미션을 마치고 퇴장해 주시기 바랍니다! 지금 즉시 신속히 진행해 주세요!`
        : `경고 및 긴급 안내합니다! 대기 중인 연습자가 많아 전체 일정 지연이 발생하고 있습니다! 현재 경기장에서 연습 중인 팀은 지체 없이 신속하게 마무리를 진행해 주시고, 호명된 다음 팀은 즉시 경기장으로 들어와 주시기 바랍니다!`;

      speakKorean(message);
    }
    setDirectCallToast('🚨 신속 진행 재촉 경고 방송을 송출했습니다!');
  };

  const handleCleanupNotice = () => {
    if (isSoundEnabled) {
      playCleanupNoticeSound();
    }

    if (isVoiceEnabled) {
      const message = currentCalled
        ? `안내 말씀 드립니다! 연습이 완료된 ${currentCalled.name} 팀은 경기장의 로봇을 차질 없이 회수해 가시고, 사용하신 경기장 기물과 미션 오브젝트를 원래 위치로 깔끔하게 정리정돈해 주시기 바랍니다!`
        : `안내 말씀 드립니다! 연습을 마친 모든 참가자는 경기장의 로봇을 빠짐없이 회수해 가시고, 사용하신 경기장 기물과 미션 오브젝트를 원래 위치로 깨끗하게 정리정돈해 주시기 바랍니다!`;

      speakKorean(message);
    }
    setDirectCallToast('🧹 로봇 회수 및 기물 정리정돈 안내 방송을 송출했습니다!');
  };

  const handleRegistrationRequiredNotice = () => {
    if (isSoundEnabled) {
      playDingDongChime();
    }

    if (isVoiceEnabled) {
      const message = `안내 말씀 드립니다! 경기장 이용은 반드시 대기 등록 후 순서에 맞춰 사용해 주시기 바랍니다! 대기 등록 없이 경기장에 입장하는 일이 없도록 참가자 여러분의 협조 부탁드립니다!`;
      speakKorean(message);
    }
    setDirectCallToast('📝 대기 등록 후 경기장 이용 안내 방송을 송출했습니다!');
  };

  const handleCompleteCurrent = async () => {
    if (currentCalled) {
      await onUpdateStatus(currentCalled.id, 'completed');
    }
  };

  const handleSkipCurrent = async () => {
    if (currentCalled) {
      await onUpdateStatus(currentCalled.id, 'skipped');
    }
  };

  const handleResetQueue = async () => {
    await onReset();
    setShowResetConfirm(false);
    lastCalledIdRef.current = null;
    if (isSoundEnabled) playDingDongChime();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-6 md:p-8 flex flex-col justify-between relative">
      {/* Sleek Dark Header Section - contrasting beautifully with light theme */}
      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-900 text-white rounded-2xl p-5 md:px-8 md:py-6 mb-6 shadow-md border border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-inner transition-all duration-150 active:scale-95 flex items-center justify-center"
            title="모드 선택으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-black tracking-wider">DISPLAY BOARD</span>
              WRO 실시간 경기장 현황판 & 호출기
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              경기장에 모니터를 연결하여 연습자 대기 현황을 깔끔하게 공유하며 호명 벨과 음성 안내를 제어합니다.
            </p>
          </div>
        </div>

        {/* Audio Toggles & reset */}
        <div className="flex items-center gap-3 bg-slate-800 p-1.5 rounded-xl border border-slate-700 shadow-inner">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              isSoundEnabled ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'
            }`}
            title="알림벨 소리 설정"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            알림벨 {isSoundEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              isVoiceEnabled ? 'bg-emerald-600 text-white' : 'hover:bg-slate-700 text-slate-400'
            }`}
            title="음성 안내 설정"
          >
            <Megaphone className="w-4 h-4" />
            음성 호출 {isVoiceEnabled ? 'ON' : 'OFF'}
          </button>
          <div className="w-px h-5 bg-slate-700 mx-0.5" />
          <button
            onClick={handleAttentionBellClick}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            title="전체 대기열 주목 벨 울리기"
          >
            <Bell className="w-4 h-4 text-white animate-bounce" />
            전체 주목 벨 🔔
          </button>
          <button
            onClick={handleUrgeSpeedyAction}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            title="신속 진행 강력 재촉 경고 방송"
          >
            <Siren className="w-4 h-4 text-amber-300 animate-pulse" />
            신속 재촉 🚨
          </button>
          <button
            onClick={handleCleanupNotice}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            title="연습 종료 후 로봇 회수 및 기물 정리 안내 방송"
          >
            <PackageCheck className="w-4 h-4 text-indigo-200" />
            로봇/기물 정리 🧹
          </button>
          <button
            onClick={handleRegistrationRequiredNotice}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/20 cursor-pointer"
            title="대기 등록 후 경기장 이용 안내 방송"
          >
            <ClipboardList className="w-4 h-4 text-sky-200" />
            대기 등록 안내 📝
          </button>
          <div className="w-px h-5 bg-slate-700 mx-0.5" />
          <button
            onClick={() => setShowPenaltyModal(true)}
            className="px-3 py-2 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/30 cursor-pointer border border-rose-500/40"
            title="팀별 패널티 부여 및 관리 모달 열기"
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            팀 패널티 관리 🚨
            {Object.values(penalties).filter((c) => c > 0).length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-rose-700 rounded-full text-[10px] font-black shadow-2xs">
                {Object.values(penalties).filter((c) => c > 0).length}팀
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Spectator display), Right (Facilitator controllers) */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-7xl w-full mx-auto">
        
        {/* Left 7 Columns: Giant Arena Board */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Call Card */}
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            {/* Elegant accent bar left side */}
            <div className="absolute top-0 left-0 w-1.5 bg-blue-600 h-full" />

            {/* Blinking Arena Call pulse dot */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-rose-600 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 bg-rose-600 rounded-full" />
              LIVE CALLING
            </div>

            <div className="text-slate-400 font-extrabold text-sm uppercase tracking-widest pl-1">
              📢 현재 경기장 연습 중인 팀
            </div>

            <AnimatePresence mode="wait">
              {currentCalled ? (
                <motion.div
                  key={currentCalled.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-10 md:py-14 text-center flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="p-6 bg-blue-50 border-4 border-blue-200 rounded-full text-blue-600 mb-6 shadow-sm"
                  >
                    <Megaphone className="w-16 h-16 md:w-24 md:h-24 animate-pulse" />
                  </motion.div>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tight flex items-center justify-center gap-3">
                    {currentCalled.name} 팀
                    {isVipItem(currentCalled) && (
                      <span className="px-3.5 py-1.5 bg-amber-400 text-amber-950 rounded-2xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-md animate-bounce">
                        <Crown className="w-4 h-4 fill-amber-950 text-amber-950" /> VIP
                      </span>
                    )}
                  </h2>
                  {currentCalled.remarks && (
                    <span className="mt-6 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-sm md:text-base font-semibold flex items-center gap-2 shadow-sm">
                      <Sparkles className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      미션: {currentCalled.remarks}
                    </span>
                  )}
                </motion.div>
              ) : (
                <div className="py-16 md:py-24 text-center flex flex-col items-center justify-center text-slate-400">
                  <Clock className="w-20 h-20 text-slate-300 stroke-[1.5] animate-spin" style={{ animationDuration: '12s' }} />
                  <p className="text-xl font-bold text-slate-800 mt-6">경기장이 비어있습니다</p>
                  <p className="text-sm text-slate-500 mt-1">우측 대기열이나 [다음 팀 호명하기]로 새로운 팀을 호출하세요.</p>
                </div>
              )}
            </AnimatePresence>

            {/* Calling Action Tray for arena & broadcast controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <div>
                  {currentCalled ? (
                    <>
                      호출 시각:{' '}
                      <strong className="text-slate-800 font-semibold">
                        {new Date(currentCalled.calledAt || Date.now()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </strong>
                    </>
                  ) : (
                    '실시간 긴급 방송 및 경기장 전체 알림 제어'
                  )}
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  {currentCalled ? `현재 팀: ${currentCalled.name}` : '경기장 대기 모드'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full">
                {/* Always active broadcast buttons */}
                <button
                  onClick={handleAttentionBellClick}
                  className="flex-1 min-w-[100px] px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="전체를 주목시키는 경보음 울리기"
                >
                  <Bell className="w-4 h-4 text-white animate-bounce" />
                  전체 주목 벨 🔔
                </button>
                <button
                  onClick={handleUrgeSpeedyAction}
                  className="flex-1 min-w-[100px] px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="신속 진행 강력 경고 재촉"
                >
                  <Siren className="w-4 h-4 text-amber-300 animate-pulse" />
                  신속 재촉 🚨
                </button>
                <button
                  onClick={handleCleanupNotice}
                  className="flex-1 min-w-[110px] px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="로봇 회수 및 경기장 기물 정리정돈 안내"
                >
                  <PackageCheck className="w-4 h-4 text-indigo-200" />
                  로봇/기물 정리 🧹
                </button>
                <button
                  onClick={handleRegistrationRequiredNotice}
                  className="flex-1 min-w-[110px] px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="대기 등록 후 경기장 이용 안내 방송"
                >
                  <ClipboardList className="w-4 h-4 text-sky-200" />
                  대기 등록 안내 📝
                </button>

                {/* Called team specific actions */}
                {currentCalled && (
                  <>
                    <button
                      onClick={handleRecall}
                      className="flex-1 min-w-[90px] px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 rounded-xl text-xs font-bold text-slate-800 border border-slate-300 flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-amber-600" />
                      재호출
                    </button>
                    <button
                      onClick={handleSkipCurrent}
                      className="flex-1 min-w-[90px] px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-xl text-xs font-bold text-rose-700 border border-rose-200 flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      부재/스킵
                    </button>
                    <button
                      onClick={handleCompleteCurrent}
                      className="flex-1 min-w-[100px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      연습 완료
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
 
          {/* Up Next & Status stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Up Next Preview Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">NEXT UP • 다음 연습 예정자</p>
                {nextWaiting ? (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <span className="text-lg font-bold text-slate-900">{nextWaiting.name}</span>
                    {isVipItem(nextWaiting) && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 flex items-center gap-1 shadow-sm animate-pulse">
                        <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" /> VIP 1순위
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm font-bold mt-2">대기 중인 다음 팀 없음</p>
                )}
              </div>
              {nextWaiting && (
                <button
                  onClick={handleCallNext}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1 active:scale-95 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  즉시 호출
                </button>
              )}
            </div>

            {/* Arena Waiting metrics count */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">QUEUE SIZE • 실시간 대기현황</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-black text-slate-900">{waitingItems.length}</span>
                  <span className="text-xs text-slate-500 font-medium">팀 대기 중</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Controller, Waitlist and logs */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between overflow-hidden shadow-sm">
          {/* Section Header & Admin Controls */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                대기열 및 호출 제어판
              </h3>
              
              {/* Reset queue */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="p-2 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 text-rose-600 rounded-lg transition shadow-sm"
                title="번호판 전체 초기화"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Next queue action block */}
            <button
              onClick={handleCallNext}
              disabled={!nextWaiting}
              className={`w-full py-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                nextWaiting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
              }`}
            >
              <Megaphone className="w-4.5 h-4.5" />
              {nextWaiting ? `순서대로 다음 팀 호명하기 (${nextWaiting.name})` : '대기 중인 팀이 없습니다'}
            </button>
          </div>

          {/* Direct Name Selection Quick Call Box */}
          <div className="p-3.5 bg-blue-50/70 border-b border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600 fill-blue-600 animate-pulse" />
                이름 선택 즉시 호출 (원클릭)
              </span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                클릭 시 바로 호명
              </span>
            </div>

            {/* Practitioner Quick Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEFAULT_PRACTITIONERS.map((pName) => {
                const isWaiting = waitingItems.some((i) => i.name === pName || i.name.includes(pName));
                const isCalled = calledItems.some((i) => i.name === pName || i.name.includes(pName));
                const isVip = pName === '박도현';
                const penaltyCount = penalties[pName] || 0;

                return (
                  <div key={pName} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <button
                      onClick={() => handleDirectCallName(pName)}
                      disabled={isDirectCalling}
                      className={`py-2 px-2 text-xs font-extrabold transition-all duration-150 flex flex-col items-center justify-center gap-0.5 active:scale-95 border-b ${
                        isCalled
                          ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-sm'
                          : isWaiting
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                          : isVip
                          ? 'bg-amber-50 border-amber-200 text-slate-900'
                          : 'bg-white border-slate-100 hover:bg-blue-50/50 text-slate-800'
                      }`}
                      title={`${pName} 팀 즉시 호출`}
                    >
                      <div className="flex items-center gap-1">
                        {isVip && <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />}
                        <span className="truncate">{pName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold ${isWaiting ? 'text-blue-100' : isCalled ? 'text-amber-800' : 'text-slate-400'}`}>
                          {isCalled ? '🔥 호출중' : isWaiting ? '⏳ 대기중' : '⚡ 즉시호출'}
                        </span>
                        {penaltyCount > 0 && (
                          <span className="px-1 py-0.2 bg-rose-600 text-white rounded text-[8px] font-black animate-pulse">
                            🚨 {penaltyCount}회
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Quick Penalty Actions (+ / - / 0) */}
                    <div className="flex items-center justify-between px-1.5 py-1 bg-slate-50 text-[10px]">
                      <span className="text-[9px] font-black text-slate-400">패널티</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePenalty?.(pName, 1);
                          }}
                          className="w-4 h-4 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black rounded text-[10px] flex items-center justify-center transition"
                          title="패널티 +1회 부여"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdatePenalty?.(pName, -1);
                          }}
                          className="w-4 h-4 bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded text-[10px] flex items-center justify-center transition"
                          title="패널티 -1회 차감"
                        >
                          -
                        </button>
                        {penaltyCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearPenalty?.(pName);
                            }}
                            className="px-1 h-4 bg-slate-300 hover:bg-slate-400 text-slate-800 font-black text-[8px] rounded flex items-center justify-center transition"
                            title="패널티 0회 초기화"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Name Direct Call Input */}
            <div className="flex gap-1.5 pt-0.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="팀/연습자 이름 직접 입력..."
                  value={directCustomName}
                  onChange={(e) => setDirectCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDirectCallName(directCustomName);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
              <button
                onClick={() => handleDirectCallName(directCustomName)}
                disabled={!directCustomName.trim() || isDirectCalling}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition shadow-sm active:scale-95 shrink-0"
              >
                <Megaphone className="w-3.5 h-3.5" />
                호출
              </button>
            </div>
          </div>

          {/* List category tabs */}
          <div className="px-4 pt-3 bg-slate-50 border-b border-slate-100 flex gap-1">
            {(['all', 'waiting', 'called', 'history'] as const).map((tab) => {
              const tabLabels = {
                all: '전체',
                waiting: `대기 (${waitingItems.length})`,
                called: `호출 (${calledItems.length})`,
                history: `기록 (${historyItems.length})`,
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg font-extrabold shadow-sm'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>

          {/* Actual items list container */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[380px] lg:max-h-[500px] min-h-[250px] bg-slate-50/50 space-y-2">
            <AnimatePresence initial={false}>
              {(() => {
                let itemsToShow = queue;
                if (activeTab === 'waiting') itemsToShow = waitingItems;
                else if (activeTab === 'called') itemsToShow = calledItems;
                else if (activeTab === 'history') itemsToShow = historyItems;

                if (itemsToShow.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 font-bold text-sm">
                      대기 기록이 존재하지 않습니다.
                    </div>
                  );
                }

                // Sort with VIP priority first for waiting items, then penalty demotion (>=3), then registration order
                const sortedItems = [...itemsToShow].sort((a, b) => {
                  if (a.status === 'waiting' && b.status === 'waiting') {
                    const aPen = penalties[a.name] || 0;
                    const bPen = penalties[b.name] || 0;
                    const aDemoted = aPen >= 3;
                    const bDemoted = bPen >= 3;

                    if (aDemoted && !bDemoted) return 1;
                    if (!aDemoted && bDemoted) return -1;
                    if (aDemoted && bDemoted) {
                      if (aPen !== bPen) return aPen - bPen;
                      return a.registeredAt - b.registeredAt;
                    }

                    const aVip = isVipItem(a);
                    const bVip = isVipItem(b);
                    if (aVip && !bVip) return -1;
                    if (!aVip && bVip) return 1;
                  }
                  if (a.status === 'waiting' && b.status !== 'waiting') return -1;
                  if (a.status !== 'waiting' && b.status === 'waiting') return 1;
                  return a.registeredAt - b.registeredAt;
                });

                // Defensively filter out duplicate item.ids
                const uniqueSortedItems: QueueItem[] = [];
                const seenIds = new Set<string>();
                for (const item of sortedItems) {
                  if (item && item.id && !seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    uniqueSortedItems.push(item);
                  }
                }

                return uniqueSortedItems.map((item) => {
                  // Style colors based on item status
                  let statusBg = 'bg-white border-slate-200 text-slate-800';
                  let badge = <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500">대기</span>;

                  if (item.status === 'called') {
                    statusBg = 'bg-blue-50/50 border-blue-200 text-blue-900';
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white animate-pulse">호명 중</span>;
                  } else if (item.status === 'completed') {
                    statusBg = 'bg-emerald-50/40 border-emerald-100 text-emerald-800';
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">완료</span>;
                  } else if (item.status === 'skipped') {
                    statusBg = 'bg-rose-50/40 border-rose-100 text-rose-800';
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">부재</span>;
                  }

                  const itemPenalty = penalties[item.name] || 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      layout
                      className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm transition ${statusBg}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {item.name}
                          </span>
                          {isVipItem(item) && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-amber-950 flex items-center gap-0.5 shadow-sm">
                              <Crown className="w-3 h-3 fill-amber-950 text-amber-950" /> VIP 1순위
                            </span>
                          )}
                          {badge}
                          {itemPenalty > 0 && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shadow-2xs ${
                              itemPenalty >= 3 ? 'bg-rose-700 text-amber-200' : 'bg-rose-600 text-white'
                            }`}>
                              <ShieldAlert className="w-3 h-3 text-amber-300" />
                              패널티 {itemPenalty}회 {itemPenalty >= 3 && item.status === 'waiting' && '(최하단 순서)'}
                            </span>
                          )}
                        </div>
                        {item.remarks && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            📝 {item.remarks}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>등록: {new Date(item.registeredAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {item.calledAt && (
                            <span>• 호출: {new Date(item.calledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>

                      {/* Manual individual control buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end flex-wrap">
                        {/* Quick Penalty controls on item */}
                        <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-1.5 py-1 rounded-lg mr-1">
                          <span className="text-[9px] font-bold text-slate-500">패널티</span>
                          <button
                            type="button"
                            onClick={() => onUpdatePenalty?.(item.name, 1)}
                            className="w-4 h-4 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black rounded text-[10px] flex items-center justify-center transition"
                            title={`${item.name} 팀 패널티 +1회`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdatePenalty?.(item.name, -1)}
                            className="w-4 h-4 bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded text-[10px] flex items-center justify-center transition"
                            title={`${item.name} 팀 패널티 -1회`}
                          >
                            -
                          </button>
                        </div>

                        {item.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(item.id, 'called')}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                              title="바로 호출"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              호출
                            </button>
                            <button
                              onClick={() => onUpdateStatus(item.id, 'skipped')}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition border border-slate-200 shadow-sm"
                              title="부재 처리"
                            >
                              스킵
                            </button>
                          </>
                        )}
                        {item.status === 'called' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(item.id, 'completed')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              완료
                            </button>
                            <button
                              onClick={() => onUpdateStatus(item.id, 'waiting')}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition border border-slate-200"
                            >
                              대기로 리턴
                            </button>
                          </>
                        )}
                        {(item.status === 'completed' || item.status === 'skipped') && (
                          <button
                              onClick={() => onUpdateStatus(item.id, 'waiting')}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition border border-slate-200 flex items-center gap-1"
                            title="대기열로 다시 복귀"
                          >
                            <RotateCcw className="w-3 h-3" />
                            복원
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </AnimatePresence>
          </div>

          {/* Quick Arena statistics Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <div>전체 등록: {queue.length}회</div>
            <div>완료 팀: {queue.filter(i => i.status === 'completed').length}팀</div>
            <div>부재 팀: {queue.filter(i => i.status === 'skipped').length}팀</div>
          </div>
        </div>
      </div>

      {/* Safety Reset Confirmation PopUp Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 max-w-sm w-full p-6 rounded-2xl text-center shadow-xl"
            >
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-full inline-block mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">연습 대기열 전체 초기화</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                정말로 전체 대기열을 완전히 삭제하고 리셋하시겠습니까?<br />
                <strong className="text-rose-600 font-bold">이 작업은 취소할 수 없습니다.</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition active:scale-95"
                >
                  취소하기
                </button>
                <button
                  onClick={handleResetQueue}
                  className="py-3 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white transition active:scale-95 shadow-md shadow-rose-100"
                >
                  네, 초기화합니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Penalty Management Full Modal */}
      <AnimatePresence>
        {showPenaltyModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 max-w-2xl w-full p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">🚨 경기장 팀별 패널티 관리</h3>
                    <p className="text-xs text-slate-500">각 팀에게 패널티를 부여하거나 차감/초기화할 수 있습니다.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPenaltyModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition"
                >
                  ✕
                </button>
              </div>

              {/* Info banner */}
              <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 font-medium leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>패널티 주의 연동 안내:</strong> 패널티가 부여된 팀이 iPad 대기판에서 등록을 시도하면 <span className="text-rose-700 font-black font-underline">"패널티 누적 주의 및 이용수칙 준수"</span> 경고 알림창이 자동으로 표시됩니다.
                </div>
              </div>

              {/* Add Custom Penalty Name Search Input */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="팀/연습자 이름 입력 (예: K.F.C. Legend, 배지훈...)"
                    value={penaltySearchInput}
                    onChange={(e) => setPenaltySearchInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                {penaltySearchInput.trim() && (
                  <button
                    onClick={() => {
                      if (penaltySearchInput.trim()) {
                        onUpdatePenalty?.(penaltySearchInput.trim(), 1);
                        setPenaltySearchInput('');
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shrink-0 transition"
                  >
                    + 패널티 1회 부여
                  </button>
                )}
              </div>

              {/* Team list with penalty status & controls */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {(() => {
                  // Unique set of team names: DEFAULT_PRACTITIONERS + any from penalties + queue
                  const allKnownNamesSet = new Set<string>([
                    ...DEFAULT_PRACTITIONERS,
                    ...Object.keys(penalties),
                    ...queue.map((q) => q.name),
                  ]);

                  const filteredNames = Array.from(allKnownNamesSet).filter((name) =>
                    name.toLowerCase().includes(penaltySearchInput.toLowerCase().trim())
                  );

                  if (filteredNames.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-400 font-bold text-xs">
                        검색된 팀이 없습니다.
                      </div>
                    );
                  }

                  return filteredNames.map((tName) => {
                    const pCount = penalties[tName] || 0;
                    return (
                      <div
                        key={tName}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                          pCount > 0
                            ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                            : 'bg-slate-50/60 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {tName}
                          </span>
                          {pCount > 0 ? (
                            <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-xs font-black animate-pulse flex items-center gap-1 shadow-xs">
                              🚨 패널티 {pCount}회
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                              패널티 없음 (0회)
                            </span>
                          )}
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onUpdatePenalty?.(tName, 1)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1"
                            title="패널티 +1회 부여"
                          >
                            +1 부여
                          </button>
                          <button
                            onClick={() => onUpdatePenalty?.(tName, -1)}
                            disabled={pCount <= 0}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl transition"
                            title="패널티 -1회 차감"
                          >
                            -1 차감
                          </button>
                          {pCount > 0 && (
                            <button
                              onClick={() => onClearPenalty?.(tName)}
                              className="px-2.5 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-black text-xs rounded-xl transition"
                              title="패널티 0회로 초기화"
                            >
                              초기화
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowPenaltyModal(false)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-950 text-white font-black text-xs rounded-2xl transition"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Direct Call Floating Toast Notification */}
      <AnimatePresence>
        {directCallToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 font-extrabold text-sm"
          >
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Megaphone className="w-4 h-4 animate-bounce" />
            </div>
            <span className="text-slate-100">{directCallToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
