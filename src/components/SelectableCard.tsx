import React from 'react';

interface SelectableCardProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function SelectableCard({
  isSelected,
  onClick,
  children,
  style,
  className,
}: SelectableCardProps) {
  return (
    <div
      onClick={onClick}
      className={`card selectable-card ${className || ''}`}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isSelected 
          ? '2px solid var(--gold-500)' 
          : '1px solid var(--border)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
