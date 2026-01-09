import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const uploadAvatar = async (fileOrBlob: File | Blob) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return null;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Remove avatar anterior se existir
      await supabase.storage
        .from('avatars')
        .remove([fileName]);

      // Upload do novo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileOrBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Pega URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualiza team_member com a URL do avatar
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ avatar: `${publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Foto atualizada com sucesso!");
      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao atualizar foto: " + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAvatar = async () => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return false;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Remove avatar do storage
      await supabase.storage
        .from('avatars')
        .remove([fileName]);

      // Limpa URL do avatar no team_member
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ avatar: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Foto removida com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover foto: " + error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const updateProfile = async (data: { name: string; email: string }) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return false;
    }

    setIsUpdating(true);
    try {
      // Atualiza na tabela team_members
      const { error } = await supabase
        .from('team_members')
        .update({ name: data.name, email: data.email })
        .eq('user_id', user.id);

      if (error) throw error;

      // Atualiza metadados do usuário no auth
      await supabase.auth.updateUser({
        data: { full_name: data.name }
      });

      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Perfil atualizado com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil: " + error.message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return false;
    }

    setIsUpdating(true);
    try {
      // Verifica a senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return false;
      }

      // Atualiza a senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha: " + error.message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    updateProfile,
    updatePassword,
    isUploading,
    isUpdating,
  };
}
