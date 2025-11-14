import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportPayouts() {
  const handleExport = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("payouts")
        .select("*")
        .order("month", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No payouts to export");
        return;
      }

      const csv = [
        ["Month", "Affiliate Payout", "Agency Bonus", "Total Payout", "xiXoi Net"],
        ...data.map((p: any) => [
          p.month,
          p.affiliate.toFixed(2),
          p.agency.toFixed(2),
          p.total.toFixed(2),
          p.net.toFixed(2),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xixoi-payouts-${new Date().toISOString().slice(0, 7)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Payouts exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export payouts");
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export to CSV
    </Button>
  );
}
