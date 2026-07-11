import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-amber-light' : 'text-white/80 hover:text-white'}`;

export function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-lg font-semibold text-white">
            🚗 Dealership Inventory
          </Link>

          <nav className="flex items-center gap-6">
            <NavLink to="/" className={navLinkClass} end>
              Browse
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">Hi, {user?.name}</span>
                <Button variant="secondary" onClick={logout}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className={navLinkClass({ isActive: false })}>
                  Log in
                </Link>
                <Link to="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
