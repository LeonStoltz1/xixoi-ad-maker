import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Settings, Check } from 'lucide-react';
import { useAdminOverride } from '@/hooks/useAdminOverride';
import { toast } from 'sonner';

const TIER_OPTIONS = [
  { value: null, label: 'My Actual Tier' },
  { value: 'free', label: 'Free Tier' },
  { value: 'quickstart', label: 'Quick-Start ($49/mo)' },
  { value: 'pro', label: 'Publish Pro ($99/mo)' },
  { value: 'elite', label: 'Scale Elite ($199/mo)' },
  { value: 'agency', label: 'Agency ($399/mo)' }
];

export function AdminExperienceSwitcher() {
  const { isAdmin, override, updateOverride, clearOverride } = useAdminOverride();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin) return null;

  const handleTierChange = async (tier: string | null) => {
    if (tier === null) {
      await clearOverride();
      toast.success('Switched to your actual tier');
    } else {
      await updateOverride({ override_tier: tier });
      toast.success(`Switched to ${TIER_OPTIONS.find(t => t.value === tier)?.label}`);
    }
    setIsOpen(false);
  };

  const handleRealtorToggle = async (checked: boolean) => {
    await updateOverride({ override_realtor_mode: checked });
    toast.success(checked ? 'Realtor mode enabled' : 'Realtor mode disabled');
  };

  const handlePoliticalToggle = async (checked: boolean) => {
    await updateOverride({ override_political_mode: checked });
    toast.success(checked ? 'Political mode enabled' : 'Political mode disabled');
  };

  const currentTier = override?.override_tier || null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden md:inline">Admin View</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-amber-600 dark:text-amber-400">
          Experience Switcher
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Pricing Tier
        </DropdownMenuLabel>
        {TIER_OPTIONS.map(({ value, label }) => (
          <DropdownMenuItem
            key={value || 'actual'}
            onClick={() => handleTierChange(value)}
            className="cursor-pointer"
          >
            <span className="flex-1">{label}</span>
            {currentTier === value && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Mode Toggles
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={override?.override_realtor_mode || false}
          onCheckedChange={handleRealtorToggle}
        >
          Realtor Mode
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={override?.override_political_mode || false}
          onCheckedChange={handlePoliticalToggle}
        >
          Political Mode
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={async () => {
            await clearOverride();
            toast.success('All overrides cleared');
            setIsOpen(false);
          }}
          className="cursor-pointer text-destructive"
        >
          Reset All Overrides
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}