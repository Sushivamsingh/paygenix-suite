import { useState } from 'react';
import { usePayroll } from '@/context/PayrollContext';
import { Employee } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/payrollCalculations';
import { toast } from 'sonner';

export function EmployeeData() {
  const { employees, structures, addEmployee, updateEmployee, deleteEmployee } = usePayroll();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    ctc: '',
    lopCount: '0',
    salaryStructureId: '',
  });

  const resetForm = () => {
    setFormData({ name: '', employeeId: '', ctc: '', lopCount: '0', salaryStructureId: '' });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employeeId || !formData.ctc) {
      toast.error('Please fill all required fields');
      return;
    }

    const employee: Employee = {
      id: editingEmployee?.id || crypto.randomUUID(),
      name: formData.name,
      employeeId: formData.employeeId,
      ctc: parseFloat(formData.ctc),
      lopCount: parseInt(formData.lopCount) || 0,
      salaryStructureId: formData.salaryStructureId || undefined,
    };

    if (editingEmployee) {
      updateEmployee(employee);
      toast.success('Employee updated successfully');
    } else {
      addEmployee(employee);
      toast.success('Employee added successfully');
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      employeeId: employee.employeeId,
      ctc: employee.ctc.toString(),
      lopCount: employee.lopCount.toString(),
      salaryStructureId: employee.salaryStructureId || '',
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    toast.success('Employee deleted');
  };

  const getStructureName = (structureId?: string) => {
    if (!structureId) return '-';
    const structure = structures.find(s => s.id === structureId);
    return structure?.name || '-';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Employee Data
          </h2>
          <p className="page-subtitle">Manage employee information and assignments</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Employee Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="Enter employee ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctc">Annual CTC (₹) *</Label>
                <Input
                  id="ctc"
                  type="number"
                  value={formData.ctc}
                  onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                  placeholder="Enter annual CTC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lopCount">LOP Days</Label>
                <Input
                  id="lopCount"
                  type="number"
                  min="0"
                  value={formData.lopCount}
                  onChange={(e) => setFormData({ ...formData, lopCount: e.target.value })}
                  placeholder="Enter LOP days"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="structure">Salary Structure</Label>
                <Select
                  value={formData.salaryStructureId}
                  onValueChange={(value) => setFormData({ ...formData, salaryStructureId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Structure</SelectItem>
                    {structures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Update' : 'Save'}
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
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Annual CTC</TableHead>
              <TableHead className="text-right">Monthly CTC</TableHead>
              <TableHead className="text-center">LOP Days</TableHead>
              <TableHead>Salary Structure</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No employees added yet. Click "Add Employee" to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-table-row-hover">
                  <TableCell className="font-medium">{employee.employeeId}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(employee.ctc)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(employee.ctc / 12)}</TableCell>
                  <TableCell className="text-center">
                    <span className={employee.lopCount > 0 ? 'text-destructive font-medium' : ''}>
                      {employee.lopCount}
                    </span>
                  </TableCell>
                  <TableCell>{getStructureName(employee.salaryStructureId)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(employee)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(employee.id)}>
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
