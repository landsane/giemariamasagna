export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
    </div>
  );
}
