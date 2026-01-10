import { Loader2, Building2, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { MockProspect } from "@/data/mockProspects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospects: MockProspect[];
  onConfirm: () => void;
  isPending: boolean;
}

export function SendToLeadsConfirmDialog({ 
  open, 
  onOpenChange, 
  prospects, 
  onConfirm,
  isPending 
}: Props) {
  const totalEmails = prospects.reduce((acc, p) => acc + (p.emails?.length || 0), 0);
  const totalPhones = prospects.reduce((acc, p) => acc + (p.phones?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Confirmar envio para Leads
          </DialogTitle>
          <DialogDescription>
            Você está prestes a criar {prospects.length} lead(s) a partir dos prospects selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{prospects.length}</div>
              <div className="text-xs text-muted-foreground">Prospects</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{totalEmails}</div>
              <div className="text-xs text-muted-foreground">Emails</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{totalPhones}</div>
              <div className="text-xs text-muted-foreground">Telefones</div>
            </div>
          </div>

          {/* Prospects list */}
          <div className="border rounded-lg">
            <div className="px-3 py-2 bg-muted/30 border-b">
              <span className="text-sm font-medium">Prospects selecionados</span>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="divide-y">
                {prospects.map((prospect) => (
                  <div key={prospect.id} className="px-3 py-2.5 hover:bg-muted/20">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{prospect.name}</div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {prospect.city && prospect.state && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {prospect.city}/{prospect.state}
                            </span>
                          )}
                          {prospect.emails && prospect.emails.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {prospect.emails.length}
                            </span>
                          )}
                          {prospect.phones && prospect.phones.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {prospect.phones.length}
                            </span>
                          )}
                        </div>
                      </div>
                      {prospect.segment && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {prospect.segment.length > 20 
                            ? prospect.segment.substring(0, 20) + "..." 
                            : prospect.segment}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground">
            Os leads serão criados com status "Novo" e temperatura "Frio". 
            Você poderá gerenciá-los na página de Leads.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Confirmar envio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
