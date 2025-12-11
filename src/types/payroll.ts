export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  ctc: number;
  lopCount: number;
  salaryStructureId?: string;
}

export type ComponentType = 'earnings' | 'deductions';
export type ComponentCategory = 'fixed' | 'percentage' | 'formula';
export type FormulaOperator = '+' | '-' | '*' | '/';

export interface FormulaTerm {
  type: 'component' | 'percentage' | 'operator';
  value: string; // component id, percentage value, or operator
}

export interface PayrollComponent {
  id: string;
  name: string;
  componentType: ComponentType;
  componentCategory: ComponentCategory;
  amount: number; // Fixed amount or percentage value
  basedOn: string; // 'ctc' or component id
  applyLopDeduction: boolean;
  formulaTerms?: FormulaTerm[]; // For formula category
}

export interface SalaryStructure {
  id: string;
  name: string;
  componentIds: string[];
}

export interface EmployeeSalaryBreakdown {
  employeeId: string;
  employeeName: string;
  structureName: string;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  totalEarnings: number;
  totalDeductions: number;
  grossPay: number;
  netPay: number;
  lopDays: number;
  workingDays: number;
  payableDays: number;
}

export interface PayrollRun {
  id: string;
  date: string;
  workingDays: number;
  breakdowns: EmployeeSalaryBreakdown[];
  totalPayroll: number;
}
