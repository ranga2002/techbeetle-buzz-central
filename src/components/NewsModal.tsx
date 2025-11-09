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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-background">
        <OpenGraphMeta 
          title={title}
          description={excerpt}
          image={featuredImage}
          url={slug ? `${window.location.origin}/news/${slug}` : window.location.href}
        />
        
        <div className="relative overflow-y-auto max-h-[95vh]">
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
            <div className="relative w-full h-[500px] overflow-hidden">
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
          <div className="px-4 sm:px-8 md:px-16 lg:px-24 py-8 -mt-32 relative z-10">
            {/* Title Card with elegant design */}
            <Card className="mb-8 border-none shadow-2xl bg-background">
              <CardContent className="p-8 md:p-12">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {title}
                </h1>
                
                {/* Author and Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                  {author && (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 ring-2 ring-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {author.full_name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-base text-foreground">{author.full_name || 'Anonymous'}</p>
                        {author.username && <p className="text-xs text-muted-foreground">@{author.username}</p>}
                      </div>
                    </div>
                  )}
                  
                  <Separator orientation="vertical" className="h-10" />
                  
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {publishedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}</span>
                      </div>
                    )}
                    {readingTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{readingTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border/50">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{viewsCount || 0}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">{likesCount || 0}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium">{comments.length}</span>
                  </Button>

                  <div className="flex-1" />

                  {user && (
                    <Button
                      variant={isBookmarked(id) ? "default" : "outline"}
                      size="sm"
                      onClick={handleBookmarkToggle}
                      disabled={isTogglingBookmark}
                      className="gap-2"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked(id) ? 'fill-current' : ''}`} />
                      {isBookmarked(id) ? 'Saved' : 'Save'}
                    </Button>
                  )}

                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Excerpt - Magazine style */}
            {excerpt && (
              <div className="mb-10">
                <p className="text-2xl md:text-3xl text-muted-foreground leading-relaxed font-serif italic border-l-4 border-primary pl-8 py-4">
                  {excerpt}
                </p>
              </div>
            )}

            {/* Article Body */}
            <article className="mb-12">
              <div 
                className="prose prose-lg md:prose-xl dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-6
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:shadow-lg"
                dangerouslySetInnerHTML={{ __html: cleanContent?.replace(/\n\n/g, '</p><p>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '' }}
              />
            </article>

            {/* Source Info */}
            {sourceUrl && (
              <Card className="mb-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-background">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Original Source</p>
                      <p className="text-xl font-bold mb-4 text-foreground">{sourceName || 'External Article'}</p>
                      <Button asChild variant="default" size="lg" className="gap-3 shadow-lg">
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-5 h-5" />
                          Read Full Article
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            {showComments && (
              <Card className="border-border/50 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    Comments ({comments.length})
                  </h3>
                  
                  {user ? (
                    <form onSubmit={handleCommentSubmit} className="mb-10">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts on this article..."
                        rows={4}
                        className="resize-none text-base mb-4"
                      />
                      <Button type="submit" disabled={isSubmitting || !newComment.trim()} size="lg">
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </form>
                  ) : (
                    <Card className="mb-10 bg-muted/30 border-dashed">
                      <CardContent className="p-8 text-center">
                        <p className="text-lg text-muted-foreground mb-4">Sign in to join the conversation</p>
                        <Button variant="default" size="lg">Sign In</Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-6">
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
    <div className={`${depth > 0 ? 'ml-16 mt-6' : 'mb-8'}`}>
      <Card className={`border-border/40 ${depth > 0 ? 'bg-muted/20' : 'shadow-md'}`}>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-border flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {comment.profiles?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-base">{comment.profiles?.full_name || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-base leading-relaxed mb-4 text-foreground/90">{comment.comment_text}</p>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                  className={`h-9 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <ThumbsUp className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-semibold">{likesCount}</span>
                </Button>
                
                {depth < maxDepth && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-9 text-muted-foreground"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                )}
              </div>
              
              {showReplyForm && (
                <div className="mt-6 space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="resize-none"
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
        <div className="mt-4">
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
