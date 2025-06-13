
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, Eye } from 'lucide-react';
import type { Tables, Database } from '@/integrations/supabase/types';

type Content = Tables<'content'> & {
  profiles: Pick<Tables<'profiles'>, 'full_name'> | null;
  categories: Pick<Tables<'categories'>, 'name'> | null;
};

type ContentStatus = Database['public']['Enums']['content_status'];

interface ContentTableProps {
  content: Content[] | undefined;
  onStatusUpdate: (contentId: string, status: ContentStatus) => void;
  onDelete: (contentId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const ContentTable: React.FC<ContentTableProps> = ({
  content,
  onStatusUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {content?.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell>{item.profiles?.full_name || 'Unknown'}</TableCell>
            <TableCell className="capitalize">{item.content_type.replace('_', ' ')}</TableCell>
            <TableCell>{item.categories?.name || 'Uncategorized'}</TableCell>
            <TableCell>
              <Select
                value={item.status || 'draft'}
                onValueChange={(value) => 
                  onStatusUpdate(item.id, value as ContentStatus)
                }
                disabled={isUpdating}
              >
                <SelectTrigger className="w-32">
                  <Badge className={getStatusBadge(item.status || 'draft')}>
                    {item.status}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>{item.views_count || 0}</TableCell>
            <TableCell>
              {new Date(item.created_at || '').toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ContentTable;
