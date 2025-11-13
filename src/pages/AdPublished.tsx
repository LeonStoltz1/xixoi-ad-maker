import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const AdPublished = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasPaid = searchParams.get('paid') === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-12">
        {/* Ad Preview Card */}
        <div className="border border-foreground bg-background p-8 mx-auto max-w-md">
          <div className="space-y-6">
            {/* Headline Bar */}
            <div className="bg-foreground text-background px-4 py-3">
              <div className="text-sm font-bold">YOUR PRODUCT</div>
            </div>

            {/* Body Lines */}
            <div className="space-y-3">
              <div className="h-3 bg-foreground/20 w-full" />
              <div className="h-3 bg-foreground/20 w-5/6" />
              <div className="h-3 bg-foreground/20 w-4/6" />
            </div>

            {/* CTA Button Outline */}
            <div className="border-2 border-foreground py-3 px-6 text-center">
              <span className="font-bold">SHOP NOW</span>
            </div>

            {/* Watermark for free users only */}
            {!hasPaid && (
              <div className="text-right text-[9px] opacity-60">
                Powered By xiXoi™
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Your ad is live.
          </h1>
          <p className="text-muted-foreground text-lg">
            xiXoi™ has published your campaign. You can track performance inside your ad platform.
          </p>
        </div>

        {/* Create Another Button */}
        <Button
          size="lg"
          className="text-lg py-6 px-12"
          onClick={() => navigate("/create-campaign")}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Another Ad
        </Button>
      </div>
    </div>
  );
};

export default AdPublished;
