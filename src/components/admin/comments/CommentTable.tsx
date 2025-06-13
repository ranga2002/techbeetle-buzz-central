
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';
import type { Tables, Database } from '@/integrations/supabase/types';

type Comment = Tables<'comments'> & {
  profiles: Pick<Tables<'profiles'>, 'full_name'> | null;
  content: Pick<Tables<'content'>, 'title'> | null;
};

type CommentStatus = Database['public']['Enums']['comment_status'];

interface CommentTableProps {
  comments: Comment[] | undefined;
  onStatusUpdate: (commentId: string, status: CommentStatus) => void;
  onDelete: (commentId: string) => void;
  isUpdating: boolean;
}

const CommentTable: React.FC<CommentTableProps> = ({
  comments,
  onStatusUpdate,
  onDelete,
  isUpdating,
}) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Comment</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Content</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comments?.map((comment) => (
          <TableRow key={comment.id}>
            <TableCell className="max-w-xs">
              <p className="truncate">{comment.comment_text}</p>
            </TableCell>
            <TableCell>{comment.profiles?.full_name || 'Unknown'}</TableCell>
            <TableCell>{comment.content?.title || 'Unknown'}</TableCell>
            <TableCell>
              <Badge className={getStatusBadge(comment.status || 'pending')}>
                {comment.status}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(comment.created_at || '').toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStatusUpdate(comment.id, 'approved' as CommentStatus)}
                  disabled={isUpdating}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onStatusUpdate(comment.id, 'rejected' as CommentStatus)}
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CommentTable;
