import { useParams } from "react-router-dom";
import { useContent } from "@/hooks/useContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const NewsArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { useContentQuery } = useContent();

  // Fetch one article using its slug
  const { data, isLoading } = useContentQuery({
    contentType: "news",
    slug, // assumes your API supports querying by slug
    limit: 1,
  });

  const article = data?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Article not found</h1>
          <p className="text-muted-foreground">
            Sorry, we couldnΓÇÖt find the article youΓÇÖre looking for.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <p className="text-muted-foreground mb-6">
          {article.published_at ? new Date(article.published_at).toLocaleDateString() : ""}
        </p>
        <img
          src={article.featured_image}
          alt={article.title}
          className="w-full max-h-[500px] object-cover rounded-lg mb-8"
        />
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>
      <Footer />
    </div>
  );
};

export default NewsArticlePage;
