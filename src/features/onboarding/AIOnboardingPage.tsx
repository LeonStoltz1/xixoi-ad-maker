import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProductInput } from './ProductInput';
import { GeneratingFlow } from './GeneratingFlow';
import { CampaignBlueprint } from './CampaignBlueprint';

type OnboardingState = 'input' | 'generating' | 'blueprint';

interface BlueprintData {
  productName: string;
  variants: Array<{
    headline: string;
    body: string;
    cta: string;
    predictedCtr?: number;
  }>;
  audience: {
    ageRange: string;
    interests: string[];
    locations: string[];
  };
  budget: {
    daily: number;
    recommended: number;
    duration: number;
  };
  platforms: string[];
  campaignId?: string;
}

export function AIOnboardingPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>('input');
  const [generatingStep, setGeneratingStep] = useState(0);
  const [blueprintData, setBlueprintData] = useState<BlueprintData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProductSubmit = async (data: { type: 'url' | 'text'; value: string }) => {
    setIsLoading(true);
    setState('generating');
    setGeneratingStep(0);

    try {
      // Simulate step progression while AI processes
      const stepInterval = setInterval(() => {
        setGeneratingStep((prev) => {
          if (prev < 3) return prev + 1;
          clearInterval(stepInterval);
          return prev;
        });
      }, 2000);

      const { data: result, error } = await supabase.functions.invoke('ai-onboarding', {
        body: {
          inputType: data.type,
          inputValue: data.value,
        },
      });

      clearInterval(stepInterval);

      if (error) throw error;

      if (result?.success && result?.blueprint) {
        setBlueprintData(result.blueprint);
        setState('blueprint');
      } else {
        throw new Error(result?.error || 'Failed to generate campaign');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to generate campaign. Please try again.');
      setState('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (blueprintData?.campaignId) {
      navigate(`/campaign/${blueprintData.campaignId}/publish`);
    } else {
      navigate('/create-campaign');
    }
  };

  const handleEdit = () => {
    if (blueprintData?.campaignId) {
      navigate(`/edit-campaign/${blueprintData.campaignId}`);
    } else {
      setState('input');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {state === 'input' && (
          <ProductInput onSubmit={handleProductSubmit} isLoading={isLoading} />
        )}
        {state === 'generating' && (
          <GeneratingFlow currentStep={generatingStep} />
        )}
        {state === 'blueprint' && blueprintData && (
          <CampaignBlueprint
            data={blueprintData}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
}
