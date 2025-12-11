import { Employee, PayrollComponent, SalaryStructure, EmployeeSalaryBreakdown, FormulaTerm } from '@/types/payroll';

function getComponentAmount(
  componentId: string,
  ctc: number,
  components: PayrollComponent[],
  calculatedAmounts: Map<string, number>
): number {
  if (componentId === 'ctc') {
    return ctc / 12; // Monthly CTC
  }
  
  const existingAmount = calculatedAmounts.get(componentId);
  if (existingAmount !== undefined) {
    return existingAmount;
  }
  
  const component = components.find(c => c.id === componentId);
  if (component) {
    const amount = calculateComponentAmount(component, ctc, components, calculatedAmounts);
    calculatedAmounts.set(component.id, amount);
    return amount;
  }
  
  return 0;
}

function evaluateFormula(
  terms: FormulaTerm[],
  ctc: number,
  components: PayrollComponent[],
  calculatedAmounts: Map<string, number>
): number {
  if (terms.length === 0) return 0;
  
  // Convert terms to values and operators
  const values: number[] = [];
  const operators: string[] = [];
  
  for (const term of terms) {
    if (term.type === 'operator') {
      operators.push(term.value);
    } else if (term.type === 'component') {
      values.push(getComponentAmount(term.value, ctc, components, calculatedAmounts));
    } else if (term.type === 'percentage') {
      // Parse "60%componentId" format
      const match = term.value.match(/^(\d+(?:\.\d+)?)%(.+)$/);
      if (match) {
        const [, percent, compId] = match;
        const baseAmount = getComponentAmount(compId, ctc, components, calculatedAmounts);
        values.push((baseAmount * parseFloat(percent)) / 100);
      } else {
        values.push(0);
      }
    }
  }
  
  // Evaluate with proper operator precedence (* and / before + and -)
  // First pass: handle * and /
  let i = 0;
  while (i < operators.length) {
    if (operators[i] === '*' || operators[i] === '/') {
      const left = values[i];
      const right = values[i + 1];
      const result = operators[i] === '*' ? left * right : (right !== 0 ? left / right : 0);
      values.splice(i, 2, result);
      operators.splice(i, 1);
    } else {
      i++;
    }
  }
  
  // Second pass: handle + and -
  let result = values[0] || 0;
  for (let j = 0; j < operators.length; j++) {
    const nextValue = values[j + 1] || 0;
    if (operators[j] === '+') {
      result += nextValue;
    } else if (operators[j] === '-') {
      result -= nextValue;
    }
  }
  
  return result;
}

export function calculateComponentAmount(
  component: PayrollComponent,
  ctc: number,
  components: PayrollComponent[],
  calculatedAmounts: Map<string, number>
): number {
  if (component.componentCategory === 'fixed') {
    return component.amount;
  }

  if (component.componentCategory === 'formula' && component.formulaTerms) {
    return evaluateFormula(component.formulaTerms, ctc, components, calculatedAmounts);
  }

  // Percentage calculation
  let baseAmount: number;
  
  if (component.basedOn === 'ctc') {
    baseAmount = ctc / 12; // Monthly CTC
  } else {
    // Based on another component
    baseAmount = getComponentAmount(component.basedOn, ctc, components, calculatedAmounts);
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
