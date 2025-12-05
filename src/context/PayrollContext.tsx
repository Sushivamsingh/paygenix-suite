import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, PayrollComponent, SalaryStructure, PayrollRun } from '@/types/payroll';

interface PayrollContextType {
  employees: Employee[];
  components: PayrollComponent[];
  structures: SalaryStructure[];
  payrollRuns: PayrollRun[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  addComponent: (component: PayrollComponent) => void;
  updateComponent: (component: PayrollComponent) => void;
  deleteComponent: (id: string) => void;
  addStructure: (structure: SalaryStructure) => void;
  updateStructure: (structure: SalaryStructure) => void;
  deleteStructure: (id: string) => void;
  addPayrollRun: (run: PayrollRun) => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

const STORAGE_KEYS = {
  employees: 'payroll_employees',
  components: 'payroll_components',
  structures: 'payroll_structures',
  runs: 'payroll_runs',
};

export function PayrollProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.employees);
    return stored ? JSON.parse(stored) : [];
  });

  const [components, setComponents] = useState<PayrollComponent[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.components);
    return stored ? JSON.parse(stored) : [];
  });

  const [structures, setStructures] = useState<SalaryStructure[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.structures);
    return stored ? JSON.parse(stored) : [];
  });

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.runs);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.structures, JSON.stringify(structures));
  }, [structures]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.runs, JSON.stringify(payrollRuns));
  }, [payrollRuns]);

  const addEmployee = (employee: Employee) => {
    setEmployees(prev => [...prev, employee]);
  };

  const updateEmployee = (employee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addComponent = (component: PayrollComponent) => {
    setComponents(prev => [...prev, component]);
  };

  const updateComponent = (component: PayrollComponent) => {
    setComponents(prev => prev.map(c => c.id === component.id ? component : c));
  };

  const deleteComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const addStructure = (structure: SalaryStructure) => {
    setStructures(prev => [...prev, structure]);
  };

  const updateStructure = (structure: SalaryStructure) => {
    setStructures(prev => prev.map(s => s.id === structure.id ? structure : s));
  };

  const deleteStructure = (id: string) => {
    setStructures(prev => prev.filter(s => s.id !== id));
  };

  const addPayrollRun = (run: PayrollRun) => {
    setPayrollRuns(prev => [...prev, run]);
  };

  return (
    <PayrollContext.Provider value={{
      employees,
      components,
      structures,
      payrollRuns,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addComponent,
      updateComponent,
      deleteComponent,
      addStructure,
      updateStructure,
      deleteStructure,
      addPayrollRun,
    }}>
      {children}
    </PayrollContext.Provider>
  );
}

export function usePayroll() {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
}
