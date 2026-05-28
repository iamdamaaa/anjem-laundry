import React from 'react';

const ConfirmDialog = ({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      ></div>

      {/* Modal card container */}
      <div className="relative bg-white w-full max-w-sm rounded-card border border-slate-200 p-6 shadow-md transition-all duration-300 transform scale-100 flex flex-col gap-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            isDangerous ? 'bg-red-50 text-error' : 'bg-blue-50 text-primary'
          }`}>
            {isDangerous ? '🚨' : '❓'}
          </div>
          <h3 className="text-base font-extrabold text-brandText">{title}</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end items-center gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-brandText rounded-btn hover:bg-slate-100 transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white rounded-btn shadow-sm transition-all duration-200 ${
              isDangerous 
                ? 'bg-error hover:bg-red-600 shadow-red-500/10' 
                : 'bg-primary hover:bg-primary-hover shadow-blue-500/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
