interface Props {
  value: number; // 0-100
  className?: string;
}

export default function ProgressBar({ value, className = '' }: Props) {
  const color =
    value === 100 ? 'bg-emerald-500' :
    value >= 75   ? 'bg-blue-500'    :
    value >= 40   ? 'bg-amber-400'   :
                    'bg-red-500';

  return (
    <div className={`w-full bg-emerald-100/70 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-2 rounded-full transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
