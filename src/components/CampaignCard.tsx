import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  PauseCircle, 
  StopCircle, 
  DollarSign,
  TrendingUp,
  Calendar,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    status_reason?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    total_spent?: number;
    start_date?: string;
    end_date?: string;
    platforms?: string[];
  };
  onUpdate: () => void;
}

export const CampaignCard = ({ campaign, onUpdate }: CampaignCardProps) => {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-foreground text-background';
      case 'paused': return 'bg-background text-foreground border border-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'scheduled': return 'bg-background text-foreground border border-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const remainingBudget = campaign.lifetime_budget 
    ? campaign.lifetime_budget - (campaign.total_spent || 0)
    : null;

  const handleStatusToggle = async () => {
    setLoading(true);
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      const { data: { user } } = await supabase.auth.getUser();

      // Log budget event
      await supabase.from('campaign_budget_events').insert({
        campaign_id: campaign.id,
        event_type: newStatus === 'paused' ? 'pause' : 'resume',
        old_status: campaign.status,
        new_status: newStatus,
        reason: newStatus === 'paused' ? 'user_paused' : 'user_resumed',
        created_by: user?.id,
      });

      // Update campaign status
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: newStatus,
          status_reason: newStatus === 'paused' ? 'user_paused' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      onUpdate();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update campaign status');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = async (multiplier: number) => {
    if (!campaign.daily_budget) {
      toast.error('No daily budget set');
      return;
    }

    setLoading(true);
    try {
      const newBudget = campaign.daily_budget * multiplier;
      const { data: { user } } = await supabase.auth.getUser();

      // Log budget event
      await supabase.from('campaign_budget_events').insert({
        campaign_id: campaign.id,
        event_type: multiplier > 1 ? 'increase' : 'decrease',
        old_daily_budget: campaign.daily_budget,
        new_daily_budget: newBudget,
        created_by: user?.id,
      });

      // Update campaign budget
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          daily_budget: newBudget,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success(`Daily budget updated to $${newBudget.toFixed(2)}`);
      onUpdate();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  const handleStopCampaign = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Log budget event
      await supabase.from('campaign_budget_events').insert({
        campaign_id: campaign.id,
        event_type: 'pause',
        old_status: campaign.status,
        new_status: 'completed',
        reason: 'user_stopped',
        created_by: user?.id,
      });

      // Update campaign status
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: 'completed',
          status_reason: 'user_stopped',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success('Campaign stopped');
      onUpdate();
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast.error('Failed to stop campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-primary/20 hover:border-primary/40 transition-all">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{campaign.name}</h3>
              <Badge className={getStatusColor(campaign.status)}>
                {getStatusLabel(campaign.status)}
              </Badge>
            </div>
            {campaign.status_reason && (
              <p className="text-xs text-muted-foreground">
                {campaign.status_reason.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Daily Budget</p>
            <p className="text-lg font-bold">
              ${campaign.daily_budget?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-lg font-bold">
              ${campaign.total_spent?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {remainingBudget !== null && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <span className="text-sm">Remaining Budget</span>
            <span className={`font-semibold ${remainingBudget < 50 ? 'text-orange-500' : ''}`}>
              ${remainingBudget.toFixed(2)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleStatusToggle}
            disabled={loading || campaign.status === 'completed'}
            variant={campaign.status === 'active' ? 'outline' : 'default'}
            className="flex-1"
          >
            {campaign.status === 'active' ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <DollarSign className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Adjust Budget</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBudgetChange(2)}>
                Double Budget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBudgetChange(1.2)}>
                +20% Budget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBudgetChange(0.8)}>
                -20% Budget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleStopCampaign}
            disabled={loading || campaign.status === 'completed'}
            variant="outline"
            className="text-red-500 hover:text-red-600"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
