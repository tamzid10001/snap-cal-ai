import React from 'react';

export const Header = () => {
  return (
    <header className="w-full bg-background border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">SnapCal AI</h1>
        </div>
      </div>
    </header>
  );
};