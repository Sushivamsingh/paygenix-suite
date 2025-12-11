import { useState } from 'react';
import { usePayroll } from '@/context/PayrollContext';
import { PayrollComponent, ComponentType, ComponentCategory, FormulaTerm } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormulaBuilder } from './FormulaBuilder';

export function PayrollSettings() {
  const { components, addComponent, updateComponent, deleteComponent } = usePayroll();
  const [isOpen, setIsOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    componentType: 'earnings' as ComponentType,
    componentCategory: 'fixed' as ComponentCategory,
    amount: '',
    basedOn: 'ctc',
    applyLopDeduction: true,
    formulaTerms: [] as FormulaTerm[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      componentType: 'earnings',
      componentCategory: 'fixed',
      amount: '',
      basedOn: 'ctc',
      applyLopDeduction: true,
      formulaTerms: [],
    });
    setEditingComponent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please fill the component name');
      return;
    }

    if (formData.componentCategory === 'formula' && formData.formulaTerms.length === 0) {
      toast.error('Please build a formula');
      return;
    }

    if (formData.componentCategory !== 'formula' && !formData.amount) {
      toast.error('Please enter an amount or percentage');
      return;
    }

    const component: PayrollComponent = {
      id: editingComponent?.id || crypto.randomUUID(),
      name: formData.name,
      componentType: formData.componentType,
      componentCategory: formData.componentCategory,
      amount: formData.componentCategory === 'formula' ? 0 : parseFloat(formData.amount),
      basedOn: formData.componentCategory === 'percentage' ? formData.basedOn : 'ctc',
      applyLopDeduction: formData.applyLopDeduction,
      formulaTerms: formData.componentCategory === 'formula' ? formData.formulaTerms : undefined,
    };

    if (editingComponent) {
      updateComponent(component);
      toast.success('Component updated successfully');
    } else {
      addComponent(component);
      toast.success('Component added successfully');
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (component: PayrollComponent) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      componentType: component.componentType,
      componentCategory: component.componentCategory,
      amount: component.amount.toString(),
      basedOn: component.basedOn,
      applyLopDeduction: component.applyLopDeduction,
      formulaTerms: component.formulaTerms || [],
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteComponent(id);
    toast.success('Component deleted');
  };

  const getBasedOnLabel = (basedOn: string) => {
    if (basedOn === 'ctc') return 'CTC';
    const comp = components.find(c => c.id === basedOn);
    return comp?.name || basedOn;
  };

  const getFormulaDisplay = (terms: FormulaTerm[] | undefined): string => {
    if (!terms || terms.length === 0) return '-';
    return terms.map(term => {
      if (term.type === 'operator') return term.value;
      if (term.type === 'percentage') {
        const match = term.value.match(/^(\d+(?:\.\d+)?)%(.+)$/);
        if (match) {
          const [, percent, compId] = match;
          if (compId === 'ctc') return `${percent}% of CTC`;
          const comp = components.find(c => c.id === compId);
          return `${percent}% of ${comp?.name || 'Unknown'}`;
        }
        return term.value;
      }
      if (term.value === 'ctc') return 'CTC';
      const comp = components.find(c => c.id === term.value);
      return comp?.name || 'Unknown';
    }).join(' ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Payroll Settings
          </h2>
          <p className="page-subtitle">Configure payroll components for salary calculations</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingComponent ? 'Edit Component' : 'Add Payroll Component'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="compName">Component Name *</Label>
                <Input
                  id="compName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic, HRA, PF"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Component Type *</Label>
                <Select
                  value={formData.componentType}
                  onValueChange={(value: ComponentType) => setFormData({ ...formData, componentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earnings">Earnings</SelectItem>
                    <SelectItem value="deductions">Deductions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Component Category *</Label>
                <Select
                  value={formData.componentCategory}
                  onValueChange={(value: ComponentCategory) => setFormData({ ...formData, componentCategory: value, formulaTerms: value === 'formula' ? formData.formulaTerms : [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="formula">Custom Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.componentCategory === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="fixedAmount">Fixed Amount (₹) *</Label>
                  <Input
                    id="fixedAmount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter fixed amount"
                  />
                </div>
              )}

              {formData.componentCategory === 'percentage' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Percentage (%) *</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter percentage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Based On *</Label>
                    <Select
                      value={formData.basedOn}
                      onValueChange={(value) => setFormData({ ...formData, basedOn: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ctc">CTC (Monthly)</SelectItem>
                        {components
                          .filter(c => c.id !== editingComponent?.id)
                          .map((comp) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.componentCategory === 'formula' && (
                <div className="space-y-2">
                  <Label>Build Formula *</Label>
                  <FormulaBuilder
                    components={components}
                    currentComponentId={editingComponent?.id}
                    value={formData.formulaTerms}
                    onChange={(terms) => setFormData({ ...formData, formulaTerms: terms })}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="lopDeduction"
                  checked={formData.applyLopDeduction}
                  onCheckedChange={(checked) => setFormData({ ...formData, applyLopDeduction: checked as boolean })}
                />
                <Label htmlFor="lopDeduction" className="text-sm font-normal cursor-pointer">
                  Apply LOP Deductions
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingComponent ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead>Component Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount/Percentage</TableHead>
              <TableHead>Based On / Formula</TableHead>
              <TableHead className="text-center">LOP Applicable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No components added yet. Click "Add Component" to get started.
                </TableCell>
              </TableRow>
            ) : (
              components.map((component) => (
                <TableRow key={component.id} className="hover:bg-table-row-hover">
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>
                    <Badge variant={component.componentType === 'earnings' ? 'default' : 'secondary'}>
                      {component.componentType === 'earnings' ? 'Earnings' : 'Deductions'}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{component.componentCategory}</TableCell>
                  <TableCell className="text-right">
                    {component.componentCategory === 'fixed' 
                      ? `₹${component.amount.toLocaleString('en-IN')}`
                      : component.componentCategory === 'percentage'
                        ? `${component.amount}%`
                        : 'Formula'
                    }
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={component.componentCategory === 'formula' ? getFormulaDisplay(component.formulaTerms) : undefined}>
                    {component.componentCategory === 'percentage' 
                      ? getBasedOnLabel(component.basedOn)
                      : component.componentCategory === 'formula'
                        ? getFormulaDisplay(component.formulaTerms)
                        : '-'
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={component.applyLopDeduction ? 'outline' : 'secondary'}>
                      {component.applyLopDeduction ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(component)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(component.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
