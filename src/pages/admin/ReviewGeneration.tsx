
import React from 'react';
import ReviewGenerator from '@/components/admin/ReviewGenerator';

const ReviewGeneration = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Review Generation</h1>
        <p className="text-muted-foreground">
          Generate comprehensive product reviews with real-time data, specifications, and purchase links.
        </p>
      </div>
      
      <div className="flex justify-center">
        <ReviewGenerator />
      </div>
    </div>
  );
};

export default ReviewGeneration;
