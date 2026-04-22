import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <p className="text-6xl font-black text-gray-200">404</p>
      <p className="text-gray-500">Page non trouvée</p>
      <Link to="/dashboard" className="text-sm font-medium text-green-600 hover:underline">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
