import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Eye, Heart, Share2, ExternalLink, ThumbsUp, MessageSquare, Bookmark, Calendar, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { OpenGraphMeta } from '@/components/OpenGraphMeta';
import { Separator } from '@/components/ui/separator';
import { ShareButtons } from '@/components/ShareButtons';
import { RelatedArticles } from '@/components/RelatedArticles';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: any | null;
}

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
    content,
    featured_image: featuredImage,
    published_at: publishedAt,
    views_count: viewsCount,
    likes_count: likesCount,
    reading_time: readingTime,
    categories: category,
    profiles: author,
    slug,
  } = newsItem;

  const extractSourceInfo = (content: string) => {
    const sourceMatch = content?.match(/\*\*Source:\*\*\s*([^\n]*)/);
    const urlMatch = content?.match(/\*\*Original URL:\*\*\s*([^\n]*)/);
    
    return {
      sourceName: sourceMatch ? sourceMatch[1].trim() : null,
      sourceUrl: urlMatch ? urlMatch[1].trim() : null,
      cleanContent: content?.replace(/\*\*Source:\*\*[^\n]*/g, '').replace(/\*\*Original URL:\*\*[^\n]*/g, '').trim()
    };
  };

  const { sourceName, sourceUrl, cleanContent } = extractSourceInfo(content || '');

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-background">
        <OpenGraphMeta 
          title={title}
          description={excerpt}
          image={featuredImage}
          url={slug ? `${window.location.origin}/news/${slug}` : window.location.href}
        />
        
        <div className="relative overflow-y-auto max-h-[90vh]">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur hover:bg-background"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Hero Section with Image */}
          {featuredImage && (
            <div className="relative w-full h-[400px] overflow-hidden">
              <img 
                src={featuredImage} 
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              
              {category && (
                <Badge 
                  className="absolute top-8 left-8 text-base px-5 py-2 shadow-lg"
                  style={{ backgroundColor: category.color, color: 'white' }}
                >
                  {category.name}
                </Badge>
              )}
            </div>
          )}

          {/* Article Content */}
          <div className="px-6 sm:px-10 md:px-16 py-8 -mt-24 relative z-10">
            {/* Title Card with elegant design */}
            <Card className="mb-8 border-none shadow-2xl bg-background">
              <CardContent className="p-6 md:p-10">
                <h1 className="text-2xl md:text-4xl font-bold mb-5 leading-tight text-foreground">
                  {title}
                </h1>
                
                {/* Author and Meta */}
                <div className="flex flex-wrap items-center gap-3 text-sm mb-5">
                  {author && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-10 h-10 ring-2 ring-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {author.full_name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{author.full_name || 'Anonymous'}</p>
                        {author.username && <p className="text-xs text-muted-foreground">@{author.username}</p>}
                      </div>
                    </div>
                  )}
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                    {publishedAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}</span>
                      </div>
                    )}
                    {readingTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{readingTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-5 border-t border-border/50">
                  <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-medium">{viewsCount || 0}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="font-medium">{likesCount || 0}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="gap-1.5 h-8 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="font-medium">{comments.length}</span>
                  </Button>

                  <div className="flex-1" />

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

                  <ShareButtons 
                    title={title}
                    description={excerpt}
                    url={slug ? `/news/${slug}` : window.location.pathname}
                    image={featuredImage}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Excerpt - Magazine style */}
            {excerpt && (
              <div className="mb-8">
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-serif italic border-l-4 border-primary pl-6 py-3">
                  {excerpt}
                </p>
              </div>
            )}

            {/* Article Body */}
            <article className="mb-10">
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
                {cleanContent?.split('\n\n').map((paragraph, index) => {
                  if (!paragraph.trim()) return null;
                  
                  const formattedParagraph = paragraph
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />');
                  
                  return (
                    <p key={index} dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
                  );
                })}
              </div>
            </article>

            {/* Source Info */}
            {sourceUrl && (
              <Card className="mb-8 border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Original Source</p>
                      <p className="text-lg font-bold mb-3 text-foreground">{sourceName || 'External Article'}</p>
                      <Button asChild variant="default" size="default" className="gap-2">
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Read Full Article
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Articles */}
            <RelatedArticles currentArticleId={id} categoryId={category?.slug} />

            {/* Comments Section */}
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

interface CommentItemProps {
  comment: any;
  onReply: (parentId: string, replyText: string) => void;
  depth?: number;
  userId?: string;
}

const CommentItem = ({ comment, onReply, depth = 0, userId }: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const { toast } = useToast();
  const maxDepth = 3;

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', userId)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkLikeStatus();
  }, [comment.id, userId]);

  const handleLikeToggle = async () => {
    if (!userId) {
      toast({ title: "Please log in to like comments", variant: "destructive" });
      return;
    }

    setIsLiking(true);
    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', userId);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: comment.id, user_id: userId });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      toast({ title: "Failed to update like", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-12 mt-4' : 'mb-6'}`}>
      <Card className={`border-border/40 ${depth > 0 ? 'bg-muted/20' : 'shadow-sm'}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-border flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {comment.profiles?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">{comment.profiles?.full_name || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-sm leading-relaxed mb-3 text-foreground/90">{comment.comment_text}</p>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                  className={`h-8 text-xs ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{likesCount}</span>
                </Button>
                
                {depth < maxDepth && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Reply
                  </Button>
                )}
              </div>
              
              {showReplyForm && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim()}
                    >
                      Post Reply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply: any) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply}
              depth={depth + 1}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsModal;
