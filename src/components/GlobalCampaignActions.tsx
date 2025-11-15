import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PauseCircle, PlayCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GlobalCampaignActionsProps {
  campaignCount: number;
  activeCampaignCount: number;
  onUpdate: () => void;
}

export const GlobalCampaignActions = ({
  campaignCount,
  activeCampaignCount,
  onUpdate,
}: GlobalCampaignActionsProps) => {
  const [loading, setLoading] = useState(false);
  const [showPauseAllDialog, setShowPauseAllDialog] = useState(false);

  const handlePauseAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all active campaigns
      const { data: campaigns, error: fetchError } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      if (!campaigns || campaigns.length === 0) {
        toast.info('No active campaigns to pause');
        return;
      }

      // Log events for all campaigns
      const events = campaigns.map(campaign => ({
        campaign_id: campaign.id,
        event_type: 'pause',
        old_status: 'active',
        new_status: 'paused',
        reason: 'user_paused_all',
        created_by: user.id,
      }));

      await supabase.from('campaign_budget_events').insert(events);

      // Update all campaigns to paused
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'paused',
          status_reason: 'user_paused_all',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (updateError) throw updateError;

      toast.success(`Paused ${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''}`);
      onUpdate();
    } catch (error) {
      console.error('Error pausing all campaigns:', error);
      toast.error('Failed to pause campaigns');
    } finally {
      setLoading(false);
      setShowPauseAllDialog(false);
    }
  };

  const handleResumeAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all paused campaigns
      const { data: campaigns, error: fetchError } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'paused');

      if (fetchError) throw fetchError;
      if (!campaigns || campaigns.length === 0) {
        toast.info('No paused campaigns to resume');
        return;
      }

      // Log events for all campaigns
      const events = campaigns.map(campaign => ({
        campaign_id: campaign.id,
        event_type: 'resume',
        old_status: 'paused',
        new_status: 'active',
        reason: 'user_resumed_all',
        created_by: user.id,
      }));

      await supabase.from('campaign_budget_events').insert(events);

      // Update all campaigns to active
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'active',
          status_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'paused');

      if (updateError) throw updateError;

      toast.success(`Resumed ${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''}`);
      onUpdate();
    } catch (error) {
      console.error('Error resuming all campaigns:', error);
      toast.error('Failed to resume campaigns');
    } finally {
      setLoading(false);
    }
  };

  if (campaignCount === 0) return null;

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setShowPauseAllDialog(true)}
          disabled={loading || activeCampaignCount === 0}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PauseCircle className="mr-2 h-4 w-4" />
          )}
          Pause All ({activeCampaignCount})
        </Button>

        <Button
          onClick={handleResumeAll}
          disabled={loading || activeCampaignCount === campaignCount}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          Resume All
        </Button>
      </div>

      <AlertDialog open={showPauseAllDialog} onOpenChange={setShowPauseAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause All Campaigns?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately pause all {activeCampaignCount} active campaign
              {activeCampaignCount > 1 ? 's' : ''} and stop ad spending. You can resume them
              anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseAll}>Pause All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
