import React from 'react';

const DurationSelector = ({ durations, selectedDuration, onSelect, disabled = false }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Pilih Durasi Layanan <span className="text-red-500">*</span>
        </span>
        {selectedDuration && (
          <span className="text-[10px] bg-blue-50 text-primary font-bold px-2 py-0.5 rounded-full border border-blue-100">
            Terpilih: {selectedDuration}
          </span>
        )}
      </div>

      {/* Pill Buttons Horizontal Scroll Container */}
      <div className="flex overflow-x-auto gap-2 py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {durations.map((duration) => {
          const isSelected = selectedDuration === duration;
          return (
            <button
              key={duration}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(duration)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 border select-none ${
                disabled
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  : isSelected
                  ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-102'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {duration}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DurationSelector;
