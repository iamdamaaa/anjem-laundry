import React from 'react';

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-slate-200"></div>
        <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
        <div className="h-3 w-48 bg-slate-100 rounded-md"></div>
      </div>
    </div>
  );
};

export default PageSkeleton;
