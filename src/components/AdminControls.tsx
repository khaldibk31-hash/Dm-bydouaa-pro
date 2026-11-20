import { ChangeEvent, MouseEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Tone = 'light' | 'dark' | 'danger' | 'accent';

const TONES: Record<Tone, string> = {
  light: 'bg-white text-[#1f1917] border-[#e6ddd3] hover:border-[#762b43] hover:text-[#762b43]',
  dark: 'bg-[#1f1917] text-white border-[#1f1917] hover:bg-[#3a312d]',
  danger: 'bg-white text-red-700 border-red-200 hover:bg-red-50',
  accent: 'bg-[#762b43] text-white border-[#762b43] hover:bg-[#581e31]',
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 min-h-9 px-3 rounded-xl border text-xs font-bold shadow-sm transition-colors cursor-pointer select-none whitespace-nowrap active:scale-[0.98]';

interface AdminButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: Tone;
  className?: string;
}

export function AdminButton({ icon: Icon, label, onClick, tone = 'light', className = '' }: AdminButtonProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${BASE} ${TONES[tone]} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

interface AdminUploadButtonProps {
  icon: LucideIcon;
  label: string;
  onFile: (file: File) => void;
  tone?: Tone;
  className?: string;
}

export function AdminUploadButton({ icon: Icon, label, onFile, tone = 'light', className = '' }: AdminUploadButtonProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) onFile(file);
    e.target.value = '';
  };
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      className={`${BASE} ${TONES[tone]} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
      <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
    </label>
  );
}

export function AdminToolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      data-no-inline-edit
      className={`flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-[#fbf3f5] border border-dashed border-[#762b43]/30 ${className}`}
    >
      {children}
    </div>
  );
}
