import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  Kanban, 
  UserCircle, 
  Archive, 
  Settings,
  Target,
  CalendarDays,
  TrendingUp,
  LogOut,
  Eye
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAppearance } from "@/contexts/AppearanceContext";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: 'gestao' | 'producao' | 'cliente' | 'vendedor' | 'all';
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Vendas",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: 'vendedor' },
      { title: "Comercial", url: "/comercial", icon: Target, permission: 'vendedor' },
    ]
  },
  {
    label: "Operação",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users, permission: 'vendedor' },
      { title: "Planejamentos", url: "/planejamentos", icon: CalendarDays, permission: 'all' },
      { title: "Produção", url: "/producao", icon: Kanban, permission: 'producao' },
    ]
  },
  {
    label: "Financeiro",
    items: [
      { title: "Contratos", url: "/contratos", icon: FileText, permission: 'vendedor' },
      { title: "Financeiro", url: "/financeiro", icon: DollarSign, permission: 'gestao' },
    ]
  },
  {
    label: "Gestão",
    items: [
      { title: "Metas & OKRs", url: "/metas", icon: TrendingUp, permission: 'gestao' },
    ]
  },
  {
    label: "Sistema",
    items: [
      { title: "Equipe", url: "/equipe", icon: UserCircle, permission: 'gestao' },
      { title: "Arquivados", url: "/arquivados", icon: Archive, permission: 'gestao' },
      { title: "Configurações", url: "/configuracoes", icon: Settings, permission: 'gestao' },
      { title: "Supervisão", url: "/supervisao", icon: Eye, permission: 'gestao' },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { isGestao, isProducao, isCliente, isVendedor, loading: roleLoading } = useUserRole();
  const { logoSrc } = useAppearance();
  const isCollapsed = state === "collapsed";

  const canViewItem = (permission?: string) => {
    if (roleLoading) return true; // Show all during loading
    if (!permission || permission === 'all') return true;
    if (permission === 'gestao') return isGestao;
    if (permission === 'vendedor') return isGestao || isVendedor;
    if (permission === 'producao') return isGestao || isProducao;
    if (permission === 'cliente') return isGestao || isProducao || isCliente;
    return false;
  };

  const filteredSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => canViewItem(item.permission))
    }))
    .filter(section => section.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <img src={logoSrc} alt="Logo" className="h-8 w-auto" />
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              G
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {filteredSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url}>
                          <item.icon className={isActive ? "text-primary" : ""} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!isCollapsed && user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sidebar-foreground truncate max-w-[100px]">
                  {user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isGestao ? 'Gestão' : isVendedor ? 'Vendedor' : isProducao ? 'Produção' : isCliente ? 'Cliente' : 'Usuário'}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={signOut}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        {isCollapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
