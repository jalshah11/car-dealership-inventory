import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="spec-figure text-6xl font-medium text-navy">404</p>
      <h1 className="mt-4 text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-ink-soft">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Back to inventory</Button>
      </Link>
    </div>
  );
}
