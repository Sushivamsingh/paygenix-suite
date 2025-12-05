import { useState } from 'react';
import { usePayroll } from '@/context/PayrollContext';
import { SalaryStructure as SalaryStructureType } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, FileSpreadsheet, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { calculateEmployeeBreakdown, formatCurrency } from '@/utils/payrollCalculations';
import { toast } from 'sonner';

export function SalaryStructure() {
  const { structures, components, employees, addStructure, updateStructure, deleteStructure } = usePayroll();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructureType | null>(null);
  const [expandedStructure, setExpandedStructure] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    componentIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({ name: '', componentIds: [] });
    setEditingStructure(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.componentIds.length === 0) {
      toast.error('Please fill structure name and select at least one component');
      return;
    }

    const structure: SalaryStructureType = {
      id: editingStructure?.id || crypto.randomUUID(),
      name: formData.name,
      componentIds: formData.componentIds,
    };

    if (editingStructure) {
      updateStructure(structure);
      toast.success('Structure updated successfully');
    } else {
      addStructure(structure);
      toast.success('Structure added successfully');
    }

    handleCloseDialog();
  };

  const handleEdit = (structure: SalaryStructureType) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      componentIds: [...structure.componentIds],
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteStructure(id);
    toast.success('Structure deleted');
  };

  const toggleComponent = (componentId: string) => {
    setFormData(prev => ({
      ...prev,
      componentIds: prev.componentIds.includes(componentId)
        ? prev.componentIds.filter(id => id !== componentId)
        : [...prev.componentIds, componentId],
    }));
  };

  const getStructureComponents = (structure: SalaryStructureType) => {
    return components.filter(c => structure.componentIds.includes(c.id));
  };

  const getAssignedEmployees = (structureId: string) => {
    return employees.filter(e => e.salaryStructureId === structureId);
  };

  const toggleExpanded = (structureId: string) => {
    setExpandedStructure(prev => prev === structureId ? null : structureId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Salary Structure
          </h2>
          <p className="page-subtitle">Create and manage salary structures with component assignments</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Structure
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStructure ? 'Edit Structure' : 'Create Salary Structure'}</DialogTitle>
            <DialogDescription>
              Create a salary structure by selecting components to include.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="structureName">Structure Name *</Label>
              <Input
                id="structureName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Executive, Manager, Entry Level"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Components *</Label>
              {components.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No components available. Please create components in Payroll Settings first.
                </p>
              ) : (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {components.map((component) => {
                    const isSelected = formData.componentIds.includes(component.id);
                    return (
                      <button
                        type="button"
                        key={component.id}
                        className="flex items-center w-full space-x-3 p-3 hover:bg-muted/50 text-left"
                        onClick={() => toggleComponent(component.id)}
                      >
                        <div className={`h-4 w-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{component.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {component.componentType === 'earnings' ? 'Earnings' : 'Deductions'} • 
                            {component.componentCategory === 'fixed' 
                              ? ` ₹${component.amount.toLocaleString('en-IN')}`
                              : ` ${component.amount}%`
                            }
                          </p>
                        </div>
                        <Badge variant={component.componentType === 'earnings' ? 'default' : 'secondary'} className="text-xs">
                          {component.componentType === 'earnings' ? 'E' : 'D'}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={components.length === 0}>
                {editingStructure ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {structures.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No salary structures created yet. Click "Add Structure" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {structures.map((structure) => {
            const structureComponents = getStructureComponents(structure);
            const assignedEmployees = getAssignedEmployees(structure.id);
            const isExpanded = expandedStructure === structure.id;

            return (
              <Card key={structure.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{structure.name}</CardTitle>
                      <Badge variant="outline">{structureComponents.length} components</Badge>
                      <Badge variant="secondary">{assignedEmployees.length} employees</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleExpanded(structure.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(structure)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(structure.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Components</h4>
                        <div className="space-y-1">
                          {structureComponents.map(comp => (
                            <div key={comp.id} className="flex justify-between text-sm py-1">
                              <span>{comp.name}</span>
                              <span className="text-muted-foreground">
                                {comp.componentCategory === 'fixed' 
                                  ? formatCurrency(comp.amount)
                                  : `${comp.amount}%`
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Salary Breakdown</h4>
                        {assignedEmployees.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No employees assigned yet</p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {assignedEmployees.map(employee => {
                              const breakdown = calculateEmployeeBreakdown(employee, structure, components);
                              return (
                                <div key={employee.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                  <p className="font-medium mb-2">{employee.name}</p>
                                  <div className="space-y-1">
                                    {breakdown.earnings.map((e, i) => (
                                      <div key={i} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{e.name}</span>
                                        <span className="text-success">{formatCurrency(e.amount)}</span>
                                      </div>
                                    ))}
                                    {breakdown.deductions.map((d, i) => (
                                      <div key={i} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{d.name}</span>
                                        <span className="text-destructive">-{formatCurrency(d.amount)}</span>
                                      </div>
                                    ))}
                                    <Separator className="my-1" />
                                    <div className="flex justify-between font-medium">
                                      <span>Net Pay</span>
                                      <span>{formatCurrency(breakdown.netPay)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
