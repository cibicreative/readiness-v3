import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { isShareTokenValid } from '../../lib/scoring';
import { AlertCircle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

interface TokenGuardWrapperProps {
  token: string;
  children: ReactNode;
}

export function TokenGuardWrapper({ token, children }: TokenGuardWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('share_token', token)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('This link is invalid or has expired.');
          setLoading(false);
          return;
        }

        if (!isShareTokenValid(data.share_enabled, data.share_expires_at)) {
          setError('This link is invalid or has expired.');
          setLoading(false);
          return;
        }

        setClient(data);
        setLoading(false);
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Failed to validate link. Please try again.');
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0F2147] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2B3D66]">Validating access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F6] px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F2147] mb-2">Access Denied</h1>
          <p className="text-[#2B3D66] mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the person who shared this link with you.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
