import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamMember, TeamMemberInsert, useCreateTeamMember, useUpdateTeamMember } from "@/hooks/useTeamMembers";

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
}

export function TeamMemberFormDialog({ open, onOpenChange, member }: TeamMemberFormDialogProps) {
  const [formData, setFormData] = useState<Partial<TeamMemberInsert>>({
    name: "",
    email: "",
    role: "",
    avatar: "",
  });

  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "",
        avatar: "",
      });
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      return;
    }

    if (member) {
      updateMember.mutate(
        { id: member.id, ...formData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMember.mutate(
        formData as TeamMemberInsert,
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
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Ex: Designer, Desenvolvedor, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">URL do Avatar</Label>
            <Input
              id="avatar"
              value={formData.avatar || ""}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://exemplo.com/avatar.jpg"
            />
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
