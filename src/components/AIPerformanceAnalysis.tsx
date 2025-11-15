import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AIPerformanceAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setShowDialog(true);
    setAnalysis(null);

    try {
      console.log('Starting AI performance analysis...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('Invoking analyze-performance function...');
      const { data, error } = await supabase.functions.invoke('analyze-performance', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.analysis) {
        console.error('No analysis in response:', data);
        throw new Error('No analysis data received from AI');
      }

      console.log('Analysis received successfully');
      setAnalysis(data.analysis);
      setPlatformMetrics(data.platformMetrics);

      toast({
        title: "Analysis complete",
        description: "AI has analyzed your campaign performance across all platforms",
      });

    } catch (error: any) {
      console.error('Error analyzing performance:', error);
      
      let errorMessage = 'Failed to analyze performance. Please try again.';
      
      if (error.message?.includes('rate limit') || error.status === 429) {
        errorMessage = 'AI service is currently rate limited. Please try again in a moment.';
      } else if (error.message?.includes('credits') || error.status === 402) {
        errorMessage = 'AI service credits exhausted. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setShowDialog(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Performance Analysis
          </CardTitle>
          <CardDescription>
            Get AI-powered insights on which platforms deliver the best ROI for your ad spend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Performance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Performance Analysis
            </DialogTitle>
            <DialogDescription>
              Cross-platform advertising effectiveness insights
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing && !analysis && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing your campaign performance...</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Platform Metrics Overview */}
              {platformMetrics && Object.keys(platformMetrics).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Platform Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(platformMetrics).map(platform => {
                      const m = platformMetrics[platform];
                      return (
                        <Card key={platform} className="bg-muted/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base uppercase">{platform}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Spend:</span>
                              <span className="font-semibold">${m.totalSpend.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ROAS:</span>
                              <span className="font-semibold">{m.roas}x</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CTR:</span>
                              <span className="font-semibold">{m.avgCTR}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Conversions:</span>
                              <span className="font-semibold">{m.totalConversions}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">AI Insights</h3>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {analysis.split('\n').map((line, idx) => (
                        <p key={idx} className="mb-2 last:mb-0">
                          {line}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
