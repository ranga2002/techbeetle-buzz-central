import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Eye, Heart, ExternalLink, MessageSquare, Bookmark, Calendar, Globe2, Hash, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { OpenGraphMeta } from '@/components/OpenGraphMeta';
import { ShareButtons } from '@/components/ShareButtons';
import { RelatedArticles } from '@/components/RelatedArticles';
import { cn } from '@/lib/utils';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: any | null;
}

interface CommentItemProps {
  comment: any;
  onReply: (parentId: string, replyText: string) => void;
  userId?: string;
}

const CommentItem = ({ comment, onReply, userId }: CommentItemProps) => {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback>{comment.profiles?.full_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{comment.profiles?.full_name || 'User'}</p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground">{comment.comment_text}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <button className="underline hover:text-primary" onClick={() => setShowReply(!showReply)}>
              Reply
            </button>
          </div>
          {showReply && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply"
                rows={2}
              />
              <Button
                size="sm"
                disabled={!replyText.trim() || !userId}
                onClick={() => {
                  onReply(comment.id, replyText);
                  setReplyText('');
                  setShowReply(false);
                }}
              >
                Post Reply
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NewsModal = ({ isOpen, onClose, newsItem }: NewsModalProps) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    if (!newsItem?.id || !isOpen) return;

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (full_name, username, avatar_url),
          replies:comments!parent_id (
            *,
            profiles:user_id (full_name, username, avatar_url)
          )
        `)
        .eq('content_id', newsItem.id)
        .eq('status', 'approved')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComments(data);
      }
    };

    fetchComments();

    const channel = supabase
      .channel(`comments-${newsItem.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [newsItem?.id, isOpen]);

  if (!newsItem) return null;

  const {
    id,
    title,
    excerpt,
    summary,
    content,
    content_raw,
    featured_image: featuredImage,
    image,
    published_at: publishedAt,
    views_count: viewsCount,
    likes_count: likesCount,
    reading_time: readingTime,
    categories: category,
    profiles: author,
    slug,
    source_name: sourceName,
    source_url: sourceUrl,
    url: articleUrl,
    source_country: sourceCountry,
    why_it_matters: whyItMatters,
    takeaways,
    key_points: keyPoints,
  } = newsItem;

  const displayImage = image || featuredImage || "https://placehold.co/1200x630?text=Tech+Beetle";
  const originalUrl = sourceUrl || articleUrl;

  const sanitizeText = (value: string) => {
    return value
      .replace(/\[\+?\d+\s*chars?\]/gi, "")
      .replace(/\[.*?chars?\]/gi, "")
      .replace(/\.\.\.\s*$/, "")
      .trim();
  };

  const description = sanitizeText(summary || excerpt || "Latest insights from the tech and gadget world.");
  const cleanedExcerpt = description;
  const hasMeaningfulBody = (value?: string | null) => {
    if (!value) return false;
    return value.replace(/\s+/g, "").length >= 400;
  };

  const preferredBody = hasMeaningfulBody(content_raw) ? content_raw : content;
  const contentBodyRaw = preferredBody || description || "";
  const contentBody = sanitizeText(contentBodyRaw);
  const paragraphs = contentBody.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
  const publishedLabel = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : "Recently";

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in to comment", variant: "destructive" });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content_id: id,
          user_id: user.id,
          comment_text: newComment.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: "Comment submitted for approval" });
      setNewComment('');
    } catch (error) {
      toast({ title: "Failed to submit comment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, replyText: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content_id: id,
          user_id: user.id,
          parent_id: parentId,
          comment_text: replyText.trim(),
          status: 'pending'
        });

      if (error) throw error;
      toast({ title: "Reply submitted for approval" });
    } catch (error) {
      toast({ title: "Failed to submit reply", variant: "destructive" });
    }
  };

  const handleBookmarkToggle = () => {
    if (!user) {
      toast({ title: "Please log in to bookmark", variant: "destructive" });
      return;
    }

    if (isBookmarked(id)) {
      removeBookmark.mutate(id);
    } else {
      addBookmark.mutate(id);
    }
  };

  const isTogglingBookmark = addBookmark.isPending || removeBookmark.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-background">
        <OpenGraphMeta 
          title={title}
          description={cleanedExcerpt}
          image={displayImage}
          url={slug ? `${window.location.origin}/news/${slug}` : window.location.href}
        />
        
        <div className="relative overflow-y-auto max-h-[90vh]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur hover:bg-background"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="relative w-full h-[360px] overflow-hidden">
            <img 
              src={displayImage} 
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            {category && (
              <Badge 
                className="absolute top-6 left-6 text-sm px-4 py-2 shadow-lg rounded-full"
                style={{ backgroundColor: category.color, color: 'white' }}
              >
                {category.name}
              </Badge>
            )}
            {sourceName && (
              <Badge
                variant="secondary"
                className="absolute top-6 right-6 text-xs px-3 py-1 rounded-full shadow"
              >
                {sourceName}
              </Badge>
            )}
          </div>

          <div className="px-6 sm:px-10 md:px-12 py-8 bg-gradient-to-b from-background via-background to-muted/20">
            <Card className="mb-8 border-border/60 shadow-lg bg-card/90 backdrop-blur">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {sourceCountry && (
                    <span className="inline-flex items-center gap-2">
                      <Globe2 className="w-4 h-4" />
                      {sourceCountry.toUpperCase()}
                    </span>
                  )}
                  {category?.name && (
                    <span className="inline-flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      {category.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">
                  {title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{publishedLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{readingTime ? `${readingTime} min read` : '5 min read'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{viewsCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>{likesCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {author?.full_name?.[0]?.toUpperCase() || author?.username?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {author?.full_name || author?.username || 'TechBeetle'}
                    </p>
                    {author?.username && (
                      <p className="text-xs text-muted-foreground">@{author.username}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {user && (
                    <Button
                      variant={isBookmarked(id) ? "default" : "outline"}
                      size="sm"
                      onClick={handleBookmarkToggle}
                      disabled={isTogglingBookmark}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(id) ? 'fill-current' : ''}`} />
                      {isBookmarked(id) ? 'Saved' : 'Save'}
                    </Button>
                  )}
                  {originalUrl && (
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Read original
                      </a>
                    </Button>
                  )}
                  <ShareButtons 
                    title={title}
                    description={cleanedExcerpt}
                    url={slug ? `/news/${slug}` : window.location.pathname}
                    image={displayImage}
                  />
                </div>
              </CardContent>
            </Card>

            {cleanedExcerpt && (
              <div className="mb-8">
                <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-serif border-l-4 border-primary pl-6 py-3 bg-card/50 rounded-r-2xl">
                  {cleanedExcerpt}
                </p>
              </div>
            )}

            {Array.isArray(keyPoints) && keyPoints.length > 0 && (
              <Card className="mb-6 bg-muted/40 border-muted/50">
                <CardContent className="p-5 space-y-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Highlights</p>
                  <ul className="text-sm text-foreground list-disc ml-4 space-y-1">
                    {keyPoints.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {whyItMatters && (
              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardContent className="p-5 space-y-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary">Why it matters</p>
                  <p className="text-sm text-foreground">{whyItMatters}</p>
                  {Array.isArray(takeaways) && takeaways.length > 0 && (
                    <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                      {takeaways.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            <article className="mb-10">
              <Card className="border-border/60 bg-card/80 backdrop-blur">
                <CardContent className="p-6 md:p-8">
                  <div 
                    className="prose prose-base md:prose-lg dark:prose-invert max-w-none
                      prose-headings:font-bold prose-headings:text-foreground
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                      prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-4
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-lg prose-img:shadow-md
                      prose-ul:my-4 prose-ol:my-4 prose-li:my-1"
                  >
                    {paragraphs.length > 0
                      ? paragraphs.map((paragraph: string, index: number) => (
                          <p
                            key={index}
                            dangerouslySetInnerHTML={{
                              __html: paragraph
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br />'),
                            }}
                          />
                        ))
                      : cleanedExcerpt}
                  </div>
                </CardContent>
              </Card>
            </article>

            {originalUrl && (
              <Card className="mb-8 border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Original Source</p>
                      <p className="text-lg font-bold mb-3 text-foreground">{sourceName || 'External Article'}</p>
                      <Button asChild variant="default" size="default" className="gap-2">
                        <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Read Full Article
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <RelatedArticles currentArticleId={id} categoryId={category?.slug} />

            {showComments && (
              <Card className="mt-8 border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    Comments ({comments.length})
                  </h3>
                  
                  {user ? (
                    <form onSubmit={handleCommentSubmit} className="mb-8">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts on this article..."
                        rows={3}
                        className="resize-none text-sm mb-3"
                      />
                      <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </form>
                  ) : (
                    <Card className="mb-8 bg-muted/30 border-dashed">
                      <CardContent className="p-6 text-center">
                        <p className="text-base text-muted-foreground mb-3">Sign in to join the conversation</p>
                        <Button variant="default">Sign In</Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        onReply={handleReply}
                        userId={user?.id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;
