import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminOverride } from '@/hooks/useAdminOverride';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  feature: string;
  tier: 'free' | 'quickstart' | 'pro' | 'elite' | 'agency';
  page: string;
  description: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // FREE TIER
  { id: 'free-1', feature: 'View dashboard (limited)', tier: 'free', page: '/dashboard', description: 'Can view dashboard but cannot create campaigns' },
  { id: 'free-2', feature: 'Preview ads only', tier: 'free', page: '/create-campaign', description: 'Can generate ad previews but cannot publish' },
  { id: 'free-3', feature: 'Watermark visible', tier: 'free', page: '/create-campaign', description: 'All previews show "Powered by xiXoi™" watermark' },
  { id: 'free-4', feature: 'Upgrade prompts', tier: 'free', page: '/create-campaign', description: 'See upgrade CTAs on publish attempts' },
  
  // QUICK-START TIER
  { id: 'qs-1', feature: 'Create campaigns', tier: 'quickstart', page: '/create-campaign', description: 'Can create and publish campaigns' },
  { id: 'qs-2', feature: '$300/week spend cap', tier: 'quickstart', page: '/add-ad-budget', description: 'Cap modal appears when approaching/hitting limit' },
  { id: 'qs-3', feature: '5% service fee', tier: 'quickstart', page: '/add-ad-budget', description: 'Service fee displayed in payment breakdown' },
  { id: 'qs-4', feature: 'No watermark', tier: 'quickstart', page: '/dashboard', description: 'Published ads have no watermark' },
  { id: 'qs-5', feature: 'Political ads blocked', tier: 'quickstart', page: '/create-campaign', description: 'Cannot create political ads, see upgrade prompt' },
  { id: 'qs-6', feature: 'Master accounts used', tier: 'quickstart', page: '/create-campaign', description: 'No OAuth connection required' },
  
  // PRO TIER
  { id: 'pro-1', feature: 'OAuth connections', tier: 'pro', page: '/connect-platforms', description: 'Can connect Meta/Google/TikTok/LinkedIn/X accounts' },
  { id: 'pro-2', feature: 'Unlimited spend', tier: 'pro', page: '/add-ad-budget', description: 'No weekly cap, no service fee' },
  { id: 'pro-3', feature: 'Political ads allowed', tier: 'pro', page: '/political/generate', description: 'Can create political ads with compliance' },
  { id: 'pro-4', feature: 'Multi-platform publishing', tier: 'pro', page: '/create-campaign', description: 'Can publish to any connected platform' },
  { id: 'pro-5', feature: '4 AI variants', tier: 'pro', page: '/create-campaign', description: 'Receive 4 ad variants to choose from' },
  
  // ELITE TIER
  { id: 'elite-1', feature: 'Affiliate program access', tier: 'elite', page: '/affiliates', description: 'Can join affiliate program and earn 20%' },
  { id: 'elite-2', feature: 'Priority support badge', tier: 'elite', page: '/dashboard', description: 'See VIP support indicator' },
  { id: 'elite-3', feature: 'Advanced analytics', tier: 'elite', page: '/campaign-analytics', description: 'Access to detailed performance metrics' },
  
  // AGENCY TIER
  { id: 'agency-1', feature: 'White-label access', tier: 'agency', page: '/agency', description: 'Can access agency portal' },
  { id: 'agency-2', feature: 'Client management', tier: 'agency', page: '/agency', description: 'Can add and manage client accounts' },
  { id: 'agency-3', feature: 'API access', tier: 'agency', page: '/settings', description: 'Can generate API keys' },
  { id: 'agency-4', feature: 'Team seats', tier: 'agency', page: '/agency', description: 'Can invite team members' },
  
  // REALTOR MODE (cross-tier)
  { id: 'realtor-1', feature: 'Real estate forms', tier: 'free', page: '/create-campaign', description: 'Can toggle realtor mode and see property forms' },
  { id: 'realtor-2', feature: 'Fair Housing compliance', tier: 'free', page: '/create-campaign', description: 'See compliance checks and EHO footer' },
];

export default function TierTestingChecklist() {
  const navigate = useNavigate();
  const { isAdmin, override, updateOverride, loading } = useAdminOverride();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [currentTier, setCurrentTier] = useState<string>('free');

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) return;
      
      if (!isAdmin) {
        navigate('/dashboard');
        return;
      }

      // Load saved checklist state from localStorage
      const saved = localStorage.getItem('admin-checklist-progress');
      if (saved) {
        setCheckedItems(new Set(JSON.parse(saved)));
      }
    };

    checkAdmin();
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (override?.override_tier) {
      setCurrentTier(override.override_tier);
    }
  }, [override]);

  const handleCheck = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
    localStorage.setItem('admin-checklist-progress', JSON.stringify([...newChecked]));
  };

  const handleSwitchTier = async (tier: string) => {
    await updateOverride({ override_tier: tier });
  };

  const handleNavigate = (page: string) => {
    navigate(page);
  };

  const tierGroups = {
    free: CHECKLIST_ITEMS.filter(item => item.tier === 'free' && !item.id.startsWith('realtor')),
    quickstart: CHECKLIST_ITEMS.filter(item => item.tier === 'quickstart'),
    pro: CHECKLIST_ITEMS.filter(item => item.tier === 'pro'),
    elite: CHECKLIST_ITEMS.filter(item => item.tier === 'elite'),
    agency: CHECKLIST_ITEMS.filter(item => item.tier === 'agency'),
    realtor: CHECKLIST_ITEMS.filter(item => item.id.startsWith('realtor')),
  };

  const getProgress = (items: ChecklistItem[]) => {
    const checked = items.filter(item => checkedItems.has(item.id)).length;
    return { checked, total: items.length, percentage: Math.round((checked / items.length) * 100) };
  };

  const totalProgress = getProgress(CHECKLIST_ITEMS);

  if (loading) {
    return (
      <AppLayout title="Tier Testing Checklist">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Tier Testing Checklist" showBack backTo="/dashboard">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tier Testing Checklist</h1>
          <p className="text-muted-foreground">
            Systematically verify all features across pricing tiers
          </p>
          
          {/* Overall Progress */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {totalProgress.checked} / {totalProgress.total} ({totalProgress.percentage}%)
              </span>
            </div>
            <div className="w-full h-3 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${totalProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tier Sections */}
        <div className="space-y-6">
          {Object.entries(tierGroups).map(([tierKey, items]) => {
            if (items.length === 0) return null;
            
            const progress = getProgress(items);
            const isComplete = progress.checked === progress.total;
            
            return (
              <Card key={tierKey} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold capitalize">
                      {tierKey === 'quickstart' ? 'Quick-Start' : tierKey} Tier
                    </h2>
                    {isComplete && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {progress.checked} / {progress.total}
                    </span>
                    {tierKey !== 'realtor' && (
                      <Button
                        size="sm"
                        variant={currentTier === tierKey ? 'default' : 'outline'}
                        onClick={() => handleSwitchTier(tierKey)}
                      >
                        {currentTier === tierKey ? 'Active' : 'Switch to this tier'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => handleCheck(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}`}>
                            {item.feature}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.page}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleNavigate(item.page)}
                      >
                        Test →
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setCheckedItems(new Set());
              localStorage.removeItem('admin-checklist-progress');
            }}
          >
            Reset Progress
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allIds = CHECKLIST_ITEMS.map(item => item.id);
              setCheckedItems(new Set(allIds));
              localStorage.setItem('admin-checklist-progress', JSON.stringify(allIds));
            }}
          >
            Mark All Complete
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
