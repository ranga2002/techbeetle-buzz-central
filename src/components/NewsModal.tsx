import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, User, MessageCircle, Heart, Share2, ExternalLink, Link2, Twitter, Facebook, Copy, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
}

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem: {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    published_at?: string;
    views_count?: number;
    likes_count?: number;
    reading_time?: number;
    categories?: { name: string; color?: string };
    profiles?: { full_name?: string; username?: string; avatar_url?: string };
  } | null;
}

const NewsModal = ({ isOpen, onClose, newsItem }: NewsModalProps) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch comments in real-time
  useEffect(() => {
    if (!newsItem?.id || !isOpen) return;

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          comment_text,
          created_at,
          likes_count,
          user_id,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('content_id', newsItem.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      const formattedComments = data.map((c: any) => ({
        id: c.id,
        user: {
          name: c.profiles?.full_name || c.profiles?.username || 'Anonymous',
          avatar: c.profiles?.avatar_url
        },
        content: c.comment_text,
        timestamp: format(new Date(c.created_at), 'MMM d, yyyy'),
        likes: c.likes_count || 0
      }));

      setComments(formattedComments);
    };

    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${newsItem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `content_id=eq.${newsItem.id}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [newsItem?.id, isOpen]);

  if (!newsItem) return null;

  // Helper function to format and clean content
  const formatContent = (content: string) => {
    if (!content) return '';
    
    // Remove markdown-style formatting and clean up
    let cleaned = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n\n/g, '</p><p>') // Paragraph breaks
      .replace(/\n/g, '<br>'); // Line breaks
    
    // Wrap in paragraph tags
    if (!cleaned.startsWith('<p>')) {
      cleaned = '<p>' + cleaned + '</p>';
    }
    
    return cleaned;
  };

  // Extract source and original URL from content
  const extractSourceInfo = (content: string) => {
    const sourceMatch = content.match(/\*\*Source:\*\*\s*([^\n]*)/);
    const urlMatch = content.match(/\*\*Original URL:\*\*\s*([^\n]*)/);
    
    return {
      source: sourceMatch ? sourceMatch[1].trim() : null,
      originalUrl: urlMatch ? urlMatch[1].trim() : null,
      cleanContent: content
        .replace(/\*\*Source:\*\*[^\n]*/g, '')
        .replace(/\*\*Original URL:\*\*[^\n]*/g, '')
        .trim()
    };
  };

  const { source, originalUrl, cleanContent } = extractSourceInfo(newsItem.content || '');

  const handleShare = async (platform?: string) => {
    const articleUrl = window.location.href;
    const title = newsItem.title;
    const text = newsItem.excerpt || '';

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(articleUrl);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard",
      });
      setShowSharePanel(false);
    } else {
      // Native share or show share panel
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url: articleUrl });
        } catch (error) {
          setShowSharePanel(!showSharePanel);
        }
      } else {
        setShowSharePanel(!showSharePanel);
      }
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Article removed from your favorites" : "Article added to your favorites",
    });
  };

  const handleComment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to comment",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content_id: newsItem.id,
          user_id: user.id,
          comment_text: comment.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Comment submitted!",
        description: "Your comment is pending approval",
      });
      setComment('');
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <DialogTitle className="text-xl font-bold leading-tight mb-2">
                  {newsItem.title}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {newsItem.categories && (
                    <Badge 
                      variant="secondary" 
                      style={{ backgroundColor: `${newsItem.categories.color}20`, color: newsItem.categories.color }}
                    >
                      {newsItem.categories.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {newsItem.profiles?.full_name || newsItem.profiles?.username || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {newsItem.published_at && format(new Date(newsItem.published_at), 'MMM d, yyyy')}
                  </div>
                  {newsItem.reading_time && <span>{newsItem.reading_time} min read</span>}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4">
              {/* Featured Image */}
              {newsItem.featured_image && (
                <div className="mb-6">
                  <img
                    src={newsItem.featured_image}
                    alt={newsItem.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="prose max-w-none mb-8">
                <div 
                  className="text-foreground leading-relaxed text-justify space-y-4"
                  dangerouslySetInnerHTML={{ __html: formatContent(cleanContent) }}
                />
              </div>

              {/* Source Information */}
              {(source || originalUrl) && (
                <Card className="mb-6 bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Source Information</span>
                    </div>
                    {source && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Source:</strong> {source}
                      </p>
                    )}
                    {originalUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="h-8"
                      >
                        <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Read Original Article
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Engagement Actions */}
              <div className="flex items-center justify-between py-4 border-t border-b">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={isLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                    {(newsItem.likes_count || 0) + (isLiked ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {comments.length}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {newsItem.views_count || 0} views
                  </span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => handleShare()}>
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    
                    {/* Share Panel */}
                    {showSharePanel && (
                      <Card className="absolute top-full mt-2 right-0 z-50 w-48 shadow-lg">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start"
                              onClick={() => handleShare('twitter')}
                            >
                              <Twitter className="w-4 h-4 mr-2 text-blue-500" />
                              Share on Twitter
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start"
                              onClick={() => handleShare('facebook')}
                            >
                              <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                              Share on Facebook
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start"
                              onClick={() => handleShare('copy')}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {originalUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Original
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
                
                {/* Add Comment */}
                {user ? (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mb-3 resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleComment} disabled={!comment.trim() || isSubmitting}>
                          {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert className="mb-6">
                    <LogIn className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Please log in to comment on this article</span>
                      <Button size="sm" onClick={() => {
                        onClose();
                        navigate('/auth');
                      }}>
                        Log In
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback>
                              {comment.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.user.name}</span>
                              <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-foreground mb-2">{comment.content}</p>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <Heart className="w-3 h-3 mr-1" />
                              {comment.likes}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;