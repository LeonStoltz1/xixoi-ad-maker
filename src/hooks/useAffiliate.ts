import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAffiliate() {
  const [loading, setLoading] = useState(false);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchAffiliate = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error(error);
        setError(error.message);
      } else {
        setAffiliate(data);
      }
      
      setLoading(false);
    };
    
    fetchAffiliate();
  }, [user]);

  const createAffiliate = async () => {
    if (!user || loading) return;
    setLoading(true);
    setError(null);

    // Generate affiliate code: "USERNAME-xxxxx"
    const base = (user.email?.split('@')[0] ?? 'user')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const code = `${base}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        code,
        payout_email: user.email,
      })
      .select('*')
      .single();

    if (error) {
      setError(error.message);
    } else {
      setAffiliate(data);
    }

    setLoading(false);
  };

  return { affiliate, loading, error, createAffiliate };
}
