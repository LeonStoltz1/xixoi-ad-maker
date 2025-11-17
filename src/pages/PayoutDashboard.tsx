import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ExportPayouts } from "@/components/ExportPayouts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Payout {
  id: string;
  month: string;
  affiliate: number;
  agency: number;
  total: number;
  net: number;
}

export default function PayoutDashboard() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayouts = async () => {
      const { data } = await (supabase as any)
        .from("payouts")
        .select("*")
        .order("month", { ascending: false });

      setPayouts(data ?? []);
      setLoading(false);
    };
    fetchPayouts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading payouts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Payout Dashboard</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/payout-settings')}>
            Settings
          </Button>
          <ExportPayouts />
        </div>
      </div>

      <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
        <table className="min-w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Affiliate (20%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Agency Bonus (10% Δ)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase font-bold">
                Total Payout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                xiXoi Net
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {payouts.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {format(new Date(p.month + "-01"), "MMM yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  ${p.affiliate.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  ${p.agency.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                  ${p.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  ${p.net.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payouts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No payouts recorded yet
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-muted-foreground space-y-1">
        <p>* Affiliate earns 20% lifetime on full MRR</p>
        <p>* Agency earns 10% on upgrade delta only</p>
      </div>
    </div>
  );
}
