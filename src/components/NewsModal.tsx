import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, User, MessageCircle, Heart, Share2, ExternalLink, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      user: { name: 'Tech Enthusiast', avatar: '/placeholder.svg' },
      content: 'Great article! Very informative and well-written.',
      timestamp: '2 hours ago',
      likes: 12
    },
    {
      id: '2',
      user: { name: 'Gadget Reviewer' },
      content: 'I had the same experience with this product. Thanks for sharing!',
      timestamp: '4 hours ago',
      likes: 8
    }
  ]);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  if (!newsItem) return null;

  const handleShare = async () => {
    const articleUrl = `${window.location.origin}/news/${newsItem.id}`;
    try {
      await navigator.share({
        title: newsItem.title,
        text: newsItem.excerpt || '',
        url: articleUrl,
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(articleUrl);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard",
      });
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Article removed from your favorites" : "Article added to your favorites",
    });
  };

  const handleComment = () => {
    if (comment.trim()) {
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully",
      });
      setComment('');
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
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
                  className="text-foreground leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: newsItem.content || newsItem.excerpt || '' }}
                />
              </div>

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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/news/${newsItem.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Original
                    </a>
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
                
                {/* Add Comment */}
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
                      <Button onClick={handleComment} disabled={!comment.trim()}>
                        Post Comment
                      </Button>
                    </div>
                  </CardContent>
                </Card>

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