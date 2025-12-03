import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, DollarSign, Users, Calendar, Sparkles, ArrowRight } from 'lucide-react';

interface AdVariant {
  headline: string;
  body: string;
  cta: string;
  predictedCtr?: number;
}

interface CampaignBlueprintData {
  productName: string;
  variants: AdVariant[];
  audience: {
    ageRange: string;
    interests: string[];
    locations: string[];
  };
  budget: {
    daily: number;
    recommended: number;
    duration: number;
  };
  platforms: string[];
}

interface CampaignBlueprintProps {
  data: CampaignBlueprintData;
  onConfirm: () => void;
  onEdit: () => void;
}

export function CampaignBlueprint({ data, onConfirm, onEdit }: CampaignBlueprintProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-Generated Campaign
        </Badge>
        <h1 className="text-3xl font-bold mb-2">{data.productName}</h1>
        <p className="text-muted-foreground">
          Here's your optimized campaign blueprint
        </p>
      </div>

      {/* Ad Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ad Variants</CardTitle>
          <CardDescription>3 AI-generated ad variations for A/B testing</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {data.variants.map((variant, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Badge variant="outline">Variant {i + 1}</Badge>
              <h4 className="font-semibold text-sm">{variant.headline}</h4>
              <p className="text-xs text-muted-foreground line-clamp-3">{variant.body}</p>
              <Button size="sm" variant="secondary" className="w-full">
                {variant.cta}
              </Button>
              {variant.predictedCtr && (
                <p className="text-xs text-center text-muted-foreground">
                  Predicted CTR: {(variant.predictedCtr * 100).toFixed(1)}%
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Audience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Age Range</p>
              <Badge variant="secondary">{data.audience.ageRange}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Interests</p>
              <div className="flex flex-wrap gap-1">
                {data.audience.interests.map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Locations</p>
              <div className="flex flex-wrap gap-1">
                {data.audience.locations.map((loc, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    {loc}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Budget</span>
              <span className="font-bold text-lg">${data.budget.daily}/day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recommended</span>
              <span className="text-primary">${data.budget.recommended}/day</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Campaign Duration
              </span>
              <span>{data.budget.duration} days</span>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Total Investment</p>
              <p className="text-2xl font-bold">
                ${data.budget.daily * data.budget.duration}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platforms */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-2">Publishing to</p>
              <div className="flex gap-2">
                {data.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onEdit}>
                Edit Campaign
              </Button>
              <Button onClick={onConfirm}>
                Confirm & Publish
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
