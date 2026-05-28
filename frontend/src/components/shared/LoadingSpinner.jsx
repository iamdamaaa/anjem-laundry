import React from 'react';

const LoadingSpinner = ({ message = 'Memuat data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse ring */}
        <div className="absolute w-16 h-16 rounded-full bg-blue-500/10 animate-ping"></div>
        {/* Intermediate spin ring */}
        <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-inner"></div>
      </div>
      {message && (
        <p className="mt-4 text-xs uppercase font-bold tracking-widest text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
