import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TeamMemberFormDialog } from "@/components/equipe/TeamMemberFormDialog";
import { useTeamMembers, useDeleteTeamMember, TeamMember } from "@/hooks/useTeamMembers";
import { useDemands } from "@/hooks/useDemands";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronDown, 
  ChevronUp, 
  Briefcase, 
  Kanban, 
  Plus, 
  Pencil, 
  Trash2,
  Users,
  Mail,
  Shield,
  Star,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUserRole } from "@/hooks/useUserRole";
import SupervisaoContent from "@/components/equipe/SupervisaoContent";

export default function Equipe() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const { user } = useAuth();
  const { isGestao } = useUserRole();
  const { data: teamMembers, isLoading } = useTeamMembers();
  const { data: demands } = useDemands();
  const deleteMember = useDeleteTeamMember();

  // Fetch user roles for all team members with user_ids
  const { data: userRoles } = useQuery({
    queryKey: ['team-member-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role_type');
      
      if (error) throw error;
      return data || [];
    },
  });

  const getRoleTypeLabel = (userId: string | null) => {
    if (!userId || !userRoles) return null;
    const role = userRoles.find(r => r.user_id === userId);
    if (!role?.role_type) return null;
    
    const labels: Record<string, { label: string; color: string }> = {
      'gestao': { label: 'Gestão', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
      'producao': { label: 'Produção', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
      'vendedor': { label: 'Vendedor', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
      'cliente': { label: 'Cliente', color: 'bg-gray-500/20 text-gray-500 border-gray-500/30' },
    };
    return labels[role.role_type] || null;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEdit = (member: TeamMember, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: TeamMember, e: React.MouseEvent) => {
    e.stopPropagation();
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      deleteMember.mutate({ id: memberToDelete.id, name: memberToDelete.name });
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const getMemberDemands = (memberId: string) => {
    return demands?.filter(
      d => d.assigned_to === memberId && d.status !== 'done' && d.status !== 'cancelled' && !d.is_archived
    ) || [];
  };

  const getRoleBadgeColor = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('gestão') || lowerRole.includes('gestor') || lowerRole.includes('diretor') || lowerRole.includes('gerente')) {
      return 'bg-primary/20 text-primary border-primary/30';
    }
    if (lowerRole.includes('design') || lowerRole.includes('criativo')) {
      return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
    }
    if (lowerRole.includes('dev') || lowerRole.includes('programador')) {
      return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    }
    if (lowerRole.includes('vendedor')) {
      return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    }
    return 'bg-secondary text-secondary-foreground';
  };

  const isCurrentUser = (member: TeamMember) => {
    return member.user_id === user?.id;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Equipe</h1>
            <p className="text-muted-foreground">Gerencie a equipe e suas demandas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const activeMembers = teamMembers?.filter(m => !m.is_archived) || [];

  const TeamMembersContent = () => (
    <>
      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Membro
        </Button>
      </div>

      {activeMembers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum membro cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando membros à sua equipe
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Membro
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMembers.map((member) => {
            const isExpanded = expandedId === member.id;
            const memberDemands = getMemberDemands(member.id);
            const isCurrent = isCurrentUser(member);
            const accessLevel = getRoleTypeLabel(member.user_id);

            return (
              <Card
                key={member.id}
                className={cn(
                  "overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                  isExpanded && "ring-2 ring-primary",
                  isCurrent && "border-primary border-2"
                )}
                onClick={() => toggleExpand(member.id)}
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Star className="h-3 w-3 text-primary-foreground fill-current" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{member.name}</h3>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">Você</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => handleEdit(member, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => handleDeleteClick(member, e)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                      <Kanban className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{memberDemands.length} demandas</span>
                    </div>
                    {member.user_id && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">Vinculado</span>
                      </div>
                    )}
                    {accessLevel && (
                      <Badge variant="outline" className={accessLevel.color}>
                        {accessLevel.label}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded Content - Demands List */}
                {isExpanded && (
                  <div className="border-t bg-secondary/30 p-6" onClick={(e) => e.stopPropagation()}>
                    {memberDemands.length > 0 ? (
                      <>
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                          Demandas Atribuídas
                        </h4>
                        <div className="space-y-3">
                          {memberDemands.map((demand) => (
                            <div
                              key={demand.id}
                              className="p-4 rounded-lg bg-card border flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{demand.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <StatusBadge status={demand.status} />
                                  {demand.deadline && (
                                    <p className="text-xs text-muted-foreground">
                                      Prazo: {new Date(demand.deadline).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <PriorityBadge priority={demand.priority} />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma demanda atribuída no momento
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="text-muted-foreground">Gerencie a equipe e suas demandas</p>
      </div>

      <Tabs defaultValue="membros" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="membros" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            <Users className="h-4 w-4 mr-2" />
            Membros
          </TabsTrigger>
          {isGestao && (
            <TabsTrigger 
              value="supervisao" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              <Eye className="h-4 w-4 mr-2" />
              Supervisão
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="membros" className="mt-6">
          <TeamMembersContent />
        </TabsContent>

        {isGestao && (
          <TabsContent value="supervisao" className="mt-6">
            <SupervisaoContent />
          </TabsContent>
        )}
      </Tabs>

      <TeamMemberFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{memberToDelete?.name}" da equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
