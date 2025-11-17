import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BudgetManagerProps {
  campaigns: any[];
  onBudgetUpdate: () => void;
}

export function BudgetManager({ campaigns, onBudgetUpdate }: BudgetManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [budgetMode, setBudgetMode] = useState<'individual' | 'global'>('individual');
  const [globalBudget, setGlobalBudget] = useState<string>('');
  const [individualBudgets, setIndividualBudgets] = useState<Record<string, string>>(
    campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c.daily_budget?.toString() || '' }), {})
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      if (budgetMode === 'global') {
        const budget = parseFloat(globalBudget);
        if (isNaN(budget) || budget <= 0) {
          toast({
            variant: "destructive",
            title: "Invalid budget",
            description: "Please enter a valid budget amount",
          });
          return;
        }

        // Apply same budget to all campaigns
        const updates = campaigns.map(campaign => ({
          id: campaign.id,
          daily_budget: budget,
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from('campaigns')
            .update({ daily_budget: update.daily_budget })
            .eq('id', update.id);

          if (error) throw error;
        }

        toast({
          title: "Budget updated",
          description: `Applied $${budget}/day to all campaigns`,
        });
      } else {
        // Update individual budgets
        for (const [campaignId, budgetStr] of Object.entries(individualBudgets)) {
          const budget = parseFloat(budgetStr);
          if (!isNaN(budget) && budget > 0) {
            const { error } = await supabase
              .from('campaigns')
              .update({ daily_budget: budget })
              .eq('id', campaignId);

            if (error) throw error;
          }
        }

        toast({
          title: "Budgets updated",
          description: "Individual campaign budgets have been saved",
        });
      }

      onBudgetUpdate();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating budgets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update budgets",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        className="gap-2"
      >
        <DollarSign className="w-4 h-4" />
        Manage Budgets
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Campaign Budgets</DialogTitle>
            <DialogDescription>
              Set daily budgets for your campaigns individually or apply a global budget to all
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Budget Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={budgetMode === 'individual' ? 'default' : 'outline'}
                onClick={() => setBudgetMode('individual')}
                className="flex-1"
              >
                Individual Budgets
              </Button>
              <Button
                variant={budgetMode === 'global' ? 'default' : 'outline'}
                onClick={() => setBudgetMode('global')}
                className="flex-1 gap-2"
              >
                <Globe className="w-4 h-4" />
                Global Budget
              </Button>
            </div>

            {budgetMode === 'global' ? (
              <div className="space-y-2">
                <Label>Daily Budget (applies to all campaigns)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={globalBudget}
                    onChange={(e) => setGlobalBudget(e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                    min="1"
                    step="1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will apply ${globalBudget || '0'}/day to all {campaigns.length} campaigns
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {campaign.status === 'ready' ? (
                          campaign.is_active ? (
                            <span className="font-medium">Active</span>
                          ) : (
                            <span className="font-medium">Paused</span>
                          )
                        ) : (
                          <span className="font-medium">Draft</span>
                        )}
                      </span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={individualBudgets[campaign.id] || ''}
                        onChange={(e) =>
                          setIndividualBudgets({
                            ...individualBudgets,
                            [campaign.id]: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="pl-10"
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Budgets'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
