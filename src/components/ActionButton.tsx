import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon?: LucideIcon;
  label: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  onClick: () => void | Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActionButton({
  icon: Icon,
  label,
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
  onClick,
  size = 'md',
  className = '',
}: ActionButtonProps) {
  const sizeMap = {
    sm: { padding: '0.3rem 0.6rem', fontSize: '0.7rem', height: 0 },
    md: { padding: '0.5rem 1rem', fontSize: '0.85rem', minHeight: '40px' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '0.95rem', minHeight: '44px' },
  };

  const variantMap = {
    primary: 'btn btn-primary',
    danger: 'btn btn-ghost',
    ghost: 'btn btn-ghost',
  };

  const dangerStyle = variant === 'danger' ? { color: 'var(--danger)' } : {};

  return (
    <button
      className={`${variantMap[variant]} ${className}`}
      onClick={onClick}
      disabled={isDisabled || isLoading}
      style={{
        ...sizeMap[size],
        opacity: isDisabled || isLoading ? 0.5 : 1,
        cursor: isDisabled || isLoading ? 'not-allowed' : 'pointer',
        ...dangerStyle,
      }}
    >
      {isLoading ? (
        <>
          <div 
            className="spinner" 
            style={{ width: size === 'sm' ? 12 : 16, height: size === 'sm' ? 12 : 16, borderWidth: 1.5 }} 
          />
          {size !== 'sm' && <span>Carregando...</span>}
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 11 : 16} />}
          {size !== 'sm' && <span>{label}</span>}
          {size === 'sm' && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
