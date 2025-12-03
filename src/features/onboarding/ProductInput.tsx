import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, FileText, Loader2 } from 'lucide-react';

interface ProductInputProps {
  onSubmit: (data: { type: 'url' | 'text'; value: string }) => void;
  isLoading?: boolean;
}

export function ProductInput({ onSubmit, isLoading }: ProductInputProps) {
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (inputType === 'url' && url.trim()) {
      onSubmit({ type: 'url', value: url.trim() });
    } else if (inputType === 'text' && description.trim()) {
      onSubmit({ type: 'text', value: description.trim() });
    }
  };

  const isValid = inputType === 'url' ? url.trim().length > 0 : description.trim().length > 10;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">What are you advertising?</CardTitle>
        <CardDescription>
          Share your product URL or describe what you're promoting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'url' | 'text')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Website URL
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Describe It
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <Input
              type="url"
              placeholder="https://yourproduct.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-lg py-6"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              We'll analyze your website to understand your product, brand, and audience.
            </p>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="Describe your product or service in detail. Include key features, target audience, and what makes it unique..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px] text-base"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The more detail you provide, the better your AI-generated ads will be.
            </p>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="w-full mt-6"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Generate My Campaign'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
