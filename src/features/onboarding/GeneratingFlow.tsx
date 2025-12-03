import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, Palette, DollarSign, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratingFlowProps {
  currentStep: number;
}

const steps = [
  { icon: Brain, label: 'Understanding your product', description: 'Analyzing content and brand voice' },
  { icon: Target, label: 'Finding your audience', description: 'Identifying ideal customer segments' },
  { icon: Palette, label: 'Creating ad variants', description: 'Generating compelling creatives' },
  { icon: DollarSign, label: 'Optimizing budget', description: 'Calculating optimal spend allocation' },
];

export function GeneratingFlow({ currentStep }: GeneratingFlowProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targetProgress = ((currentStep + 1) / steps.length) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(timer);
          return targetProgress;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [currentStep]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-8 pb-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Creating Your Campaign</h2>
          <p className="text-muted-foreground">
            Gemini AI is working its magic...
          </p>
        </div>

        <Progress value={progress} className="h-2 mb-8" />

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg transition-all duration-300',
                  isActive && 'bg-primary/10 border border-primary/20',
                  isComplete && 'opacity-60',
                  !isActive && !isComplete && 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                    isComplete && 'bg-green-500/20 text-green-500',
                    isActive && 'bg-primary/20 text-primary animate-pulse',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className={cn('font-medium', isActive && 'text-primary')}>
                    {step.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
