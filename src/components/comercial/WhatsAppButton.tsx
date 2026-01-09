import { Button } from "@/components/ui/button";
import { useCreateLeadHistory } from "@/hooks/useLeadHistory";
import { cn } from "@/lib/utils";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface WhatsAppButtonProps {
  phone?: string | null;
  leadId?: string;
  leadName?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  showLabel?: boolean;
  customMessage?: string;
}

export function WhatsAppButton({ 
  phone, 
  leadId, 
  leadName,
  className,
  size = "icon",
  variant = "ghost",
  showLabel = false,
  customMessage,
}: WhatsAppButtonProps) {
  const createHistory = useCreateLeadHistory();

  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, "");
    
    // If it doesn't start with country code, assume Brazil (55)
    if (!cleaned.startsWith("55") && cleaned.length <= 11) {
      cleaned = "55" + cleaned;
    }
    
    return cleaned;
  };

  const handleClick = async () => {
    if (!phone) return;
    
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = customMessage || `Olá${leadName ? `, ${leadName}` : ""}! Tudo bem?`;
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp using wa.me
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
    
    // Log to history if leadId is provided
    if (leadId) {
      await createHistory.mutateAsync({
        lead_id: leadId,
        action_type: "whatsapp",
        description: `Contato iniciado via WhatsApp`,
        contact_channel: "whatsapp",
      });
    }
  };

  if (!phone) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("text-green-600 hover:text-green-700 hover:bg-green-50", className)}
      title="Abrir WhatsApp"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4" />
      {showLabel && <span className="ml-2">WhatsApp</span>}
    </Button>
  );
}
