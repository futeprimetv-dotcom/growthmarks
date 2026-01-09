import { useState, useEffect, useRef } from "react";
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
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatarPreview(member.avatar || null);
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
      setAvatarPreview(null);
    }
  }, [member, open, memberUserRole]);

  const resizeImage = (file: File, maxSize: number = 200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate crop dimensions for square avatar
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;

        if (ctx) {
          // Draw cropped and resized image
          ctx.drawImage(
            img,
            offsetX, offsetY, size, size,  // Source crop
            0, 0, maxSize, maxSize          // Destination
          );

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Falha ao processar imagem'));
            },
            'image/jpeg',
            0.9
          );
        } else {
          reject(new Error('Contexto canvas não disponível'));
        }
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 5MB before resize)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Resize and crop to 200x200
      const resizedBlob = await resizeImage(file, 200);
      
      const fileName = `team-member-${Date.now()}.jpg`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resizedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar: urlData.publicUrl }));
      setAvatarPreview(urlData.publicUrl);
      toast.success("Avatar enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar avatar: " + error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: "" }));
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

    const hasLinkedUser = selectedUserId && selectedUserId !== "none";

    const dataToSave: any = {
      ...formData,
      user_id: hasLinkedUser ? selectedUserId : null,
      // If no user linked, save as pending_role_type for pre-approval
      pending_role_type: !hasLinkedUser ? selectedAccessLevel : null,
      // If setting pending_role_type, pre-approve the member
      is_approved: !hasLinkedUser && selectedAccessLevel ? true : (formData as any).is_approved,
    };

    // Update user role if user is linked
    if (hasLinkedUser) {
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
      
      // Clear pending_role_type since user is now linked
      dataToSave.pending_role_type = null;
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

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="w-full"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      {avatarPreview ? "Alterar foto" : "Enviar foto"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Redimensionado automaticamente para 200x200px
                </p>
              </div>
            </div>
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

          {/* Access Level - always show for pre-approval */}
          <div className="space-y-2">
            <Label>Nível de Acesso {(!selectedUserId || selectedUserId === "none") && "(Pré-aprovação)"}</Label>
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
            {(!selectedUserId || selectedUserId === "none") && (
              <p className="text-xs text-muted-foreground">
                Quando o usuário criar conta com este email, será aprovado automaticamente com este nível
              </p>
            )}
          </div>

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
