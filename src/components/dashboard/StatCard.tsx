import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "destructive" | "success";
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-card",
    destructive: "bg-destructive/10 border-destructive/30",
    success: "bg-success/10 border-success/30",
  };

  return (
    <div className={cn(
      "rounded-xl border p-6 transition-all hover:shadow-lg",
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn(
            "text-3xl font-bold mt-1",
            variant === "destructive" && "text-destructive",
            variant === "success" && "text-success"
          )}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center",
          variant === "default" && "bg-primary/10 text-primary",
          variant === "destructive" && "bg-destructive/20 text-destructive",
          variant === "success" && "bg-success/20 text-success"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
