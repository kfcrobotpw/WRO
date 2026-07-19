import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, User, MessageSquare, CheckCircle2, Users, ArrowLeft, Plus } from 'lucide-react';
import { QueueItem, DEFAULT_PRACTITIONERS } from '../types';

interface IpadRegisterProps {
  queue: QueueItem[];
  onBack: () => void;
  onRegister: (name: string, remarks?: string) => Promise<QueueItem | null>;
}

const PRESET_REMARKS = [
  '경기장 주행 연습',
  '로봇 하드웨어 점검',
  '센서 값 캘리브레이션',
  '기록 단축 미션 시도',
];

export default function IpadRegister({ queue, onBack, onRegister }: IpadRegisterProps) {
  const [selectedName, setSelectedName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [selectedRemark, setSelectedRemark] = useState<string>('');
  const [customRemark, setCustomRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState<QueueItem | null>(null);

  const waitingCount = queue.filter((item) => item.status === 'waiting').length;

  const getActiveName = () => {
    return selectedName === 'custom' ? customName : selectedName;
  };

  const getActiveRemark = () => {
    return selectedRemark === 'custom' ? customRemark : selectedRemark;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = getActiveName().trim();
    if (!finalName) return;

    setIsSubmitting(true);
    const remark = getActiveRemark().trim();
    
    const ticket = await onRegister(finalName, remark || undefined);
    setIsSubmitting(false);

    if (ticket) {
      setIssuedTicket(ticket);
      // Reset form
      setSelectedName('');
      setCustomName('');
      setSelectedRemark('');
      setCustomRemark('');

      // Auto-dismiss ticket after 4.5 seconds
      setTimeout(() => {
        setIssuedTicket(null);
      }, 4500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-6 md:p-12 relative overflow-hidden flex flex-col justify-between">
      {/* Upper background accent decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-50 -ml-20 -mb-20 pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all duration-200 group active:scale-95"
            title="모드 선택으로 돌아가기"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg text-sm font-black">WRO</span>
              연습 경기장 번호표 등록
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">연습자 이름을 선택하고 대기 번호표를 등록하세요.</p>
          </div>
        </div>

        {/* Realtime Waiting Count Info Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 shadow-sm">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-sm md:text-base">
            대기 팀 수: <strong className="text-lg font-black text-blue-700">{waitingCount}</strong>팀
          </span>
        </div>
      </div>

      {/* Main Registration Content Grid */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-8 items-stretch max-w-7xl mx-auto w-full">
        {/* Form Container */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleRegisterSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Step 1: Practitioner Selection Grid */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Step 1. 연습자 선택
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DEFAULT_PRACTITIONERS.map((name) => {
                  const isSelected = selectedName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSelectedName(name);
                      }}
                      className={`h-20 md:h-24 rounded-2xl border-2 text-base md:text-lg font-bold transition-all duration-200 flex flex-col items-center justify-center gap-2 active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300'}`} />
                      {name}
                    </button>
                  );
                })}

                {/* Custom input button trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedName('custom');
                  }}
                  className={`h-20 md:h-24 rounded-2xl border-2 text-base md:text-lg font-bold transition-all duration-200 flex flex-col items-center justify-center gap-2 active:scale-95 ${
                    selectedName === 'custom'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  기타 연습자
                </button>
              </div>

              {/* Animate-In Custom name input */}
              <AnimatePresence>
                {selectedName === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pt-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="연습자 이름을 직접 입력해 주세요..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-blue-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 font-bold text-lg text-slate-800 placeholder-slate-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Remarks/Intent selection */}
            <div className="space-y-3 pt-4">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Step 2. 연습 내용 선택 (선택 사항)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_REMARKS.map((remark) => {
                  const isSelected = selectedRemark === remark;
                  return (
                    <button
                      key={remark}
                      type="button"
                      onClick={() => {
                        setSelectedRemark(isSelected ? '' : remark);
                      }}
                      className={`p-4 rounded-xl border text-left text-sm md:text-base font-bold transition-all duration-200 flex items-center gap-3 active:scale-[0.98] ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-800'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      {remark}
                    </button>
                  );
                })}

                {/* Custom Remark Button Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRemark(selectedRemark === 'custom' ? '' : 'custom');
                  }}
                  className={`p-4 rounded-xl border text-left text-sm md:text-base font-bold transition-all duration-200 flex items-center gap-3 active:scale-[0.98] ${
                    selectedRemark === 'custom'
                      ? 'bg-blue-50 border-blue-500 text-blue-800'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Plus className="w-4 h-4 text-blue-500 shrink-0" />
                  연습 내용 직접 적기
                </button>
              </div>

              {/* Animate-In Custom remark input */}
              <AnimatePresence>
                {selectedRemark === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pt-2"
                  >
                    <input
                      type="text"
                      placeholder="구체적인 연습 내용을 써주세요 (예: 주행 모터 튜닝)..."
                      value={customRemark}
                      onChange={(e) => setCustomRemark(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium text-slate-800"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 3: Big Register Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={!getActiveName().trim() || isSubmitting}
                className={`w-full py-5 rounded-2xl font-black text-xl tracking-wide flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 shadow-md ${
                  !getActiveName().trim() || isSubmitting
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
                }`}
              >
                <Ticket className="w-6 h-6" />
                {isSubmitting ? '번호표 인쇄 중...' : '등록하고 대기 번호표 받기'}
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Sidebar with instructions & mini status list */}
        <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-blue-600" />
              현재 경기장 대기 팀
            </h3>

            {queue.filter((item) => item.status === 'waiting').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-slate-600 font-bold text-sm">대기 팀 없음</p>
                <p className="text-xs text-slate-400">지금 바로 연습 가능합니다!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const waitingItems = queue.filter((item) => item.status === 'waiting');
                  const seenIds = new Set<string>();
                  const uniqueWaiting: QueueItem[] = [];
                  for (const item of waitingItems) {
                    if (item && item.id && !seenIds.has(item.id)) {
                      seenIds.add(item.id);
                      uniqueWaiting.push(item);
                    }
                  }
                  return uniqueWaiting.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-600 font-extrabold text-xs px-1.5 py-0.5 bg-blue-50 rounded-md">
                            No.{item.number}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        </div>
                        {item.remarks && (
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">
                            {item.remarks}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.registeredAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-500 mb-1">🚨 대기 수칙</p>
            <p>1. 자신의 호명 번호가 PC 스크린에 뜰 때까지 로봇 점검 및 프로그램을 세팅해 주세요.</p>
            <p className="mt-1">2. 연습 호명 후 즉시 참석하지 않으면 다음 순번으로 전환될 수 있습니다.</p>
          </div>
        </div>
      </div>

      {/* Printed Ticket Interactive Backdrop & Voucher PopUp */}
      <AnimatePresence>
        {issuedTicket && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-3xl shadow-2xl border-4 border-dashed border-blue-600 max-w-sm w-full p-6 text-center relative overflow-hidden"
            >
              {/* Confetti decoration */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-600" />
              
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="p-3.5 bg-emerald-50 rounded-full border-2 border-emerald-500 text-emerald-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">대기 등록 완료!</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-black font-mono">
                  WRO Practice Queue Ticket
                </p>
              </div>

              {/* Realistic Voucher */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-2 text-center">
                <span className="text-xs font-semibold text-slate-400">당신의 대기 번호</span>
                <div className="text-5xl font-black text-blue-600 tracking-tighter my-2 font-mono">
                  {issuedTicket.number}
                </div>
                <div className="text-lg font-bold text-slate-800 mt-2">
                  {issuedTicket.name} 팀
                </div>
                {issuedTicket.remarks && (
                  <p className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block mt-2 font-semibold">
                    📌 {issuedTicket.remarks}
                  </p>
                )}
              </div>

              {/* Footer statistics */}
              <div className="text-xs text-slate-500 mt-4 space-y-1">
                <div>등록 시각: {new Date(issuedTicket.registeredAt).toLocaleTimeString('ko-KR')}</div>
                <div className="font-bold text-blue-600 mt-2 bg-blue-50 py-2.5 rounded-xl">
                  내 대기 차례: 앞의 <strong className="text-base font-extrabold">{waitingCount}</strong>명 대기 중
                </div>
              </div>

              <button
                onClick={() => setIssuedTicket(null)}
                className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-950 active:scale-95 text-white font-bold rounded-xl text-sm transition-all duration-150"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
