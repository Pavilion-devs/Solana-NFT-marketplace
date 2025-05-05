import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { submitContract } from '@/lib/api';
import { AnalysisOptions, AnalysisResponse, Finding } from '@shared/types';

export function useContractAnalysis() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const { mutate: analyzeContract, isPending } = useMutation({
    mutationFn: ({ code, options }: { code: string; options: AnalysisOptions }) =>
      submitContract(code, options),
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.findings.length} issues in your contract.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const getFilteredFindings = (type?: string): Finding[] => {
    if (!analysisResult) return [];
    if (!type) return analysisResult.findings;
    return analysisResult.findings.filter(finding => finding.type === type);
  };

  const countFindingsBySeverity = (severity: string): number => {
    if (!analysisResult) return 0;
    return analysisResult.findings.filter(finding => finding.severity === severity).length;
  };

  return {
    analyzeContract,
    isAnalyzing: isPending,
    analysisResult,
    getFilteredFindings,
    countFindingsBySeverity,
    securityFindings: getFilteredFindings('security'),
    gasFindings: getFilteredFindings('gas'),
    logicFindings: getFilteredFindings('logic'),
    criticalCount: countFindingsBySeverity('critical'),
    highCount: countFindingsBySeverity('high'),
    mediumCount: countFindingsBySeverity('medium'),
    lowCount: countFindingsBySeverity('low'),
  };
}
