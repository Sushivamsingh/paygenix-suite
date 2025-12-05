import { useState } from 'react';
import { PayrollProvider, usePayroll } from '@/context/PayrollContext';
import { EmployeeData } from '@/components/payroll/EmployeeData';
import { PayrollSettings } from '@/components/payroll/PayrollSettings';
import { SalaryStructure } from '@/components/payroll/SalaryStructure';
import { RunPayroll } from '@/components/payroll/RunPayroll';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Settings2, FileSpreadsheet, Calculator, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/utils/payrollCalculations';

function DashboardStats() {
  const { employees, components, structures, payrollRuns } = usePayroll();
  
  const lastPayroll = payrollRuns[payrollRuns.length - 1];
  const totalCTC = employees.reduce((sum, e) => sum + e.ctc, 0);

  const stats = [
    { label: 'Employees', value: employees.length, icon: Users },
    { label: 'Components', value: components.length, icon: Settings2 },
    { label: 'Structures', value: structures.length, icon: FileSpreadsheet },
    { label: 'Total CTC', value: formatCurrency(totalCTC), icon: IndianRupee },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Payroll Management</h1>
              <p className="text-sm text-muted-foreground">Manage employees, structures & run payroll</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <DashboardStats />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="structures" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Structures</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Run Payroll</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeeData />
          </TabsContent>
          <TabsContent value="settings">
            <PayrollSettings />
          </TabsContent>
          <TabsContent value="structures">
            <SalaryStructure />
          </TabsContent>
          <TabsContent value="payroll">
            <RunPayroll />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

const Index = () => {
  return (
    <PayrollProvider>
      <PayrollDashboard />
    </PayrollProvider>
  );
};

export default Index;
