import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle, 
  Target,
  Search,
  RefreshCw,
  Building2,
  BarChart3
} from 'lucide-react';
import { analyzeCategoryTrends, CategoryTrends, CompetitorInsight } from './competitor-insights';
import { getTrendingCompetitors } from './competitor-scraper';

interface CompetitorInsightsPanelProps {
  category?: string;
  onInsightSelect?: (insight: CompetitorInsight) => void;
}

export function CompetitorInsightsPanel({ 
  category = 'general',
  onInsightSelect 
}: CompetitorInsightsPanelProps) {
  const [trends, setTrends] = useState<CategoryTrends | null>(null);
  const [topBrands, setTopBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'saas', label: 'SaaS' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'services', label: 'Services' },
  ];

  useEffect(() => {
    loadTrends();
  }, [selectedCategory]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const [categoryTrends, brands] = await Promise.all([
        analyzeCategoryTrends(selectedCategory),
        getTrendingCompetitors(selectedCategory),
      ]);
      setTrends(categoryTrends);
      setTopBrands(brands);
    } catch (error) {
      console.error('Error loading competitor insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: CompetitorInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-green-500" />;
      case 'threat': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'recommendation': return <Target className="h-4 w-4 text-purple-500" />;
    }
  };

  const getInsightBadgeVariant = (type: CompetitorInsight['type']) => {
    switch (type) {
      case 'trend': return 'default';
      case 'opportunity': return 'secondary';
      case 'threat': return 'destructive';
      case 'recommendation': return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Competitor Intelligence
            </CardTitle>
            <CardDescription>
              AI-powered insights from competitor ad analysis
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadTrends}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selector */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4 mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : trends?.insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No insights available yet.</p>
                <p className="text-sm">Add competitor ads to start generating insights.</p>
              </div>
            ) : (
              trends?.insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onInsightSelect?.(insight)}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{insight.title}</span>
                        <Badge variant={getInsightBadgeVariant(insight.type)} className="text-xs">
                          {insight.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <p className="text-sm text-primary">
                        💡 {insight.actionable}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            {trends && (
              <>
                {/* Tone Profile */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Category Tone Profile</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge>{trends.toneProfile.dominant}</Badge>
                    {trends.toneProfile.emerging.map((tone) => (
                      <Badge key={tone} variant="outline">{tone}</Badge>
                    ))}
                  </div>
                </div>

                {/* Common Hooks */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Popular Hook Types</h4>
                  <div className="flex gap-2 flex-wrap">
                    {trends.commonHooks.length > 0 ? (
                      trends.commonHooks.map((hook) => (
                        <Badge key={hook} variant="secondary">{hook}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No data available</span>
                    )}
                  </div>
                </div>

                {/* Popular CTAs */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Top CTAs</h4>
                  <div className="flex gap-2 flex-wrap">
                    {trends.popularCTAs.length > 0 ? (
                      trends.popularCTAs.map((cta) => (
                        <Badge key={cta} variant="outline">{cta}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No data available</span>
                    )}
                  </div>
                </div>

                {/* Average Ad Length */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">Average Ad Length</h4>
                  <p className="text-2xl font-bold">{trends.avgAdLength} chars</p>
                  <p className="text-sm text-muted-foreground">
                    {trends.avgAdLength < 100 ? 'Short and punchy' : 
                     trends.avgAdLength < 200 ? 'Medium length' : 'Detailed copy'}
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Top Brands */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Trending in {selectedCategory}</h4>
              {topBrands.length > 0 ? (
                topBrands
                  .filter((brand) => 
                    brand.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((brand, index) => (
                    <div
                      key={brand}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{brand}</span>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No competitor data available yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
