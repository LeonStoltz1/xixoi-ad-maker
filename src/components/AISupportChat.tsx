import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { invokeWithRetry } from '@/lib/retryWithBackoff';

export const AISupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await invokeWithRetry(
        supabase,
        'ai-support',
        { subject, message },
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      if (error) throw error;

      setResponse(data.ai_response);
      
      if (data.status === 'resolved') {
        toast.success('Issue resolved by AI');
      } else {
        toast.info('Ticket escalated to human support');
      }
    } catch (error: any) {
      console.error('Support error:', error);
      
      // Handle rate limit and credits exhausted errors
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast.error('AI service temporarily unavailable. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.message?.includes('credits exhausted')) {
        toast.error('AI service credits exhausted. Please contact support at info@stoltzone.com');
      } else {
        toast.error(error.message || 'Failed to submit ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Support
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!response ? (
          <>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Textarea
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 bg-muted">
              <p className="text-sm font-medium mb-2">AI Response:</p>
              <p className="text-sm">{response}</p>
            </div>
            <Button
              onClick={() => {
                setSubject('');
                setMessage('');
                setResponse('');
              }}
              variant="outline"
              className="w-full"
            >
              New Question
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};