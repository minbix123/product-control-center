import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="aqua-bg min-h-screen flex items-center justify-center p-4">
      <div className="aqua-window max-w-sm w-full">
        <div className="aqua-titlebar">
          <div className="traffic-lights">
            <span className="traffic-light traffic-light-close" />
            <span className="traffic-light traffic-light-minimize" />
            <span className="traffic-light traffic-light-maximize" />
          </div>
          <span className="aqua-titlebar-title">404 — Not Found</span>
          <div className="w-16" />
        </div>
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-2xl font-bold text-[var(--aqua-text)] mb-2">Page Not Found</h1>
          <p className="text-sm text-[var(--aqua-text-muted)] mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <RetroButton variant="primary" onClick={() => navigate('/dashboard')} icon={ArrowLeft}>
            Back to Dashboard
          </RetroButton>
        </div>
      </div>
    </div>
  );
}
