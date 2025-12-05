import { useState } from 'react';
import { usePayroll } from '@/context/PayrollContext';
import { PayrollComponent, ComponentType, ComponentCategory } from '@/types/payroll';
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
  });

  const resetForm = () => {
    setFormData({
      name: '',
      componentType: 'earnings',
      componentCategory: 'fixed',
      amount: '',
      basedOn: 'ctc',
      applyLopDeduction: true,
    });
    setEditingComponent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const component: PayrollComponent = {
      id: editingComponent?.id || crypto.randomUUID(),
      name: formData.name,
      componentType: formData.componentType,
      componentCategory: formData.componentCategory,
      amount: parseFloat(formData.amount),
      basedOn: formData.componentCategory === 'percentage' ? formData.basedOn : 'ctc',
      applyLopDeduction: formData.applyLopDeduction,
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
          <DialogContent className="sm:max-w-md">
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
                  onValueChange={(value: ComponentCategory) => setFormData({ ...formData, componentCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.componentCategory === 'fixed' ? (
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
              ) : (
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
              <TableHead>Based On</TableHead>
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
                      : `${component.amount}%`
                    }
                  </TableCell>
                  <TableCell>
                    {component.componentCategory === 'percentage' 
                      ? getBasedOnLabel(component.basedOn)
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
