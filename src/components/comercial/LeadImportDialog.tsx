import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateLead, useLeads } from "@/hooks/useLeads";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = "upload" | "mapping" | "validation";

interface ParsedRow {
  [key: string]: any;
}

interface ColumnMapping {
  [excelColumn: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const systemFields = [
  { key: "name", label: "Nome *", required: true },
  { key: "company", label: "Empresa" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "service_interest", label: "Serviço de Interesse" },
  { key: "estimated_value", label: "Valor Estimado" },
  { key: "origin", label: "Origem" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado" },
  { key: "instagram", label: "Instagram" },
  { key: "notes", label: "Observações" },
];

export function LeadImportDialog({ open, onOpenChange }: LeadImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);

  const { data: existingLeads } = useLeads();
  const createLead = useCreateLead();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { header: 1 });
        
        if (jsonData.length < 2) {
          toast.error("Arquivo vazio ou sem dados");
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: any) => {
          const obj: ParsedRow = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] || "";
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== ""));

        setExcelColumns(headers.filter(h => h));
        setParsedData(rows);
        
        // Auto-map columns with similar names
        const autoMapping: ColumnMapping = {};
        headers.forEach((header) => {
          const normalizedHeader = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          systemFields.forEach((field) => {
            const normalizedField = field.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("*", "").trim();
            if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
              autoMapping[header] = field.key;
            }
          });
        });
        setColumnMapping(autoMapping);
        
        setStep("mapping");
        toast.success(`${rows.length} registros encontrados`);
      } catch (error) {
        toast.error("Erro ao ler arquivo");
        console.error(error);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  }, []);

  const validateData = useCallback(() => {
    const errors: ValidationError[] = [];
    const duplicateRows: number[] = [];

    parsedData.forEach((row, index) => {
      // Get mapped name
      const nameColumn = Object.keys(columnMapping).find(k => columnMapping[k] === "name");
      const name = nameColumn ? row[nameColumn] : null;

      if (!name || String(name).trim() === "") {
        errors.push({ row: index + 2, field: "name", message: "Nome é obrigatório" });
      }

      // Get mapped email
      const emailColumn = Object.keys(columnMapping).find(k => columnMapping[k] === "email");
      const email = emailColumn ? row[emailColumn] : null;
      
      if (email && typeof email === 'string' && email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({ row: index + 2, field: "email", message: "Email inválido" });
        }
        
        // Check for duplicates in existing leads
        if (existingLeads?.some(l => l.email?.toLowerCase() === email.toLowerCase())) {
          duplicateRows.push(index);
        }
      }

      // Check phone duplicates
      const phoneColumn = Object.keys(columnMapping).find(k => columnMapping[k] === "phone");
      const phone = phoneColumn ? row[phoneColumn] : null;
      if (phone && typeof phone === 'string' && phone.trim() !== "") {
        const cleanPhone = phone.replace(/\D/g, "");
        if (existingLeads?.some(l => l.phone?.replace(/\D/g, "") === cleanPhone)) {
          if (!duplicateRows.includes(index)) {
            duplicateRows.push(index);
          }
        }
      }
    });

    setValidationErrors(errors);
    setDuplicates(duplicateRows);
    setStep("validation");
  }, [parsedData, columnMapping, existingLeads]);

  const handleImport = async () => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
      if (duplicates.includes(i)) continue; // Skip duplicates
      
      const row = parsedData[i];
      const hasError = validationErrors.some(e => e.row === i + 2);
      if (hasError) continue; // Skip rows with errors

      try {
        const leadData: any = {};
        Object.keys(columnMapping).forEach((excelCol) => {
          const systemKey = columnMapping[excelCol];
          let value = row[excelCol];
          
          if (systemKey === "estimated_value" && value) {
            value = parseFloat(String(value).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          }
          
          if (value !== undefined && value !== "") {
            leadData[systemKey] = value;
          }
        });

        if (leadData.name) {
          await createLead.mutateAsync(leadData);
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Error importing row ${i + 2}:`, error);
      }
    }

    setImporting(false);
    toast.success(`${successCount} leads importados com sucesso!`);
    if (errorCount > 0) {
      toast.warning(`${errorCount} leads não puderam ser importados`);
    }
    
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setExcelColumns([]);
    setColumnMapping({});
    setValidationErrors([]);
    setDuplicates([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Leads
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-4 py-4">
          {[
            { key: "upload", label: "1. Upload" },
            { key: "mapping", label: "2. Mapeamento" },
            { key: "validation", label: "3. Validação" },
          ].map((s, idx) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s.key 
                  ? "bg-primary text-primary-foreground" 
                  : ["mapping", "validation"].indexOf(step) > ["upload", "mapping", "validation"].indexOf(s.key)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}>
                {idx + 1}
              </div>
              <span className={`text-sm ${step === s.key ? "font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {idx < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-md">
                <Label 
                  htmlFor="file-upload" 
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <span className="text-lg font-medium mb-1">Arraste ou clique para upload</span>
                  <span className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</span>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </Label>
                {file && (
                  <div className="mt-4 p-3 bg-secondary rounded-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "mapping" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Mapeie as colunas do seu arquivo para os campos do sistema.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {excelColumns.map((col) => (
                  <div key={col} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{col}</span>
                      <span className="text-xs text-muted-foreground block">
                        Ex: {parsedData[0]?.[col] || "-"}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={columnMapping[col] || ""}
                      onValueChange={(v) => setColumnMapping({ ...columnMapping, [col]: v })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Ignorar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ignorar</SelectItem>
                        {systemFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Validation */}
          {step === "validation" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex-1 p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{parsedData.length}</div>
                  <div className="text-sm text-muted-foreground">Total de registros</div>
                </div>
                <div className="flex-1 p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{validationErrors.length}</div>
                  <div className="text-sm text-muted-foreground">Erros de validação</div>
                </div>
                <div className="flex-1 p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-warning">{duplicates.length}</div>
                  <div className="text-sm text-muted-foreground">Duplicados</div>
                </div>
                <div className="flex-1 p-4 border rounded-lg bg-primary/10">
                  <div className="text-2xl font-bold text-primary">
                    {parsedData.length - validationErrors.filter((e, i, arr) => arr.findIndex(x => x.row === e.row) === i).length - duplicates.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Prontos para importar</div>
                </div>
              </div>

              {/* Errors list */}
              {validationErrors.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Erros de Validação
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {validationErrors.map((error, idx) => (
                      <div key={idx} className="text-sm flex items-center gap-2">
                        <Badge variant="destructive">Linha {error.row}</Badge>
                        <span>{error.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates list */}
              {duplicates.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Leads Duplicados (serão ignorados)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {duplicates.map((rowIdx) => (
                      <Badge key={rowIdx} variant="outline">Linha {rowIdx + 2}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Status</TableHead>
                      <TableHead>Linha</TableHead>
                      {Object.keys(columnMapping).filter(k => columnMapping[k]).slice(0, 4).map((col) => (
                        <TableHead key={col}>{systemFields.find(f => f.key === columnMapping[col])?.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, idx) => {
                      const hasError = validationErrors.some(e => e.row === idx + 2);
                      const isDuplicate = duplicates.includes(idx);
                      
                      return (
                        <TableRow key={idx} className={hasError || isDuplicate ? "opacity-50" : ""}>
                          <TableCell>
                            {hasError ? (
                              <X className="h-4 w-4 text-destructive" />
                            ) : isDuplicate ? (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            ) : (
                              <Check className="h-4 w-4 text-success" />
                            )}
                          </TableCell>
                          <TableCell>{idx + 2}</TableCell>
                          {Object.keys(columnMapping).filter(k => columnMapping[k]).slice(0, 4).map((col) => (
                            <TableCell key={col} className="max-w-[150px] truncate">
                              {row[col] || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {parsedData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    Mostrando 10 de {parsedData.length} registros
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step !== "upload" && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step === "validation" ? "mapping" : "upload")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            {step === "mapping" && (
              <Button 
                onClick={validateData}
                disabled={!Object.values(columnMapping).includes("name")}
              >
                Validar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {step === "validation" && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importando..." : "Importar Leads"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
