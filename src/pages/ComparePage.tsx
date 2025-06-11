
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const ComparePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Product Comparison</h1>
          <p className="text-muted-foreground text-lg">
            Compare specs, features, and prices of your favorite tech products
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Start Comparing</CardTitle>
              <CardDescription>
                Select products to compare side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product 1</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search for a product..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Product 2</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search for a product..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <Button className="w-full">Compare Products</Button>
            </CardContent>
          </Card>

          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Product comparison feature coming soon! You'll be able to compare specifications, 
              features, and prices of different tech products side by side.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComparePage;
