import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface Subscription {
  id: string;
  table: string;
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void;
}

interface RealtimeContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  subscribe: (table: string, callback: Subscription['callback']) => string;
  unsubscribe: (subscriptionId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subsRef = useRef<Subscription[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('connecting');

    const channel = supabase.channel('pcc_realtime', {
      config: { broadcast: { self: true } },
    });

    const tables = ['products', 'versions', 'updates', 'assignments', 'audit_logs'];

    for (const table of tables) {
      channel.on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table } as never,
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          for (const sub of subsRef.current) {
            if (sub.table === table || sub.table === '*') {
              try { sub.callback(payload); } catch { /* ignore callback errors */ }
            }
          }
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setConnectionState('connected');
      else if (status === 'CLOSED') setConnectionState('disconnected');
      else if (status === 'CHANNEL_ERROR') setConnectionState('error');
      else setConnectionState('connecting');
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((table: string, callback: Subscription['callback']): string => {
    const id = `sub_${++counterRef.current}`;
    subsRef.current.push({ id, table, callback });
    return id;
  }, []);

  const unsubscribe = useCallback((subscriptionId: string) => {
    subsRef.current = subsRef.current.filter(s => s.id !== subscriptionId);
  }, []);

  return (
    <RealtimeContext.Provider value={{
      connectionState,
      isConnected: connectionState === 'connected',
      subscribe,
      unsubscribe,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextType {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}

export function useRealtimeSubscription(
  table: string,
  callback: Subscription['callback'],
  deps: unknown[] = []
) {
  const { subscribe, unsubscribe } = useRealtime();
  useEffect(() => {
    const id = subscribe(table, callback);
    return () => unsubscribe(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, subscribe, unsubscribe, ...deps]);
}
