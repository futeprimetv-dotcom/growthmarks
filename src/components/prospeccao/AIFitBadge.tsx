import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIFitBadgeProps {
  score: number;
  recommendation: "prospectar" | "avaliar" | "ignorar";
  justification?: string;
  className?: string;
}

export function AIFitBadge({ score, recommendation, justification, className }: AIFitBadgeProps) {
  const getScoreColor = () => {
    if (score >= 70) return "bg-green-500/20 text-green-600 border-green-500/30";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/20 text-red-600 border-red-500/30";
  };

  const getRecommendationLabel = () => {
    switch (recommendation) {
      case "prospectar": return "Prospectar";
      case "avaliar": return "Avaliar";
      case "ignorar": return "Baixa Prioridade";
    }
  };

  const badge = (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
      getScoreColor(),
      className
    )}>
      <Sparkles className="h-3 w-3" />
      <span>{score}</span>
      <span className="opacity-70">•</span>
      <span>{getRecommendationLabel()}</span>
    </div>
  );

  if (!justification) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{justification}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
