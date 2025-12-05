import { useState } from 'react';
import { usePayroll } from '@/context/PayrollContext';
import { EmployeeSalaryBreakdown, PayrollRun } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Calculator, Download, Eye, IndianRupee, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { calculateEmployeeBreakdown, formatCurrency } from '@/utils/payrollCalculations';
import { toast } from 'sonner';

export function RunPayroll() {
  const { employees, structures, components, payrollRuns, addPayrollRun } = usePayroll();
  const [workingDays, setWorkingDays] = useState('30');
  const [breakdowns, setBreakdowns] = useState<EmployeeSalaryBreakdown[]>([]);
  const [selectedBreakdown, setSelectedBreakdown] = useState<EmployeeSalaryBreakdown | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const eligibleEmployees = employees.filter(e => e.salaryStructureId);

  const handleRunPayroll = () => {
    if (eligibleEmployees.length === 0) {
      toast.error('No employees with salary structures assigned');
      return;
    }

    const days = parseInt(workingDays) || 30;
    const calculatedBreakdowns: EmployeeSalaryBreakdown[] = [];

    for (const employee of eligibleEmployees) {
      const structure = structures.find(s => s.id === employee.salaryStructureId);
      if (structure) {
        const breakdown = calculateEmployeeBreakdown(employee, structure, components, days);
        calculatedBreakdowns.push(breakdown);
      }
    }

    setBreakdowns(calculatedBreakdowns);
    setIsCalculated(true);
    toast.success(`Payroll calculated for ${calculatedBreakdowns.length} employees`);
  };

  const handleSavePayroll = () => {
    if (breakdowns.length === 0) return;

    const totalPayroll = breakdowns.reduce((sum, b) => sum + b.netPay, 0);
    
    const payrollRun: PayrollRun = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      workingDays: parseInt(workingDays) || 30,
      breakdowns,
      totalPayroll,
    };

    addPayrollRun(payrollRun);
    toast.success('Payroll saved successfully');
  };

  const totalEarnings = breakdowns.reduce((sum, b) => sum + b.totalEarnings, 0);
  const totalDeductions = breakdowns.reduce((sum, b) => sum + b.totalDeductions, 0);
  const totalNetPay = breakdowns.reduce((sum, b) => sum + b.netPay, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Run Payroll
          </h2>
          <p className="page-subtitle">Calculate and process monthly payroll for all employees</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="workingDays">Working Days in Month</Label>
              <Input
                id="workingDays"
                type="number"
                min="1"
                max="31"
                value={workingDays}
                onChange={(e) => {
                  setWorkingDays(e.target.value);
                  setIsCalculated(false);
                }}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRunPayroll}>
                <Play className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
              {isCalculated && breakdowns.length > 0 && (
                <Button variant="outline" onClick={handleSavePayroll}>
                  <Download className="h-4 w-4 mr-2" />
                  Save Payroll
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {eligibleEmployees.length} employee(s) with salary structures will be processed
          </p>
        </CardContent>
      </Card>

      {isCalculated && breakdowns.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="stat-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="text-2xl font-bold">{breakdowns.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(totalEarnings)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-success/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deductions</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDeductions)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-destructive/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Net Pay</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalNetPay)}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead>Employee</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead className="text-center">Working Days</TableHead>
                  <TableHead className="text-center">LOP Days</TableHead>
                  <TableHead className="text-center">Payable Days</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdowns.map((breakdown) => (
                  <TableRow key={breakdown.employeeId} className="hover:bg-table-row-hover">
                    <TableCell className="font-medium">{breakdown.employeeName}</TableCell>
                    <TableCell>{breakdown.structureName}</TableCell>
                    <TableCell className="text-center">{breakdown.workingDays}</TableCell>
                    <TableCell className="text-center">
                      {breakdown.lopDays > 0 ? (
                        <Badge variant="destructive" className="text-xs">{breakdown.lopDays}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{breakdown.payableDays}</TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatCurrency(breakdown.totalEarnings)}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {formatCurrency(breakdown.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(breakdown.netPay)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedBreakdown(breakdown)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {isCalculated && breakdowns.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No employees with salary structures found. Please assign salary structures to employees first.
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedBreakdown} onOpenChange={() => setSelectedBreakdown(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Salary Breakdown - {selectedBreakdown?.employeeName}</DialogTitle>
          </DialogHeader>
          {selectedBreakdown && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Structure</span>
                <span className="font-medium">{selectedBreakdown.structureName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Working Days / Payable Days</span>
                <span className="font-medium">
                  {selectedBreakdown.workingDays} / {selectedBreakdown.payableDays}
                  {selectedBreakdown.lopDays > 0 && (
                    <span className="text-destructive ml-1">({selectedBreakdown.lopDays} LOP)</span>
                  )}
                </span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm mb-2 text-success">Earnings</h4>
                <div className="space-y-1">
                  {selectedBreakdown.earnings.map((e, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{e.name}</span>
                      <span>{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium text-sm pt-1 border-t">
                    <span>Total Earnings</span>
                    <span className="text-success">{formatCurrency(selectedBreakdown.totalEarnings)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2 text-destructive">Deductions</h4>
                <div className="space-y-1">
                  {selectedBreakdown.deductions.length > 0 ? (
                    <>
                      {selectedBreakdown.deductions.map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.name}</span>
                          <span>{formatCurrency(d.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium text-sm pt-1 border-t">
                        <span>Total Deductions</span>
                        <span className="text-destructive">{formatCurrency(selectedBreakdown.totalDeductions)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No deductions</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Net Pay</span>
                <span>{formatCurrency(selectedBreakdown.netPay)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {payrollRuns.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Payroll History</h3>
          <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="text-center">Working Days</TableHead>
                  <TableHead className="text-right">Total Payroll</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.slice().reverse().map((run) => (
                  <TableRow key={run.id} className="hover:bg-table-row-hover">
                    <TableCell>{new Date(run.date).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</TableCell>
                    <TableCell className="text-center">{run.breakdowns.length}</TableCell>
                    <TableCell className="text-center">{run.workingDays}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(run.totalPayroll)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
