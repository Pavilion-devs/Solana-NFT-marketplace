import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FindingItem } from './FindingItem';
import { AnalysisResponse, Finding } from '@shared/types';

interface AnalysisResultsProps {
  result: AnalysisResponse;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedFindings, setExpandedFindings] = useState(false);

  // Count findings by type
  const securityCount = result.findings.filter(f => f.type === 'security').length;
  const gasCount = result.findings.filter(f => f.type === 'gas').length;
  const logicCount = result.findings.filter(f => f.type === 'logic').length;
  
  // Count findings by severity
  const criticalCount = result.findings.filter(f => f.severity === 'critical').length;
  const highCount = result.findings.filter(f => f.severity === 'high').length;
  const mediumCount = result.findings.filter(f => f.severity === 'medium').length;
  const lowCount = result.findings.filter(f => f.severity === 'low').length;

  // Filter findings by current tab
  const getTabFindings = (): Finding[] => {
    if (activeTab === 'summary') {
      // Show most important findings first (limited to 3 unless expanded)
      const sortedFindings = [...result.findings].sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity as keyof typeof severityOrder] - 
               severityOrder[b.severity as keyof typeof severityOrder];
      });
      return expandedFindings ? sortedFindings : sortedFindings.slice(0, 3);
    } else {
      return result.findings.filter(f => f.type === activeTab);
    }
  };

  // Export analysis report as JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "smart-contract-analysis.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analysis Results</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <i className="ri-file-download-line mr-1.5"></i> Export
          </Button>
          <Button variant="outline" size="sm">
            <i className="ri-share-line mr-1.5"></i> Share
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-gray-200 dark:border-gray-800 w-full justify-start rounded-none">
          <TabsTrigger value="summary" className="data-[state=active]:border-primary-500 rounded-none border-b-2 border-transparent py-3 px-4">
            Summary
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:border-primary-500 rounded-none border-b-2 border-transparent py-3 px-4">
            Security
            {securityCount > 0 && (
              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 ml-1 py-0.5 px-2 rounded-full text-xs font-medium">
                {securityCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="gas" className="data-[state=active]:border-primary-500 rounded-none border-b-2 border-transparent py-3 px-4">
            Gas
            {gasCount > 0 && (
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 ml-1 py-0.5 px-2 rounded-full text-xs font-medium">
                {gasCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logic" className="data-[state=active]:border-primary-500 rounded-none border-b-2 border-transparent py-3 px-4">
            Logic
            {logicCount > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ml-1 py-0.5 px-2 rounded-full text-xs font-medium">
                {logicCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Analysis Summary</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {result.contractName} ({result.lineCount} lines)
              </p>
            </div>
            <div className="flex">
              {criticalCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 mr-2">
                  <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Critical: {criticalCount}
                </span>
              )}
              {highCount + mediumCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 mr-2">
                  <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Medium: {highCount + mediumCount}
                </span>
              )}
              {lowCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Low: {lowCount}
                </span>
              )}
            </div>
          </div>
          
          {/* Contract score card */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">Contract Security Score</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Based on {result.findings.length} issues detected
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center">
                  <p className={`text-3xl font-bold ${
                    result.score >= 80 
                      ? 'text-green-500' 
                      : result.score >= 60 
                        ? 'text-yellow-500' 
                        : 'text-red-500'
                  }`}>
                    {result.score}
                  </p>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-2">/100</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                  <div 
                    style={{ width: `${result.score}%` }} 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      result.score >= 80 
                        ? 'bg-green-500' 
                        : result.score >= 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`}
                  ></div>
                </div>
                <div className="flex text-xs justify-between text-gray-500 dark:text-gray-400">
                  <span>0</span>
                  <span>Poor</span>
                  <span>Average</span>
                  <span>Good</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key findings */}
          <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Key Findings</h4>
          
          <div className="space-y-4">
            {getTabFindings().map((finding, index) => (
              <FindingItem key={index} finding={finding} />
            ))}
            
            {/* Show more button if there are more than 3 findings */}
            {result.findings.length > 3 && (
              <button 
                onClick={() => setExpandedFindings(!expandedFindings)}
                className="w-full flex justify-between items-center p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {expandedFindings ? 'Show less' : `View ${result.findings.length - 3} more findings`}
                </span>
                <i className={`ri-arrow-${expandedFindings ? 'up' : 'down'}-s-line text-gray-500`}></i>
              </button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="p-6">
          <div className="space-y-4">
            {getTabFindings().map((finding, index) => (
              <FindingItem key={index} finding={finding} />
            ))}
            {getTabFindings().length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No security issues found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your contract passed all security checks.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="gas" className="p-6">
          <div className="space-y-4">
            {getTabFindings().map((finding, index) => (
              <FindingItem key={index} finding={finding} />
            ))}
            {getTabFindings().length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No gas optimizations found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your contract is already optimized for gas efficiency.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="logic" className="p-6">
          <div className="space-y-4">
            {getTabFindings().map((finding, index) => (
              <FindingItem key={index} finding={finding} />
            ))}
            {getTabFindings().length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No logic flaws detected</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your contract logic appears to be sound.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
