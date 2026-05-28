import React from 'react';
import DurationSelector from './DurationSelector';

const ServiceCard = ({
  title,
  description,
  durations,
  selectedDuration,
  onSelectDuration,
  price,
  pricingUnit = 'pcs',
  isSelected = false,
  isDisabled = false,
  onToggleSelect,
  badge = '',
  icon = '🧺'
}) => {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-sm ${
        isSelected
          ? 'border-primary ring-4 ring-primary/10 shadow-md scale-[1.01]'
          : isDisabled
          ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed select-none'
          : 'border-slate-200/60 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="space-y-4">
        {/* Card Header & Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
              isSelected ? 'bg-blue-50' : 'bg-slate-50'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight leading-snug">
                {title}
              </h3>
              {badge && (
                <span className="inline-block mt-1 text-[9px] bg-blue-50 text-primary border border-blue-100 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
          {description || 'Layanan laundry premium bersih & wangi.'}
        </p>

        {/* Inline Duration Selector */}
        <div className="pt-2 border-t border-slate-100/60">
          <DurationSelector
            durations={durations}
            selectedDuration={selectedDuration}
            onSelect={onSelectDuration}
            disabled={isDisabled || isSelected}
          />
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Harga Estimasi</span>
          <div className="flex items-baseline gap-1">
            {price !== null && price !== undefined ? (
              <>
                <span className="text-lg font-black text-slate-800 transition-all">
                  {formatRupiah(price)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  /{pricingUnit}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-semibold italic">
                Pilih durasi dahulu
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={isDisabled || (!selectedDuration && !isSelected)}
          onClick={onToggleSelect}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all duration-200 ${
            isSelected
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-red-500/5'
              : !selectedDuration
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100'
              : 'bg-primary hover:bg-primary/95 text-white shadow-primary/10 hover:scale-102 hover:shadow'
          }`}
        >
          {isSelected ? 'Batalkan' : 'Pilih'}
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
