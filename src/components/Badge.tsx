import { cn } from '@/lib/utils';

type Variant = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  green:  'bg-green-50  text-green-700  border-green-200',
  blue:   'bg-blue-50   text-blue-700   border-blue-200',
  amber:  'bg-amber-50  text-amber-700  border-amber-200',
  red:    'bg-red-50    text-red-600    border-red-200',
  gray:   'bg-gray-50   text-gray-600   border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function Badge({ children, variant = 'gray', className }: Props) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}
