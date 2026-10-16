import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    success: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    danger: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    info: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const dotColors = {
    primary: 'bg-blue-500',
    success: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
    info: 'bg-cyan-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight',
    md: 'text-[11px] px-2.5 py-0.5 font-bold uppercase tracking-tight',
    lg: 'text-xs px-3 py-1 font-bold uppercase tracking-tight',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
