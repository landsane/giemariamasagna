interface Props {
  value: number; // 0-100
  className?: string;
}

export default function ProgressBar({ value, className = '' }: Props) {
  const color =
    value === 100 ? 'bg-green-500' :
    value >= 75   ? 'bg-blue-500'  :
    value >= 40   ? 'bg-amber-400' :
                    'bg-red-400';

  return (
    <div className={`w-full bg-gray-100 rounded-full h-1.5 ${className}`}>
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
