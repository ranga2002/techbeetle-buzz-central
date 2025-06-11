
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CategoryTabs from '@/components/CategoryTabs';
import NewsCard from '@/components/NewsCard';
import Footer from '@/components/Footer';

const Index = () => {
  const featuredNews = [
    {
      title: "Google Pixel 9 Pro Review: AI Photography Reaches New Heights",
      excerpt: "The latest Pixel flagship brings groundbreaking computational photography features and enhanced AI capabilities that could set new industry standards.",
      category: "Reviews",
      author: "Alex Rivera",
      publishTime: "4 hours ago",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop",
      comments: 47,
      likes: 234,
      featured: true
    }
  ];

  const latestNews = [
    {
      title: "OpenAI Announces ChatGPT-5: The Next Evolution in AI Conversation",
      excerpt: "With improved reasoning capabilities and multimodal understanding, GPT-5 promises to revolutionize how we interact with AI assistants.",
      category: "AI",
      author: "Michael Zhang",
      publishTime: "6 hours ago", 
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2032&auto=format&fit=crop",
      comments: 89,
      likes: 412
    },
    {
      title: "Tesla Cybertruck Software Update Brings Gaming Console Features",
      excerpt: "The latest over-the-air update transforms the Cybertruck's massive display into a portable gaming powerhouse with Steam support.",
      category: "Automotive",
      author: "Sarah Johnson",
      publishTime: "8 hours ago",
      readTime: "4 min read", 
      image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=2070&auto=format&fit=crop",
      comments: 156,
      likes: 892
    },
    {
      title: "AMD Ryzen 9000 Series: Benchmark Results Leak Ahead of Launch",
      excerpt: "Early performance tests suggest significant improvements in both single-core and multi-core performance over the previous generation.",
      category: "Hardware",
      author: "David Kim",
      publishTime: "10 hours ago",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?q=80&w=2070&auto=format&fit=crop",
      comments: 203,
      likes: 567
    },
    {
      title: "Meta Quest 4 Rumors: What to Expect from the Next VR Headset",
      excerpt: "Industry insiders hint at revolutionary display technology and haptic feedback systems that could redefine virtual reality experiences.",
      category: "VR/AR",
      author: "Emma Thompson",
      publishTime: "12 hours ago",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=2056&auto=format&fit=crop",
      comments: 78,
      likes: 345
    },
    {
      title: "Samsung Galaxy Watch 7 vs Apple Watch Series 10: Ultimate Comparison",
      excerpt: "We put the latest smartwatches head-to-head in our comprehensive comparison covering design, features, battery life, and health tracking.",
      category: "Wearables",
      author: "Lisa Chen",
      publishTime: "14 hours ago",
      readTime: "9 min read",
      image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=2070&auto=format&fit=crop",
      comments: 124,
      likes: 789
    },
    {
      title: "Microsoft Copilot Gets Major Update with Advanced Code Generation",
      excerpt: "The AI coding assistant now supports more programming languages and offers improved context understanding for complex software development tasks.",
      category: "Software",
      author: "Robert Park",
      publishTime: "16 hours ago",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2070&auto=format&fit=crop",
      comments: 67,
      likes: 234
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        
        <CategoryTabs />
        
        {/* Featured News */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Featured Story</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredNews.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>
          </div>
        </section>

        {/* Latest News Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Latest News</h2>
              <a href="#" className="text-primary hover:underline font-medium">
                View All →
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestNews.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
