import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Palette, Save, Loader2, Upload, ImageIcon, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  useAppearanceSettings,
  useUpdateAppearanceSettings,
  useUploadLogo,
} from "@/hooks/useAppearanceSettings";
import defaultLogo from "@/assets/logo-growth-marks.png";

const accentColors = [
  { name: "Laranja", value: "24 95% 53%" },
  { name: "Azul", value: "221 83% 53%" },
  { name: "Verde", value: "142 71% 45%" },
  { name: "Roxo", value: "262 83% 58%" },
  { name: "Rosa", value: "330 81% 60%" },
  { name: "Vermelho", value: "0 84% 60%" },
  { name: "Amarelo", value: "45 93% 47%" },
  { name: "Ciano", value: "186 94% 41%" },
];

const fontSizes = [
  { label: "Pequeno", value: "small" as const, size: "14px" },
  { label: "Médio", value: "medium" as const, size: "16px" },
  { label: "Grande", value: "large" as const, size: "18px" },
];

export function AppearanceSettingsSection() {
  const { theme, toggleTheme } = useTheme();
  const { data: settings, isLoading } = useAppearanceSettings();
  const updateSettings = useUpdateAppearanceSettings();
  const uploadLogo = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [accentColor, setAccentColor] = useState("24 95% 53%");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFontSize(settings.fontSize);
      setAccentColor(settings.accentColor);
      setLogoUrl(settings.logoUrl);
      
      // Apply settings to document
      applyFontSize(settings.fontSize);
      applyAccentColor(settings.accentColor);
    }
  }, [settings]);

  const applyFontSize = (size: "small" | "medium" | "large") => {
    const sizeMap = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.setProperty("--base-font-size", sizeMap[size]);
    document.documentElement.style.fontSize = sizeMap[size];
  };

  const applyAccentColor = (color: string) => {
    document.documentElement.style.setProperty("--primary", color);
  };

  const handleFontSizeChange = (size: "small" | "medium" | "large") => {
    setFontSize(size);
    applyFontSize(size);
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    applyAccentColor(color);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      uploadLogo.mutate(file, {
        onSuccess: (url) => {
          setLogoUrl(url);
          setPreviewLogo(null);
          updateSettings.mutate({ logoUrl: url });
        },
      });
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setPreviewLogo(null);
    updateSettings.mutate({ logoUrl: null });
  };

  const handleSave = () => {
    updateSettings.mutate({
      fontSize,
      accentColor,
      logoUrl,
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  const currentLogo = previewLogo || logoUrl || defaultLogo;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Aparência</h2>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <div className="space-y-8">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Modo Escuro</p>
            <p className="text-sm text-muted-foreground">Usar tema escuro na interface</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>

        {/* Logo Upload */}
        <div className="space-y-3">
          <div>
            <p className="font-medium">Logo da Empresa</p>
            <p className="text-sm text-muted-foreground">
              Faça upload do logo que será exibido no sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl bg-card border flex items-center justify-center p-2 overflow-hidden">
              {uploadLogo.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <img
                  src={currentLogo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogo.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              {logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <div>
            <p className="font-medium">Tamanho da Fonte</p>
            <p className="text-sm text-muted-foreground">
              Ajuste o tamanho do texto na interface
            </p>
          </div>
          <div className="flex gap-2">
            {fontSizes.map((size) => (
              <Button
                key={size.value}
                variant={fontSize === size.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFontSizeChange(size.value)}
                className="flex-1"
              >
                <span style={{ fontSize: size.size }}>{size.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
          <div>
            <p className="font-medium">Cor de Destaque</p>
            <p className="text-sm text-muted-foreground">
              Escolha a cor principal do sistema
            </p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentColorChange(color.value)}
                className={`group relative w-full aspect-square rounded-lg transition-all ${
                  accentColor === color.value
                    ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: `hsl(${color.value})` }}
                title={color.name}
              >
                {accentColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Cor selecionada: {accentColors.find((c) => c.value === accentColor)?.name || "Personalizada"}
          </p>
        </div>
      </div>
    </Card>
  );
}
