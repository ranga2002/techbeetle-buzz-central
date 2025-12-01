
import React from 'react';
import NewsApiFetcher from '@/components/admin/NewsApiFetcher';

const NewsApiTest = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">News API Test</h1>
        <p className="text-muted-foreground">
          Test the automatic news fetching functionality to import the latest tech news.
        </p>
      </div>
      
      <div className="flex justify-center">
        <NewsApiFetcher />
      </div>
    </div>
  );
};

export default NewsApiTest;
