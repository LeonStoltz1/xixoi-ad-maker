import { Badge } from "@/components/ui/badge";
import { Crown, Zap, TrendingUp, Star, Award } from "lucide-react";

interface AffiliateTierBadgeProps {
  tier: 'inactive' | 'light' | 'active' | 'power' | 'super';
  size?: 'sm' | 'md' | 'lg';
}

export function AffiliateTierBadge({ tier, size = 'md' }: AffiliateTierBadgeProps) {
  const config = {
    inactive: {
      label: 'Inactive',
      icon: null,
      className: 'bg-muted text-muted-foreground',
    },
    light: {
      label: 'Light',
      icon: Star,
      className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    active: {
      label: 'Active',
      icon: TrendingUp,
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    power: {
      label: 'Power',
      icon: Zap,
      className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    },
    super: {
      label: 'Super',
      icon: Crown,
      className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    },
  };

  const { label, icon: Icon, className } = config[tier];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge variant="outline" className={`${className} ${sizeClasses[size]} font-semibold`}>
      {Icon && <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} mr-1`} />}
      {label} Affiliate
    </Badge>
  );
}
