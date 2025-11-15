import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { PoliticalCandidate } from '@/types/political';

interface PoliticalProfile {
  hasPoliticalTier: boolean;
  adsUsed: number;
  adsLimit: number;
  candidate: PoliticalCandidate | null;
}

interface PoliticalContextValue {
  politicalProfile: PoliticalProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const PoliticalContext = createContext<PoliticalContextValue | undefined>(undefined);

export function PoliticalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [politicalProfile, setPoliticalProfile] = useState<PoliticalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchPoliticalProfile(session.user.id);
      } else {
        setUser(null);
        setPoliticalProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchPoliticalProfile(session.user.id);
    }
    setIsLoading(false);
  }

  async function fetchPoliticalProfile(userId: string) {
    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('political_tier, political_ads_used, political_ads_limit')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch candidate data if political tier is active
      let candidate: PoliticalCandidate | null = null;
      if (profile.political_tier) {
        const { data: candidateData, error: candidateError } = await supabase
          .from('political_candidates')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!candidateError && candidateData) {
          candidate = {
            id: candidateData.id,
            userId: candidateData.user_id,
            fullName: candidateData.full_name,
            party: candidateData.party,
            race: candidateData.race,
            electionYear: candidateData.election_year,
            website: candidateData.website,
            fecId: candidateData.fec_id,
            address: candidateData.address,
            officeSought: candidateData.office_sought,
            idDocumentFrontUrl: candidateData.id_document_front_url,
            idDocumentBackUrl: candidateData.id_document_back_url,
            selfieUrl: candidateData.selfie_url,
            walletAddress: candidateData.wallet_address,
            approved: candidateData.approved,
            approvedAt: candidateData.approved_at,
            createdAt: candidateData.created_at,
            updatedAt: candidateData.updated_at,
          };
        }
      }

      setPoliticalProfile({
        hasPoliticalTier: profile.political_tier || false,
        adsUsed: profile.political_ads_used || 0,
        adsLimit: profile.political_ads_limit || 100,
        candidate,
      });
    } catch (error) {
      console.error('Error fetching political profile:', error);
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchPoliticalProfile(user.id);
    }
  }

  return (
    <PoliticalContext.Provider value={{ politicalProfile, isLoading, refreshProfile }}>
      {children}
    </PoliticalContext.Provider>
  );
}

export function usePolitical() {
  const context = useContext(PoliticalContext);
  if (context === undefined) {
    throw new Error('usePolitical must be used within a PoliticalProvider');
  }
  return context;
}
