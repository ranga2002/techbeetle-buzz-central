
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const NewsApiFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling news-router edge function...');
      
      const { data, error: functionError } = await supabase.functions.invoke('news-router', {
        body: { query: 'technology gadgets ai' }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Failed to fetch news');
      }

      console.log('Function response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          News API Fetcher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchNews} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching News...
            </>
          ) : (
            'Fetch Latest Tech News'
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</div>
                <div><strong>Message:</strong> {result.message}</div>
                {result.count && <div><strong>Count:</strong> {result.count}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p>This will fetch the latest tech news from NewsAPI and add them to the content database.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsApiFetcher;
