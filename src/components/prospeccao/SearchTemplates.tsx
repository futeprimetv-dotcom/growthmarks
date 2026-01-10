import { Zap, Building2, ShoppingBag, Stethoscope, GraduationCap, Wrench, Home, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProspectFilters } from "@/hooks/useProspects";

interface Props {
  onApply: (filters: ProspectFilters) => void;
}

interface SearchTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filters: ProspectFilters;
}

const templates: SearchTemplate[] = [
  {
    id: "imobiliarias",
    name: "Imobiliárias",
    description: "Corretoras e imobiliárias",
    icon: Home,
    filters: {
      segments: ["Imobiliário"],
      hasPhone: true,
      hasEmail: true,
    },
  },
  {
    id: "lojas-carros",
    name: "Lojas de Carros",
    description: "Concessionárias e revendas de veículos",
    icon: Car,
    filters: {
      segments: ["Veículos - Lojas de Carros"],
      hasPhone: true,
    },
  },
  {
    id: "comercio-varejo",
    name: "Comércio Varejista",
    description: "Lojas e estabelecimentos comerciais",
    icon: ShoppingBag,
    filters: {
      segments: ["Comércio"],
      hasPhone: true,
    },
  },
  {
    id: "saude",
    name: "Saúde e Bem-Estar",
    description: "Clínicas, consultórios e academias",
    icon: Stethoscope,
    filters: {
      segments: ["Saúde"],
      hasPhone: true,
      hasEmail: true,
    },
  },
  {
    id: "educacao",
    name: "Educação",
    description: "Escolas, cursos e treinamentos",
    icon: GraduationCap,
    filters: {
      segments: ["Educação"],
      hasWebsite: true,
    },
  },
  {
    id: "servicos",
    name: "Prestadores de Serviços",
    description: "Empresas de serviços diversos",
    icon: Wrench,
    filters: {
      segments: ["Serviços"],
      companySizes: ["ME", "EPP"],
    },
  },
  {
    id: "industria",
    name: "Indústrias",
    description: "Fábricas e indústrias",
    icon: Building2,
    filters: {
      segments: ["Indústria"],
      companySizes: ["EPP", "MEDIO"],
    },
  },
];

export function SearchTemplates({ onApply }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Buscas Rápidas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            className="flex items-start gap-3 p-3 cursor-pointer"
            onClick={() => onApply(template.filters)}
          >
            <template.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
