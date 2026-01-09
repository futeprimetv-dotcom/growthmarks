import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { leads, getTeamMemberById, type Lead, type LeadStatus, type LeadOrigin } from "@/data/mockData";
import { Search, Phone, Mail, Calendar, Flame, Snowflake, ThermometerSun } from "lucide-react";

const statusConfig: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  lead_frio: { label: "Lead Frio", variant: "outline" },
  em_contato: { label: "Em Contato", variant: "secondary" },
  proposta_enviada: { label: "Proposta Enviada", variant: "secondary" },
  negociacao: { label: "Negociação", variant: "default" },
  fechado: { label: "Fechado", variant: "default" },
  perdido: { label: "Perdido", variant: "destructive" },
};

const originLabels: Record<LeadOrigin, string> = {
  instagram: "Instagram",
  indicacao: "Indicação",
  google: "Google",
  linkedin: "LinkedIn",
  site: "Site",
  outro: "Outro",
};

const temperatureIcons = {
  frio: { icon: Snowflake, color: 'text-blue-400' },
  morno: { icon: ThermometerSun, color: 'text-yellow-400' },
  quente: { icon: Flame, color: 'text-red-400' },
};

export function LeadsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesOrigin = originFilter === "all" || lead.origin === originFilter;
    return matchesSearch && matchesStatus && matchesOrigin;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Leads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="lead_frio">Lead Frio</SelectItem>
              <SelectItem value="em_contato">Em Contato</SelectItem>
              <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
              <SelectItem value="negociacao">Negociação</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas origens</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="site">Site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Valor Est.</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próxima Ação</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const responsible = getTeamMemberById(lead.responsibleId);
                const status = statusConfig[lead.status];
                const TempIcon = temperatureIcons[lead.temperature].icon;
                
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TempIcon className={`h-4 w-4 ${temperatureIcons[lead.temperature].color}`} />
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.serviceInterest}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{originLabels[lead.origin]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.nextAction && (
                        <div className="space-y-1">
                          <p className="text-sm">{lead.nextAction}</p>
                          {lead.nextActionDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(lead.nextActionDate).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{responsible?.name}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lead encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
