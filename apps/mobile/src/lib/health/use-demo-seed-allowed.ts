import { useAuth } from '@/lib/auth';
import { isSeededDemoToken } from '@/lib/auth/demo-users';

/** Whether this session may see the offline demo seed (`withDemoFallback`). */
export function useDemoSeedAllowed(): boolean {
  const token = useAuth.use.token();
  return isSeededDemoToken(token?.access);
}
