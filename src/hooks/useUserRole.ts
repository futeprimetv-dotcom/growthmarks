import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user' | 'gestao' | 'producao' | 'cliente';
export type RoleType = 'gestao' | 'producao' | 'cliente';

interface UseUserRoleResult {
  role: AppRole | null;
  roleType: RoleType | null;
  loading: boolean;
  isGestao: boolean;
  isProducao: boolean;
  isCliente: boolean;
  canViewDashboard: boolean;
  canViewFinanceiro: boolean;
  canViewComercial: boolean;
  canViewContratos: boolean;
  canViewMetas: boolean;
  canViewEquipe: boolean;
  canViewClientes: boolean;
  canViewPlanejamentos: boolean;
  canViewProducao: boolean;
  canViewArquivados: boolean;
  canDeletePermanently: boolean;
  canViewValues: boolean;
}

export const useUserRole = (): UseUserRoleResult => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleType, setRoleType] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setRoleType(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, role_type')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Default to gestao for existing users without explicit role
          setRole('admin');
          setRoleType('gestao');
        } else {
          setRole(data?.role as AppRole || 'admin');
          setRoleType((data as any)?.role_type as RoleType || 'gestao');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('admin');
        setRoleType('gestao');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  // Determine effective role type
  const effectiveRoleType = roleType || (role === 'admin' ? 'gestao' : role === 'user' ? 'producao' : 'gestao');
  
  const isGestao = effectiveRoleType === 'gestao' || role === 'admin';
  const isProducao = effectiveRoleType === 'producao' || role === 'user';
  const isCliente = effectiveRoleType === 'cliente';

  return {
    role,
    roleType: effectiveRoleType,
    loading,
    isGestao,
    isProducao: isProducao && !isGestao,
    isCliente,
    // Permissions
    canViewDashboard: isGestao,
    canViewFinanceiro: isGestao,
    canViewComercial: isGestao,
    canViewContratos: isGestao,
    canViewMetas: isGestao,
    canViewEquipe: isGestao,
    canViewClientes: isGestao || isProducao,
    canViewPlanejamentos: isGestao || isProducao || isCliente,
    canViewProducao: isGestao || isProducao,
    canViewArquivados: isGestao,
    canDeletePermanently: isGestao,
    canViewValues: isGestao,
  };
};
