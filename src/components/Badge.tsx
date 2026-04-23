import { cn } from '@/lib/utils';

type Variant = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  green:  'bg-emerald-100 text-emerald-800 border-emerald-200',
  blue:   'bg-blue-100   text-blue-800   border-blue-200',
  amber:  'bg-amber-100  text-amber-800  border-amber-200',
  red:    'bg-red-100    text-red-700    border-red-200',
  gray:   'bg-slate-100  text-slate-600  border-slate-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function Badge({ children, variant = 'gray', className }: Props) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', variants[variant], className)}>
      {children}
    </span>
  );
}
