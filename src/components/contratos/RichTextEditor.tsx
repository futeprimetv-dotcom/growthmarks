import { useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Link,
  Type
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const VARIABLES = [
  { key: "cliente_nome", label: "Nome do Cliente" },
  { key: "cliente_cnpj", label: "CNPJ do Cliente" },
  { key: "cliente_endereco", label: "Endereço do Cliente" },
  { key: "empresa_nome", label: "Nome da Empresa" },
  { key: "empresa_cnpj", label: "CNPJ da Empresa" },
  { key: "empresa_endereco", label: "Endereço da Empresa" },
  { key: "valor", label: "Valor" },
  { key: "data_inicio", label: "Data de Início" },
  { key: "data_fim", label: "Data de Fim" },
  { key: "cidade", label: "Cidade" },
  { key: "data_atual", label: "Data Atual" },
];

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const insertVariable = useCallback((variableKey: string) => {
    const selection = window.getSelection();
    if (selection && editorRef.current) {
      const range = selection.getRangeAt(0);
      const variableSpan = document.createElement("span");
      variableSpan.className = "bg-primary/20 text-primary px-1 rounded font-medium";
      variableSpan.contentEditable = "false";
      variableSpan.textContent = `{{${variableKey}}}`;
      range.deleteContents();
      range.insertNode(variableSpan);
      
      // Move cursor after the inserted variable
      range.setStartAfter(variableSpan);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleInput();
    }
  }, [handleInput]);

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title,
    active = false 
  }: { 
    onClick: () => void; 
    icon: React.ComponentType<{ className?: string }>; 
    title: string;
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={cn("h-8 w-8 p-0", active && "bg-accent")}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="bg-muted/50 border-b p-1 flex flex-wrap items-center gap-0.5">
        <ToolbarButton onClick={() => execCommand("undo")} icon={Undo} title="Desfazer" />
        <ToolbarButton onClick={() => execCommand("redo")} icon={Redo} title="Refazer" />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton onClick={() => execCommand("bold")} icon={Bold} title="Negrito" />
        <ToolbarButton onClick={() => execCommand("italic")} icon={Italic} title="Itálico" />
        <ToolbarButton onClick={() => execCommand("underline")} icon={Underline} title="Sublinhado" />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              <Heading1 className="h-4 w-4" />
              <span className="text-xs">Título</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h1")}>
              <Heading1 className="h-4 w-4 mr-2" /> Título 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h2")}>
              <Heading2 className="h-4 w-4 mr-2" /> Título 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "h3")}>
              <Heading3 className="h-4 w-4 mr-2" /> Título 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand("formatBlock", "p")}>
              <Type className="h-4 w-4 mr-2" /> Parágrafo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton onClick={() => execCommand("justifyLeft")} icon={AlignLeft} title="Alinhar à Esquerda" />
        <ToolbarButton onClick={() => execCommand("justifyCenter")} icon={AlignCenter} title="Centralizar" />
        <ToolbarButton onClick={() => execCommand("justifyRight")} icon={AlignRight} title="Alinhar à Direita" />
        <ToolbarButton onClick={() => execCommand("justifyFull")} icon={AlignJustify} title="Justificar" />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton onClick={() => execCommand("insertUnorderedList")} icon={List} title="Lista" />
        <ToolbarButton onClick={() => execCommand("insertOrderedList")} icon={ListOrdered} title="Lista Numerada" />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              <Link className="h-4 w-4" />
              <span className="text-xs">Variável</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            {VARIABLES.map((variable) => (
              <DropdownMenuItem 
                key={variable.key}
                onClick={() => insertVariable(variable.key)}
              >
                <code className="text-xs bg-muted px-1 rounded mr-2">{`{{${variable.key}}}`}</code>
                {variable.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 bg-background focus:outline-none prose prose-sm max-w-none dark:prose-invert
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
          [&_p]:my-2
          [&_ul]:list-disc [&_ul]:pl-6
          [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:my-1"
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ 
          wordWrap: "break-word",
          whiteSpace: "pre-wrap"
        }}
      />
    </div>
  );
}
