import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAvailableServices } from "@/hooks/useAvailableServices";
import { Loader2 } from "lucide-react";

interface ContractServicesSelectProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
}

export function ContractServicesSelect({ 
  selectedServices, 
  onServicesChange 
}: ContractServicesSelectProps) {
  const { services, isLoading } = useAvailableServices();

  const handleToggle = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onServicesChange(selectedServices.filter(id => id !== serviceId));
    } else {
      onServicesChange([...selectedServices, serviceId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum serviço disponível. Cadastre serviços em Configurações.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {services.filter(s => s.active).map((service) => (
        <div 
          key={service.id} 
          className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <Checkbox
            id={`service-${service.id}`}
            checked={selectedServices.includes(service.id)}
            onCheckedChange={() => handleToggle(service.id)}
          />
          <div className="flex-1 space-y-1">
            <Label 
              htmlFor={`service-${service.id}`}
              className="text-sm font-medium cursor-pointer"
            >
              {service.name}
            </Label>
            {service.description && (
              <p className="text-xs text-muted-foreground">
                {service.description}
              </p>
            )}
            {service.base_value && service.base_value > 0 && (
              <Badge variant="secondary" className="text-xs">
                R$ {service.base_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
