import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Normalizes Supabase base URL (strips trailing /rest/v1/ if present)
function normalizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://byccnjctijsbhyxyojpa.supabase.co';
const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Singleton Supabase Client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseConnectionStatus {
  connected: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  url: string;
  projectRef: string;
  version?: string;
  error?: string;
  testedAt: string;
}

/**
 * Validates connectivity to the configured Supabase instance.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const testedAt = new Date().toISOString();
  const projectRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] || 'unknown';

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      connected: false,
      status: 'DISCONNECTED',
      url: supabaseUrl,
      projectRef,
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env',
      testedAt,
    };
  }

  try {
    // 1. Check GoTrue Auth / System Health endpoint
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: supabasePublishableKey,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        status: 'CONNECTED',
        url: supabaseUrl,
        projectRef,
        version: data.version || 'v2.0',
        testedAt,
      };
    } else {
      return {
        connected: false,
        status: 'ERROR',
        url: supabaseUrl,
        projectRef,
        error: `Supabase server responded with status: ${res.status} ${res.statusText}`,
        testedAt,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      status: 'ERROR',
      url: supabaseUrl,
      projectRef,
      error: err.message || 'Network error reaching Supabase cloud',
      testedAt,
    };
  }
}
