import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface RealtorProfile {
  isRealtor: boolean;
  realtorName: string | null;
  brokerageName: string | null;
  licenseState: string | null;
}

interface RealtorContextValue {
  realtorProfile: RealtorProfile | null;
  isLoading: boolean;
  updateRealtorProfile: (profile: Partial<RealtorProfile>) => Promise<void>;
}

const RealtorContext = createContext<RealtorContextValue | undefined>(undefined);

export function RealtorProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [realtorProfile, setRealtorProfile] = useState<RealtorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchRealtorProfile(session.user.id);
      } else {
        setUser(null);
        setRealtorProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchRealtorProfile(session.user.id);
    }
    setIsLoading(false);
  }

  async function fetchRealtorProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_realtor, realtor_name, brokerage_name, realtor_license_state')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setRealtorProfile({
        isRealtor: data.is_realtor || false,
        realtorName: data.realtor_name,
        brokerageName: data.brokerage_name,
        licenseState: data.realtor_license_state,
      });
    } catch (error) {
      console.error('Error fetching realtor profile:', error);
    }
  }

  async function updateRealtorProfile(profile: Partial<RealtorProfile>) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_realtor: profile.isRealtor,
          realtor_name: profile.realtorName,
          brokerage_name: profile.brokerageName,
          realtor_license_state: profile.licenseState,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchRealtorProfile(user.id);
    } catch (error) {
      console.error('Error updating realtor profile:', error);
      throw error;
    }
  }

  return (
    <RealtorContext.Provider value={{ realtorProfile, isLoading, updateRealtorProfile }}>
      {children}
    </RealtorContext.Provider>
  );
}

export function useRealtor() {
  const context = useContext(RealtorContext);
  if (context === undefined) {
    throw new Error('useRealtor must be used within a RealtorProvider');
  }
  return context;
}
