import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useProjectUsers, ProjectUser } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import { Search, Plus, Edit, Trash2, User, Mail, Shield } from 'lucide-react';
import { usePageAccess } from '@/hooks/usePageAccess';
import AddProjectUserDialog from '@/components/shop/AddProjectUserDialog';
import EditProjectUserDialog from '@/components/shop/EditProjectUserDialog';
import DeleteProjectUserDialog from '@/components/shop/DeleteProjectUserDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ProjectUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProjectUser | null>(null);
  const [profileImageModal, setProfileImageModal] = useState<{ isOpen: boolean; image: string; username: string }>({
    isOpen: false,
    image: '',
    username: '',
  });
  const { hasAction } = usePrivilege();
  const { navigateToPage } = usePageAccess();

  // Fetch project users data
  const { data, isLoading, isError, error, refetch } = useProjectUsers();

  // Filter users based on search term
  const filteredUsers =
    data?.ProjectUsers?.filter(
      (user: ProjectUser) =>
        searchTerm === '' ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Calculate pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleAddUser = () => {
    if (hasAction('project_users', 'add_project_users')) {
      setIsAddDialogOpen(true);
    } else {
      toast.error('You do not have permission to add project users');
    }
  };

  const handleEditUser = (user: ProjectUser) => {
    if (hasAction('project_users', 'edit_project_users')) {
      setSelectedUser(user);
      setIsEditDialogOpen(true);
    } else {
      toast.error('You do not have permission to edit project users');
    }
  };

  const handleDeleteUser = (user: ProjectUser) => {
    if (hasAction('project_users', 'delete_project_users')) {
      setSelectedUser(user);
      setIsDeleteDialogOpen(true);
    } else {
      toast.error('You do not have permission to delete project users');
    }
  };

  const handleAddSuccess = () => {
    refetch();
    toast.success('Project user added successfully');
  };

  const handleEditSuccess = () => {
    refetch();
    toast.success('Project user updated successfully');
  };

  const handleDeleteSuccess = () => {
    refetch();
    toast.success('Project user deleted successfully');
  };

  const handleProfileImageClick = (image: string, username: string) => {
    setProfileImageModal({
      isOpen: true,
      image,
      username,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading project users</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Users</h1>
            <p className="text-muted-foreground">Manage project users and their permissions</p>
          </div>
          {hasAction('project_users', 'add_project_users') && (
            <Button onClick={handleAddUser}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Users</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Two-Factor</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No project users found</p>
                        {searchTerm && (
                          <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.profile ? (
                          <div className="relative group">
                            <img
                              src={user.profile.startsWith('data:') ? user.profile : `data:image/jpeg;base64,${user.profile}`}
                              alt={`${user.username}'s profile`}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200 cursor-pointer transition-transform hover:scale-105"
                              onClick={() => user.profile && handleProfileImageClick(user.profile, user.username)}
                            />
                            {/* Profile image indicator */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {user.username}
                              </div>
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black mx-auto"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            {/* No profile image indicator */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">ID: {user.MembershipId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role || 'No Role'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.TwoAuth_enabled ? 'default' : 'outline'}>
                          {user.TwoAuth_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_Login ? (
                          format(new Date(user.last_Login), 'MMM dd, yyyy HH:mm')
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {hasAction('project_users', 'edit_project_users') && (
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasAction('project_users', 'delete_project_users') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AddProjectUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
      />
      <EditProjectUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />
      <DeleteProjectUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onSuccess={handleDeleteSuccess}
      />

      {/* Profile Image Modal */}
      <Dialog open={profileImageModal.isOpen} onOpenChange={(open) => setProfileImageModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {profileImageModal.username}'s Profile
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={profileImageModal.image.startsWith('data:') ? profileImageModal.image : `data:image/jpeg;base64,${profileImageModal.image}`}
              alt={`${profileImageModal.username}'s profile`}
              className="h-64 w-64 rounded-lg object-cover border border-gray-200"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setProfileImageModal(prev => ({ ...prev, isOpen: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ProjectUsers;
