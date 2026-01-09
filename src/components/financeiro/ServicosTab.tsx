import { recurringServices, getClientById, getTotalRecurringRevenue } from "@/data/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

export function ServicosTab() {
  const totalMRR = getTotalRecurringRevenue();
  const activeServices = recurringServices.filter(s => s.status === 'ativo').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-success/20">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR Total</p>
              <p className="text-2xl font-bold text-success">
                R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Serviços Ativos</p>
              <p className="text-2xl font-bold">{activeServices}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Services Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Serviços Recorrentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor Mensal</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Próximo Venc.</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recurringServices.map((service) => {
                const client = getClientById(service.clientId);
                const isNearDue = new Date(service.nextPaymentDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={service.id} className="border-b hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{client?.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{service.serviceName}</td>
                    <td className="py-3 px-4 font-semibold text-success">
                      R$ {service.monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">{service.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <span className={isNearDue ? 'text-warning font-medium' : ''}>
                        {new Date(service.nextPaymentDate).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={service.status === 'ativo' ? 'default' : 'secondary'}
                        className={service.status === 'ativo' ? 'bg-success hover:bg-success/90' : ''}
                      >
                        {service.status === 'ativo' ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
