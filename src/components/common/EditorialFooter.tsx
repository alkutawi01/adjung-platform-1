import React from 'react';

interface EditorialFooterProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function EditorialFooter({ left, center, right, className = '' }: EditorialFooterProps) {
  return (
    <div className={`w-full flex items-end justify-between border-t border-stone-200 pt-4 mt-8 select-none ${className}`}>
      <div className="flex-1 text-left">
        {left}
      </div>
      {center && (
        <div className="flex-1 text-center">
          {center}
        </div>
      )}
      <div className="flex-1 flex justify-end">
        {right}
      </div>
    </div>
  );
}
