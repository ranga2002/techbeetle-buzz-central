import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';

const BookmarksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookmarks, isLoading } = useBookmarks();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Bookmark className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Sign in to view bookmarks</h2>
              <p className="text-muted-foreground">
                Save articles for later reading by signing in to your account
              </p>
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Bookmark className="w-10 h-10" />
            My Bookmarks
          </h1>
          <p className="text-muted-foreground text-lg">
            Articles you've saved for later reading
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark: any) => (
              <ContentCard
                key={bookmark.id}
                id={bookmark.content.id}
                title={bookmark.content.title}
                excerpt={bookmark.content.excerpt}
                featuredImage={bookmark.content.featured_image}
                contentType={bookmark.content.content_type}
                category={bookmark.content.categories}
                author={bookmark.content.profiles}
                viewsCount={bookmark.content.views_count || 0}
                likesCount={bookmark.content.likes_count || 0}
                readingTime={bookmark.content.reading_time}
                publishedAt={bookmark.content.published_at}
                onClick={() => navigate(`/content/${bookmark.content.slug || bookmark.content.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Bookmark className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">No bookmarks yet</h2>
              <p className="text-muted-foreground">
                Start bookmarking articles to save them for later reading
              </p>
              <Button onClick={() => navigate('/')}>Browse Articles</Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BookmarksPage;
