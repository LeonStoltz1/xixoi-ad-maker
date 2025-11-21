import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { DollarSign, TrendingUp } from "lucide-react";

export function EarningsCalculator() {
  const [referrals, setReferrals] = useState([10]);

  // Average monthly revenue per user across tiers
  const avgMonthlyPerUser = 74; // ($49 Quick-Start + $99 Pro) / 2 = $74 avg
  const commissionRate = 0.5; // 50%
  const monthsActive = 12; // 12 months

  const monthlyEarnings = referrals[0] * avgMonthlyPerUser * commissionRate;
  const yearlyEarnings = monthlyEarnings * monthsActive;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <DollarSign className="w-6 h-6 text-primary" />
          Earnings Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Monthly Referrals</label>
            <span className="text-2xl font-bold text-primary">{referrals[0]}</span>
          </div>
          <Slider
            value={referrals}
            onValueChange={setReferrals}
            min={1}
            max={200}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground text-center">
            Drag to estimate your potential earnings
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly Earnings</span>
            <span className="text-xl font-bold">${monthlyEarnings.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Yearly Earnings (12 months)</span>
            <span className="text-2xl font-bold text-primary">${yearlyEarnings.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              That's <span className="font-bold">${(yearlyEarnings / 12).toFixed(0)}/month</span> in passive recurring income
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Based on 50% commission for 12 months per referral
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
