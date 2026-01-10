import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProspeccaoActions } from "./ProspeccaoActions";

interface DatabaseResultsHeaderProps {
  selectedCount: number;
  totalCount: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onSendToFunnel: () => void;
  onSendToLeadsBase: () => void;
  onExport: () => void;
  isSendingToBase: boolean;
}

export function DatabaseResultsHeader({
  selectedCount,
  totalCount,
  pageSize,
  onPageSizeChange,
  onSendToFunnel,
  onSendToLeadsBase,
  onExport,
  isSendingToBase,
}: DatabaseResultsHeaderProps) {
  return (
    <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0 && (
          <span className="font-medium text-foreground">
            {selectedCount} selecionado(s) •
          </span>
        )}{" "}
        {totalCount} resultado(s) encontrado(s)
      </div>

      <div className="flex items-center gap-3">
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Resultados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        <ProspeccaoActions
          selectedCount={selectedCount}
          onSendToFunnel={onSendToFunnel}
          onSendToLeadsBase={onSendToLeadsBase}
          onExport={onExport}
          isSendingToBase={isSendingToBase}
        />
      </div>
    </div>
  );
}
