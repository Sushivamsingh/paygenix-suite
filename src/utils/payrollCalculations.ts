import { Employee, PayrollComponent, SalaryStructure, EmployeeSalaryBreakdown } from '@/types/payroll';

export function calculateComponentAmount(
  component: PayrollComponent,
  ctc: number,
  components: PayrollComponent[],
  calculatedAmounts: Map<string, number>
): number {
  if (component.componentCategory === 'fixed') {
    return component.amount;
  }

  // Percentage calculation
  let baseAmount: number;
  
  if (component.basedOn === 'ctc') {
    baseAmount = ctc / 12; // Monthly CTC
  } else {
    // Based on another component
    const baseComponentAmount = calculatedAmounts.get(component.basedOn);
    if (baseComponentAmount !== undefined) {
      baseAmount = baseComponentAmount;
    } else {
      // Find and calculate the base component first
      const baseComponent = components.find(c => c.id === component.basedOn);
      if (baseComponent) {
        baseAmount = calculateComponentAmount(baseComponent, ctc, components, calculatedAmounts);
        calculatedAmounts.set(baseComponent.id, baseAmount);
      } else {
        baseAmount = ctc / 12;
      }
    }
  }

  return (baseAmount * component.amount) / 100;
}

export function calculateEmployeeBreakdown(
  employee: Employee,
  structure: SalaryStructure,
  components: PayrollComponent[],
  workingDays: number = 30
): EmployeeSalaryBreakdown {
  const structureComponents = components.filter(c => structure.componentIds.includes(c.id));
  const calculatedAmounts = new Map<string, number>();
  
  const earnings: { name: string; amount: number }[] = [];
  const deductions: { name: string; amount: number }[] = [];
  
  // Use fixed 30-day divisor for consistent LOP calculation regardless of actual month days
  const fixedDaysInMonth = 30;
  const payableDays = fixedDaysInMonth - employee.lopCount;

  // First pass: calculate all amounts without LOP
  for (const component of structureComponents) {
    const baseAmount = calculateComponentAmount(component, employee.ctc, components, calculatedAmounts);
    calculatedAmounts.set(component.id, baseAmount);
  }

  // Second pass: apply LOP and categorize
  for (const component of structureComponents) {
    let amount = calculatedAmounts.get(component.id) || 0;
    
    // Apply LOP deduction only to earnings with LOP flag
    // Formula: (amount / 30) * payableDays = amount * (payableDays / 30)
    if (component.applyLopDeduction && component.componentType === 'earnings' && employee.lopCount > 0) {
      amount = (amount / fixedDaysInMonth) * payableDays;
    }

    amount = Math.round(amount * 100) / 100;

    if (component.componentType === 'earnings') {
      earnings.push({ name: component.name, amount });
    } else {
      deductions.push({ name: component.name, amount });
    }
  }

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const grossPay = totalEarnings;
  const netPay = totalEarnings - totalDeductions;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    structureName: structure.name,
    earnings,
    deductions,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    lopDays: employee.lopCount,
    workingDays,
    payableDays,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
