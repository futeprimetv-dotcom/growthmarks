import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMember, TeamMemberInsert, useCreateTeamMember, useUpdateTeamMember } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { RoleType } from "@/hooks/useUserRole";

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
}

const ROLES_PRESETS = [
  "Gestor(a)",
  "Diretor(a)",
  "Designer",
  "Desenvolvedor(a)",
  "Social Media",
  "Copywriter",
  "Analista de Tráfego",
  "Produtor(a) de Conteúdo",
  "Atendimento",
  "Financeiro",
  "Vendedor(a)",
  "Outro",
];

const ACCESS_LEVELS: { value: RoleType; label: string; description: string }[] = [
  { value: 'gestao', label: 'Gestão', description: 'Acesso completo a todas as áreas' },
  { value: 'producao', label: 'Produção', description: 'Acesso à produção, sem financeiro' },
  { value: 'vendedor', label: 'Vendedor', description: 'Acesso comercial, contratos e clientes' },
  { value: 'cliente', label: 'Cliente', description: 'Acesso limitado aos planejamentos' },
];

export function TeamMemberFormDialog({ open, onOpenChange, member }: TeamMemberFormDialogProps) {
  const [formData, setFormData] = useState<Partial<TeamMemberInsert>>({
    name: "",
    email: "",
    role: "",
    avatar: "",
  });
  const [customRole, setCustomRole] = useState("");
  const [selectedPresetRole, setSelectedPresetRole] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<RoleType>("producao");

  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();

  // Fetch profiles (users) that are not yet linked to a team member
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users-for-team'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      // Get all team members with user_id
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .not('user_id', 'is', null);
      
      const linkedUserIds = teamMembers?.map(tm => tm.user_id) || [];
      
      // Filter out users already linked (except if editing same member)
      return profiles.filter(p => 
        !linkedUserIds.includes(p.user_id) || 
        (member && member.user_id === p.user_id)
      );
    },
    enabled: open,
  });

  // Fetch current user role if member has user_id
  const { data: memberUserRole } = useQuery({
    queryKey: ['member-user-role', member?.user_id],
    queryFn: async () => {
      if (!member?.user_id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_type')
        .eq('user_id', member.user_id)
        .single();
      
      if (error) return null;
      return data?.role_type as RoleType | null;
    },
    enabled: !!member?.user_id && open,
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar || "",
        user_id: member.user_id || undefined,
      });
      // Check if role is in presets
      const isPreset = ROLES_PRESETS.includes(member.role);
      if (isPreset) {
        setSelectedPresetRole(member.role);
        setCustomRole("");
      } else {
        setSelectedPresetRole("Outro");
        setCustomRole(member.role);
      }
      setSelectedUserId(member.user_id || "none");
      if (memberUserRole) {
        setSelectedAccessLevel(memberUserRole);
      }
    } else {
      setFormData({
        name: "",
        email: "",
        role: "",
        avatar: "",
      });
      setSelectedPresetRole("");
      setCustomRole("");
      setSelectedUserId("");
      setSelectedAccessLevel("producao");
    }
  }, [member, open, memberUserRole]);

  const handleRoleChange = (value: string) => {
    setSelectedPresetRole(value);
    if (value !== "Outro") {
      setFormData({ ...formData, role: value });
      setCustomRole("");
    } else {
      setFormData({ ...formData, role: customRole });
    }
  };

  const handleCustomRoleChange = (value: string) => {
    setCustomRole(value);
    setFormData({ ...formData, role: value });
  };

  const handleUserSelect = (value: string) => {
    setSelectedUserId(value);
    if (value && value !== "none") {
      const selectedUser = availableUsers?.find(u => u.user_id === value);
      if (selectedUser && !formData.name) {
        setFormData(prev => ({
          ...prev,
          name: selectedUser.full_name,
          email: selectedUser.email,
          user_id: value,
        }));
      } else {
        setFormData(prev => ({ ...prev, user_id: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, user_id: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      return;
    }

    const dataToSave = {
      ...formData,
      user_id: selectedUserId && selectedUserId !== "none" ? selectedUserId : null,
    };

    // Update user role if user is linked
    if (selectedUserId && selectedUserId !== "none") {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUserId)
        .single();

      if (existingRole) {
        // Update existing role
        await supabase
          .from('user_roles')
          .update({ role_type: selectedAccessLevel })
          .eq('user_id', selectedUserId);
      } else {
        // Insert new role
        await supabase
          .from('user_roles')
          .insert({ user_id: selectedUserId, role: 'user', role_type: selectedAccessLevel });
      }
    }

    if (member) {
      updateMember.mutate(
        { id: member.id, ...dataToSave },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMember.mutate(
        dataToSave as TeamMemberInsert,
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isLoading = createMember.isPending || updateMember.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Editar Membro" : "Novo Membro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Select value={selectedPresetRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {ROLES_PRESETS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPresetRole === "Outro" && (
            <div className="space-y-2">
              <Label htmlFor="customRole">Cargo Personalizado *</Label>
              <Input
                id="customRole"
                value={customRole}
                onChange={(e) => handleCustomRoleChange(e.target.value)}
                placeholder="Ex: Gerente de Projetos"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="avatar">URL do Avatar</Label>
            <Input
              id="avatar"
              value={formData.avatar || ""}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>

          {/* Link to user account */}
          <div className="space-y-2">
            <Label>Vincular a Usuário</Label>
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum usuário vinculado</SelectItem>
                {availableUsers?.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincule este membro a uma conta de usuário para permitir login
            </p>
          </div>

          {/* Access Level - only show if user is linked */}
          {selectedUserId && selectedUserId !== "none" && (
            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select value={selectedAccessLevel} onValueChange={(v) => setSelectedAccessLevel(v as RoleType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span>{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : member ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
