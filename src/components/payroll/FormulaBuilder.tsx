import { useState } from 'react';
import { FormulaTerm, FormulaOperator, PayrollComponent } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Percent } from 'lucide-react';

interface FormulaBuilderProps {
  components: PayrollComponent[];
  currentComponentId?: string;
  value: FormulaTerm[];
  onChange: (terms: FormulaTerm[]) => void;
}

export function FormulaBuilder({ components, currentComponentId, value, onChange }: FormulaBuilderProps) {
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [percentageValue, setPercentageValue] = useState<string>('');
  const [showPercentageInput, setShowPercentageInput] = useState(false);

  const availableComponents = components.filter(c => c.id !== currentComponentId);
  const operators: FormulaOperator[] = ['+', '-', '*', '/'];

  const addComponent = () => {
    if (!selectedComponent) return;
    
    const newTerms = [...value];
    
    // Add operator if not first term
    if (newTerms.length > 0 && newTerms[newTerms.length - 1].type !== 'operator') {
      return; // Need an operator first
    }
    
    newTerms.push({ type: 'component', value: selectedComponent });
    onChange(newTerms);
    setSelectedComponent('');
  };

  const addPercentage = () => {
    if (!percentageValue || !selectedComponent) return;
    
    const newTerms = [...value];
    
    // Add operator if not first term and last term is not an operator
    if (newTerms.length > 0 && newTerms[newTerms.length - 1].type !== 'operator') {
      return; // Need an operator first
    }
    
    // Add percentage of component as a combined term
    newTerms.push({ 
      type: 'percentage', 
      value: `${percentageValue}%${selectedComponent}` // Format: "60%componentId"
    });
    onChange(newTerms);
    setPercentageValue('');
    setSelectedComponent('');
    setShowPercentageInput(false);
  };

  const addOperator = (op: FormulaOperator) => {
    if (value.length === 0) return; // Can't start with operator
    if (value[value.length - 1].type === 'operator') return; // Can't add consecutive operators
    
    onChange([...value, { type: 'operator', value: op }]);
  };

  const removeTerm = (index: number) => {
    const newTerms = [...value];
    newTerms.splice(index, 1);
    
    // Remove dangling operator at start or end
    if (newTerms.length > 0 && newTerms[0].type === 'operator') {
      newTerms.shift();
    }
    if (newTerms.length > 0 && newTerms[newTerms.length - 1].type === 'operator') {
      newTerms.pop();
    }
    
    onChange(newTerms);
  };

  const getTermDisplay = (term: FormulaTerm): string => {
    if (term.type === 'operator') {
      return term.value;
    }
    if (term.type === 'percentage') {
      // Parse "60%componentId" format
      const match = term.value.match(/^(\d+(?:\.\d+)?)%(.+)$/);
      if (match) {
        const [, percent, compId] = match;
        const comp = components.find(c => c.id === compId);
        return `${percent}% of ${comp?.name || 'Unknown'}`;
      }
      return term.value;
    }
    if (term.type === 'component') {
      if (term.value === 'ctc') return 'CTC (Monthly)';
      const comp = components.find(c => c.id === term.value);
      return comp?.name || 'Unknown';
    }
    return term.value;
  };

  const canAddTerm = value.length === 0 || value[value.length - 1].type === 'operator';
  const canAddOperator = value.length > 0 && value[value.length - 1].type !== 'operator';

  return (
    <div className="space-y-4">
      {/* Formula Display */}
      <div className="min-h-[60px] p-3 border rounded-md bg-muted/30 flex flex-wrap gap-2 items-center">
        {value.length === 0 ? (
          <span className="text-muted-foreground text-sm">Build your formula by adding components and operators below</span>
        ) : (
          value.map((term, index) => (
            <Badge 
              key={index} 
              variant={term.type === 'operator' ? 'outline' : 'secondary'}
              className="text-sm py-1 px-2 flex items-center gap-1"
            >
              {getTermDisplay(term)}
              <button
                type="button"
                onClick={() => removeTerm(index)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Add Component/Percentage */}
      <div className="space-y-3">
        <div className="flex gap-2 items-end">
          {showPercentageInput && (
            <div className="w-20">
              <Input
                type="number"
                placeholder="%"
                value={percentageValue}
                onChange={(e) => setPercentageValue(e.target.value)}
                className="text-center"
              />
            </div>
          )}
          <div className="flex-1">
            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
              <SelectTrigger>
                <SelectValue placeholder="Select component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ctc">CTC (Monthly)</SelectItem>
                {availableComponents.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showPercentageInput ? (
            <Button 
              type="button" 
              size="sm" 
              onClick={addPercentage}
              disabled={!canAddTerm || !selectedComponent || !percentageValue}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          ) : (
            <Button 
              type="button" 
              size="sm" 
              onClick={addComponent}
              disabled={!canAddTerm || !selectedComponent}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={showPercentageInput ? 'secondary' : 'outline'}
            onClick={() => setShowPercentageInput(!showPercentageInput)}
          >
            <Percent className="h-4 w-4 mr-1" />
            {showPercentageInput ? 'Hide %' : 'Add % of'}
          </Button>
        </div>
      </div>

      {/* Operators */}
      <div className="flex gap-2">
        <span className="text-sm text-muted-foreground self-center">Operators:</span>
        {operators.map((op) => (
          <Button
            key={op}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addOperator(op)}
            disabled={!canAddOperator}
            className="w-10"
          >
            {op}
          </Button>
        ))}
      </div>

      {/* Formula Preview */}
      {value.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Formula: </span>
          {value.map((term, i) => getTermDisplay(term)).join(' ')}
        </div>
      )}
    </div>
  );
}