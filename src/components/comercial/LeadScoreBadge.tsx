import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lead } from "@/hooks/useLeads";
import { useLeadScore } from "@/hooks/useLeadScore";
import { cn } from "@/lib/utils";

interface LeadScoreBadgeProps {
  lead: Lead;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LeadScoreBadge({ lead, showTooltip = true, size = "md" }: LeadScoreBadgeProps) {
  const { calculateScore, weights } = useLeadScore();
  
  const score = lead.lead_score ?? calculateScore(lead);
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500 hover:bg-green-600 text-white";
    if (score >= 40) return "bg-yellow-500 hover:bg-yellow-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Quente";
    if (score >= 40) return "Morno";
    return "Frio";
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const badge = (
    <Badge 
      className={cn(
        getScoreColor(score),
        sizeClasses[size],
        "font-bold cursor-default"
      )}
    >
      {score}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Lead Score: {score} ({getScoreLabel(score)})</p>
            <div className="text-xs space-y-1">
              <p>Temperatura: {weights.temperature}% peso</p>
              <p>Valor estimado: {weights.estimated_value}% peso</p>
              <p>Urgência: {weights.urgency}% peso</p>
              <p>Prob. fechamento: {weights.closing_probability}% peso</p>
              <p>Investe em MKT: {weights.invests_in_marketing}% peso</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
