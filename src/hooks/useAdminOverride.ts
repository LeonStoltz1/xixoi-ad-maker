import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminOverride {
  id?: string;
  user_id?: string;
  override_tier: string | null;
  override_realtor_mode: boolean;
  override_political_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useAdminOverride() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [override, setOverride] = useState<AdminOverride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndFetchOverride = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user is admin
        const { data: adminCheck } = await supabase.rpc('is_admin', {
          _user_id: user.id
        });

        setIsAdmin(!!adminCheck);

        if (adminCheck) {
          // Fetch admin overrides
          const { data: overrideData } = await (supabase as any)
            .from('admin_overrides')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          setOverride(overrideData as AdminOverride | null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchOverride();
  }, []);

  const updateOverride = async (updates: Partial<AdminOverride>) => {
    if (!isAdmin) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('admin_overrides')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setOverride(data as AdminOverride);
    } catch (error) {
      console.error('Error updating admin override:', error);
    }
  };

  const clearOverride = async () => {
    if (!isAdmin) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from('admin_overrides')
        .delete()
        .eq('user_id', user.id);

      setOverride(null);
    } catch (error) {
      console.error('Error clearing admin override:', error);
    }
  };

  return {
    isAdmin,
    override,
    loading,
    updateOverride,
    clearOverride
  };
}