import {
  Globe,
  Instagram,
  Linkedin,
  Facebook,
  MapPin,
  Building2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProspectStatusBadge } from "./ProspectStatusBadge";
import type { MockProspect } from "@/data/mockProspects";

interface Props {
  prospects: MockProspect[];
  isLoading: boolean;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export function ProspeccaoTable({
  prospects,
  isLoading,
  selectedIds,
  onSelectChange,
  page,
  onPageChange,
  pageSize = 10
}: Props) {
  const totalPages = Math.ceil(prospects.length / pageSize);
  const paginatedProspects = prospects.slice((page - 1) * pageSize, page * pageSize);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProspects.length) {
      onSelectChange([]);
    } else {
      onSelectChange(paginatedProspects.map(p => p.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">Nenhuma empresa encontrada</h3>
        <p className="text-muted-foreground mt-1">
          Tente ajustar os filtros para encontrar mais resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === paginatedProspects.length && paginatedProspects.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[250px]">Empresa</TableHead>
              <TableHead>Emails</TableHead>
              <TableHead>Telefones</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProspects.map((prospect) => (
              <TableRow key={prospect.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(prospect.id)}
                    onCheckedChange={() => toggleSelect(prospect.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{prospect.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {prospect.has_website && prospect.website_url && (
                          <a
                            href={prospect.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {prospect.social_links?.instagram && (
                          <a
                            href={`https://instagram.com/${prospect.social_links.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-pink-500"
                          >
                            <Instagram className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {prospect.social_links?.linkedin && (
                          <a
                            href={`https://linkedin.com/company/${prospect.social_links.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-blue-600"
                          >
                            <Linkedin className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {prospect.social_links?.facebook && (
                          <a
                            href={`https://facebook.com/${prospect.social_links.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-blue-500"
                          >
                            <Facebook className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {prospect.emails && prospect.emails.length > 0 ? (
                    <div className="space-y-1">
                      {prospect.emails.slice(0, 2).map((email, i) => (
                        <div key={i} className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[180px]">{email}</span>
                        </div>
                      ))}
                      {prospect.emails.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{prospect.emails.length - 2} mais
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {prospect.phones && prospect.phones.length > 0 ? (
                    <div className="space-y-1">
                      {prospect.phones.slice(0, 2).map((phone, i) => (
                        <div key={i} className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{phone}</span>
                        </div>
                      ))}
                      {prospect.phones.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{prospect.phones.length - 2} mais
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono">{prospect.cnpj || "-"}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {prospect.city}/{prospect.state}
                  </div>
                </TableCell>
                <TableCell>
                  <ProspectStatusBadge status={prospect.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {prospect.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {prospect.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{prospect.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, prospects.length)} de {prospects.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
