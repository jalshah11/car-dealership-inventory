import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

// Wrapping useContext like this means every consumer gets a clear error if
// they forget to wrap their tree in <AuthProvider> (a genuinely common
// mistake), instead of a silent `undefined` and a confusing crash three
// lines later when they try to read `.user` off of undefined.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
