import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Briefcase, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useGoals, Goal, KeyResult } from '@/hooks/useGoals';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryConfig = {
  financeiro: { icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Financeiro' },
  comercial: { icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Comercial' },
  producao: { icon: Briefcase, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Produção' },
  clientes: { icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'Clientes' },
};

const typeLabels = {
  anual: 'Anual',
  trimestral: 'Trimestral',
  mensal: 'Mensal',
};

const statusConfig = {
  em_andamento: { label: 'Em Andamento', icon: Clock, variant: 'secondary' as const },
  atingida: { label: 'Atingida', icon: CheckCircle2, variant: 'default' as const },
  nao_atingida: { label: 'Não Atingida', icon: AlertCircle, variant: 'destructive' as const },
};

interface GoalFormData {
  title: string;
  type: Goal["type"];
  category: Goal["category"];
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  status: Goal["status"];
}

const GoalCard = ({ 
  goal, 
  keyResults,
  onEdit, 
  onDelete,
  onUpdateProgress 
}: { 
  goal: Goal; 
  keyResults: KeyResult[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress: (newValue: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const progress = Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100);
  const CategoryIcon = categoryConfig[goal.category].icon;
  const StatusIcon = statusConfig[goal.status].icon;

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${categoryConfig[goal.category].bgColor}`}>
                  <CategoryIcon className={`h-5 w-5 ${categoryConfig[goal.category].color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{typeLabels[goal.type]}</Badge>
                    <Badge variant={statusConfig[goal.status].variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[goal.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-2xl font-bold">
                    {goal.unit === 'R$' ? `R$ ${(goal.current_value || 0).toLocaleString('pt-BR')}` : (goal.current_value || 0)}
                    <span className="text-sm text-muted-foreground font-normal">
                      {' / '}
                      {goal.unit === 'R$' ? `R$ ${goal.target_value.toLocaleString('pt-BR')}` : `${goal.target_value} ${goal.unit}`}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{progress.toFixed(0)}% concluído</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
            <Progress value={progress} className="mt-3" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Key Results
                </h4>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Atualizar progresso:</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={goal.current_value || 0}
                    onChange={(e) => onUpdateProgress(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {keyResults.map((kr) => {
                  const krProgress = Math.min(((kr.current_value || 0) / kr.target_value) * 100, 100);
                  return (
                    <div key={kr.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{kr.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {kr.current_value || 0} / {kr.target_value} {kr.unit}
                        </span>
                      </div>
                      <Progress value={krProgress} className="h-2" />
                    </div>
                  );
                })}
                {keyResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum Key Result definido
                  </p>
                )}
              </div>
              {goal.deadline && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const Metas = () => {
  const [filter, setFilter] = useState<'all' | 'mensal' | 'trimestral' | 'anual'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    type: 'mensal',
    category: 'financeiro',
    target_value: 0,
    current_value: 0,
    unit: '',
    deadline: '',
    status: 'em_andamento',
  });

  const { 
    goals, 
    keyResults, 
    isLoading, 
    createGoal, 
    updateGoal, 
    deleteGoal,
    getKeyResultsForGoal 
  } = useGoals();

  const filteredGoals = filter === 'all' 
    ? goals 
    : goals.filter(g => g.type === filter);

  // Calculate summary stats
  const totalGoals = goals.length;
  const achievedGoals = goals.filter(g => g.status === 'atingida').length;
  const avgProgress = totalGoals > 0 
    ? goals.reduce((acc, g) => acc + ((g.current_value || 0) / g.target_value) * 100, 0) / totalGoals 
    : 0;

  const openNewGoalForm = () => {
    setEditingGoal(null);
    setFormData({
      title: '',
      type: 'mensal',
      category: 'financeiro',
      target_value: 0,
      current_value: 0,
      unit: '',
      deadline: '',
      status: 'em_andamento',
    });
    setIsFormOpen(true);
  };

  const openEditGoalForm = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      type: goal.type,
      category: goal.category,
      target_value: goal.target_value,
      current_value: goal.current_value || 0,
      unit: goal.unit,
      deadline: goal.deadline || '',
      status: goal.status,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.target_value) return;

    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, ...formData });
    } else {
      createGoal.mutate(formData);
    }
    setIsFormOpen(false);
  };

  const handleUpdateProgress = (goalId: string, newValue: number) => {
    updateGoal.mutate({ id: goalId, current_value: newValue });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteGoal.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas & OKRs</h1>
          <p className="text-muted-foreground">
            Acompanhe os objetivos e resultados-chave da Growth Marks
          </p>
        </div>
        <Button onClick={openNewGoalForm}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">metas definidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Atingidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievedGoals}</div>
            <p className="text-xs text-muted-foreground">de {totalGoals} metas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyResults.length}</div>
            <p className="text-xs text-muted-foreground">resultados-chave</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Objetivos</CardTitle>
              <CardDescription>Todas as metas organizadas por período</CardDescription>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="mensal">Mensais</TabsTrigger>
                <TabsTrigger value="trimestral">Trimestrais</TabsTrigger>
                <TabsTrigger value="anual">Anuais</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta encontrada.</p>
              <Button variant="outline" className="mt-4" onClick={openNewGoalForm}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira meta
              </Button>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                keyResults={getKeyResultsForGoal(goal.id)}
                onEdit={() => openEditGoalForm(goal)}
                onDelete={() => setDeleteConfirm(goal)}
                onUpdateProgress={(newValue) => handleUpdateProgress(goal.id, newValue)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Goal Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Faturamento Mensal de R$ 10.000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Goal["type"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as Goal["category"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Valor Alvo</Label>
                <Input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Valor Atual</Label>
                <Input
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="R$, %, etc"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Goal["status"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="atingida">Atingida</SelectItem>
                    <SelectItem value="nao_atingida">Não Atingida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingGoal ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar a meta "{deleteConfirm?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Metas;
