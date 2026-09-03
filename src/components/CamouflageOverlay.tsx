import React, { useState } from 'react';
import { CamouflageMode } from '../types';

interface CamouflageOverlayProps {
  mode: CamouflageMode;
  onExit: () => void;
}

export const CamouflageOverlay: React.FC<CamouflageOverlayProps> = ({ mode, onExit }) => {
  const [tapCount, setTapCount] = useState(0);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  if (mode === 'none') return null;

  const handleSyncedClick = () => {
    if (tapCount >= 1) {
      onExit();
    } else {
      setTapCount(1);
      setTimeout(() => setTapCount(0), 2200);
    }
  };

  // Simple calculator handlers
  const handleNum = (n: string) => {
    setCalcDisplay((prev) => (prev === '0' ? n : prev + n));
  };

  const handleOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcDisplay('0');
  };

  const handleEqual = () => {
    if (calcPrev !== null && calcOp) {
      const current = parseFloat(calcDisplay);
      let res = 0;
      if (calcOp === '+') res = calcPrev + current;
      if (calcOp === '-') res = calcPrev - current;
      if (calcOp === '×') res = calcPrev * current;
      if (calcOp === '÷') res = current !== 0 ? calcPrev / current : 0;
      setCalcDisplay(String(res));
      setCalcPrev(null);
      setCalcOp(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF7F0] text-[#1d1c15] flex flex-col px-5 pt-12 pb-safe overflow-y-auto">
      {mode === 'pantry' && (
        <div className="max-w-md mx-auto w-full flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#E3D8CC]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C47A5C] text-[26px]">local_mall</span>
              <h2 className="font-serif text-[20px] font-bold text-[#1d1c15]">Daily Pantry List</h2>
            </div>
            <button
              onClick={handleSyncedClick}
              className="text-[#8a4b30] hover:text-[#C47A5C] text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2EDE2] border border-[#D8C2BA] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">sync</span>
              <span>{tapCount === 1 ? 'Tap once more' : 'Synced'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 mt-5">
            {[
              { text: 'Basmati Rice (5kg bag)', checked: true },
              { text: 'Organic Turmeric & Cumin', checked: true },
              { text: 'Sunflower Oil (1L bottle)', checked: false },
              { text: 'Whole Wheat Atta Flour', checked: false },
              { text: 'Ginger & Fresh Mint Leaves', checked: false },
              { text: 'Coriander seeds & Black pepper', checked: true },
              { text: 'Milk & Paneer (Dairy fresh)', checked: false },
            ].map((item, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-[#E3D8CC] shadow-2xs cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-5 h-5 rounded accent-[#C47A5C] cursor-pointer"
                />
                <span className={`text-[14px] ${item.checked ? 'text-[#7A7067] line-through' : 'text-[#1d1c15] font-medium'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-[#F2EDE2] border border-[#E3D8CC] text-[#53433d] text-xs text-center">
            <p className="font-semibold text-[#1d1c15] text-[13px]">Weekly Grocery Budget: ₹ 1,450 / ₹ 2,000</p>
            <p className="text-[11px] opacity-75 mt-1.5">Tap 'Synced' twice or tap here to resume your previous sanctuary session.</p>
            <button
              onClick={onExit}
              className="mt-3 px-4 py-1.5 rounded-full bg-white border border-[#D8C2BA] text-[#8a4b30] text-[11px] font-semibold hover:bg-[#FAF7F0]"
            >
              Resume Sanctuary
            </button>
          </div>
        </div>
      )}

      {mode === 'weather' && (
        <div className="max-w-md mx-auto w-full flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#E3D8CC]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C47A5C] text-[26px]">wb_sunny</span>
              <h2 className="font-serif text-[20px] font-bold text-[#1d1c15]">Daily Weather</h2>
            </div>
            <button
              onClick={handleSyncedClick}
              className="text-[#8a4b30] hover:text-[#C47A5C] text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2EDE2] border border-[#D8C2BA] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>{tapCount === 1 ? 'Tap once more' : 'Updated'}</span>
            </button>
          </div>

          <div className="mt-5 p-6 rounded-2xl bg-white border border-[#E3D8CC] shadow-xs text-center flex flex-col items-center">
            <span className="text-xs text-[#6E775C] font-semibold uppercase tracking-wider">Kolkata, WB • Mostly Sunny</span>
            <div className="flex items-center justify-center gap-3 my-3">
              <span className="material-symbols-outlined text-[54px] text-amber-500">sunny</span>
              <span className="text-5xl font-light text-[#1d1c15]">28°C</span>
            </div>
            <p className="text-xs text-[#635952]">Humidity 62% • Gentle breeze 8 km/h • Air Quality: Good (42 AQI)</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { day: 'Wed', icon: 'sunny', temp: '29°' },
              { day: 'Thu', icon: 'partly_cloudy_day', temp: '27°' },
              { day: 'Fri', icon: 'cloud', temp: '26°' },
              { day: 'Sat', icon: 'rainy', temp: '25°' },
            ].map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-[#E3D8CC] flex flex-col items-center text-center">
                <span className="text-xs text-[#7A7067] font-medium">{f.day}</span>
                <span className="material-symbols-outlined text-[24px] text-[#C47A5C] my-1">{f.icon}</span>
                <span className="text-xs font-semibold text-[#1d1c15]">{f.temp}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onExit}
              className="text-xs text-[#8a4b30] underline hover:text-[#C47A5C]"
            >
              Restore Screen
            </button>
          </div>
        </div>
      )}

      {mode === 'calc' && (
        <div className="max-w-xs mx-auto w-full flex flex-col mt-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3D8CC] mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6E775C] text-[22px]">calculate</span>
              <h2 className="text-sm font-semibold text-[#1d1c15]">Calculator</h2>
            </div>
            <button
              onClick={onExit}
              className="text-[11px] text-[#8a4b30] hover:underline"
            >
              Exit
            </button>
          </div>

          <div className="w-full bg-white rounded-2xl p-4 border border-[#E3D8CC] shadow-sm mb-4 text-right">
            <span className="text-3xl font-mono text-[#1d1c15]">{calcDisplay}</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {['C', '±', '%', '÷'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') {
                    setCalcDisplay('0');
                    setCalcPrev(null);
                    setCalcOp(null);
                  } else if (btn === '÷') {
                    handleOp('÷');
                  }
                }}
                className="h-12 rounded-xl bg-[#F2EDE2] font-semibold text-sm hover:bg-[#EAE4D7] active:scale-95"
              >
                {btn}
              </button>
            ))}
            {['7', '8', '9', '×'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '×' ? handleOp('×') : handleNum(btn))}
                className={`h-12 rounded-xl font-semibold text-sm active:scale-95 ${
                  btn === '×' ? 'bg-[#E7B9B2] text-[#482618]' : 'bg-white border border-[#E3D8CC]'
                }`}
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', '-'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '-' ? handleOp('-') : handleNum(btn))}
                className={`h-12 rounded-xl font-semibold text-sm active:scale-95 ${
                  btn === '-' ? 'bg-[#E7B9B2] text-[#482618]' : 'bg-white border border-[#E3D8CC]'
                }`}
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => (btn === '+' ? handleOp('+') : handleNum(btn))}
                className={`h-12 rounded-xl font-semibold text-sm active:scale-95 ${
                  btn === '+' ? 'bg-[#E7B9B2] text-[#482618]' : 'bg-white border border-[#E3D8CC]'
                }`}
              >
                {btn}
              </button>
            ))}
            <button
              onClick={() => handleNum('0')}
              className="col-span-2 h-12 rounded-xl bg-white border border-[#E3D8CC] font-semibold text-sm active:scale-95"
            >
              0
            </button>
            <button
              onClick={() => handleNum('.')}
              className="h-12 rounded-xl bg-white border border-[#E3D8CC] font-semibold text-sm active:scale-95"
            >
              .
            </button>
            <button
              onClick={handleEqual}
              className="h-12 rounded-xl bg-[#C47A5C] text-white font-semibold text-sm active:scale-95 shadow-xs"
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
