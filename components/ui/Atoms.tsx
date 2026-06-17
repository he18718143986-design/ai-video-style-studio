
import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// --- BUTTON ATOM ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', isLoading, icon, className = '', disabled, ...props 
}) => {
  const baseStyle = "relative flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-150 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-transparent",
    secondary: "bg-studio-elevated text-studio-text-primary border border-studio-border hover:bg-studio-border hover:text-white",
    danger: "bg-status-error/10 text-status-error border border-status-error/30 hover:bg-status-error/20",
    ghost: "bg-transparent text-studio-text-muted hover:text-white hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {!isLoading && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// --- BADGE ATOM ---
interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const styles = {
    success: "text-status-success bg-status-success/10 border-status-success/20",
    warning: "text-status-warning bg-status-warning/10 border-status-warning/20",
    error: "text-status-error bg-status-error/10 border-status-error/20",
    info: "text-status-info bg-status-info/10 border-status-info/20",
    neutral: "text-studio-text-secondary bg-studio-elevated border-studio-border",
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-2xs font-mono font-bold uppercase tracking-wider border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- STATUS LED ATOM ---
export const StatusLed: React.FC<{ status: 'on' | 'off' | 'busy' | 'error', className?: string }> = ({ status, className = '' }) => {
  const colors = {
    on: "bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.8)]",
    off: "bg-studio-text-muted",
    busy: "bg-status-warning animate-pulse",
    error: "bg-status-error shadow-[0_0_8px_rgba(239,68,68,0.8)]"
  };
  
  return <div className={`w-1.5 h-1.5 rounded-full ${colors[status]} ${className}`}></div>;
};
