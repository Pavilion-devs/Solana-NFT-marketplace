import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisOptions } from '@shared/types';

interface AnalysisOptionsPanelProps {
  options: AnalysisOptions;
  onChange: (options: AnalysisOptions) => void;
}

export function AnalysisOptionsPanel({ options, onChange }: AnalysisOptionsPanelProps) {
  const handleOptionChange = (option: keyof AnalysisOptions, value: boolean) => {
    onChange({
      ...options,
      [option]: value,
    });
  };

  const handleAdvancedOptionsChange = (value: string) => {
    onChange({
      ...options,
      specificFunctions: value,
    });
  };

  return (
    <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Analysis Options</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Security Analysis Option */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id="security-check"
                  checked={options.security}
                  onCheckedChange={(checked) => 
                    handleOptionChange('security', checked as boolean)
                  }
                />
              </div>
              <div className="ml-3 text-sm">
                <Label 
                  htmlFor="security-check" 
                  className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Security Analysis
                </Label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Detect vulnerabilities like reentrancy, overflow, unchecked calls
                </p>
              </div>
            </div>
          </div>
          
          {/* Gas Optimization Option */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id="gas-check"
                  checked={options.gas}
                  onCheckedChange={(checked) => 
                    handleOptionChange('gas', checked as boolean)
                  }
                />
              </div>
              <div className="ml-3 text-sm">
                <Label 
                  htmlFor="gas-check" 
                  className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Gas Optimization
                </Label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Identify inefficient code patterns and storage usage
                </p>
              </div>
            </div>
          </div>
          
          {/* Logic Flaws Option */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer transition-colors">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id="logic-check"
                  checked={options.logic}
                  onCheckedChange={(checked) => 
                    handleOptionChange('logic', checked as boolean)
                  }
                />
              </div>
              <div className="ml-3 text-sm">
                <Label 
                  htmlFor="logic-check" 
                  className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Logic Flaws
                </Label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Uncover edge cases and logical errors
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Label 
            htmlFor="advanced-options" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Advanced Options
          </Label>
          <div className="mt-2">
            <Textarea
              id="advanced-options"
              rows={2}
              placeholder="Enter specific functions to analyze (e.g., transfer,withdraw) or leave blank for full contract"
              className="w-full"
              value={options.specificFunctions}
              onChange={(e) => handleAdvancedOptionsChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}