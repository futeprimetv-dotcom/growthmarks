import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, XCircle, PlayCircle } from "lucide-react";

interface CNPJLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueBackground: () => void;
  onCancel: () => void;
  activeCount: number;
  processed: number;
  total: number;
}

export function CNPJLeaveDialog({
  open,
  onOpenChange,
  onContinueBackground,
  onCancel,
  activeCount,
  processed,
  total,
}: CNPJLeaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Busca em andamento
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você tem uma busca de CNPJs em andamento. 
              <span className="font-medium"> {processed}/{total} processados</span>, 
              <span className="text-green-600 font-medium"> {activeCount} ativos</span> encontrados.
            </p>
            <p>O que você gostaria de fazer?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-col sm:space-x-0 sm:space-y-2">
          <AlertDialogAction
            onClick={onContinueBackground}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <PlayCircle className="h-4 w-4" />
            Continuar em segundo plano
          </AlertDialogAction>
          <AlertDialogCancel onClick={onCancel} className="w-full gap-2">
            <XCircle className="h-4 w-4" />
            Cancelar busca
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
