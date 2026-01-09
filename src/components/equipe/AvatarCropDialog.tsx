import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function AvatarCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
}: AvatarCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const CANVAS_SIZE = 200;
  const PREVIEW_SIZE = 280;

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return;

    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      setImage(img);
      // Reset position and calculate initial zoom
      const minDimension = Math.min(img.width, img.height);
      const initialZoom = PREVIEW_SIZE / minDimension;
      setZoom(Math.max(initialZoom, 1));
      setOffset({ x: 0, y: 0 });
    };

    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Draw preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Draw semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Calculate image position
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const x = (PREVIEW_SIZE - scaledWidth) / 2 + offset.x;
    const y = (PREVIEW_SIZE - scaledHeight) / 2 + offset.y;

    // Create circular clipping path
    ctx.save();
    ctx.beginPath();
    ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 20, 0, Math.PI * 2);
    ctx.clip();

    // Draw image
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    ctx.restore();

    // Draw circle border
    ctx.beginPath();
    ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 20, 0, Math.PI * 2);
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Generate preview URL
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = CANVAS_SIZE;
    previewCanvas.height = CANVAS_SIZE;
    const previewCtx = previewCanvas.getContext("2d");
    
    if (previewCtx) {
      const cropRadius = PREVIEW_SIZE / 2 - 20;
      const scale = CANVAS_SIZE / (cropRadius * 2);
      
      previewCtx.beginPath();
      previewCtx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
      previewCtx.clip();
      
      const cropX = (PREVIEW_SIZE / 2 - cropRadius - x) / zoom;
      const cropY = (PREVIEW_SIZE / 2 - cropRadius - y) / zoom;
      const cropSize = (cropRadius * 2) / zoom;
      
      previewCtx.drawImage(
        image,
        cropX, cropY, cropSize, cropSize,
        0, 0, CANVAS_SIZE, CANVAS_SIZE
      );
      
      setPreviewUrl(previewCanvas.toDataURL("image/jpeg", 0.9));
    }
  }, [image, zoom, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleReset = () => {
    if (!image) return;
    const minDimension = Math.min(image.width, image.height);
    const initialZoom = PREVIEW_SIZE / minDimension;
    setZoom(Math.max(initialZoom, 1));
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
    if (!image) return;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const cropRadius = PREVIEW_SIZE / 2 - 20;
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const x = (PREVIEW_SIZE - scaledWidth) / 2 + offset.x;
    const y = (PREVIEW_SIZE - scaledHeight) / 2 + offset.y;

    const cropX = (PREVIEW_SIZE / 2 - cropRadius - x) / zoom;
    const cropY = (PREVIEW_SIZE / 2 - cropRadius - y) / zoom;
    const cropSize = (cropRadius * 2) / zoom;

    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      image,
      cropX, cropY, cropSize, cropSize,
      0, 0, CANVAS_SIZE, CANVAS_SIZE
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onOpenChange(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const minZoom = image 
    ? Math.max(0.5, (PREVIEW_SIZE - 40) / Math.max(image.width, image.height))
    : 0.5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Avatar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Crop Area */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="cursor-move rounded-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Arraste para posicionar
            </p>
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-3 w-full max-w-[280px]">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={minZoom}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Preview */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-full border-2 border-border"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Resetar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            <Check className="h-4 w-4 mr-1" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
