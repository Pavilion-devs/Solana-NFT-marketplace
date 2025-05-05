import { useEffect, useState } from 'react';

interface AnalysisLoadingProps {
  progress: number;
  stages: {
    name: string;
    status: 'completed' | 'processing' | 'pending';
  }[];
}

export function AnalysisLoading({ progress, stages }: AnalysisLoadingProps) {
  const [insights, setInsights] = useState<string[]>([
    "Scanning for reentrancy vulnerabilities...",
    "Analyzing function gas usage patterns...",
    "Checking for unchecked external calls...",
    "Validating access control mechanisms...",
    "Examining integer overflow/underflow risks...",
    "Detecting potential logic flaws in business rules...",
    "Checking state variable access patterns...",
    "Analyzing time-dependent vulnerabilities..."
  ]);
  
  const [currentInsight, setCurrentInsight] = useState(0);
  
  // Cycle through insights every few seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [insights.length]);
  
  // Get current active stage
  const activeStage = stages.find(stage => stage.status === 'processing');
  
  // Calculate estimated time remaining
  const getEstimatedTime = () => {
    if (progress < 10) return '1-2 minutes';
    if (progress < 30) return 'about a minute';
    if (progress < 60) return '30-45 seconds';
    if (progress < 90) return '15-20 seconds';
    return 'few seconds';
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <svg className="animate-spin h-20 w-20 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-primary">
            {progress}%
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-primary to-primary-light dark:from-primary-dark dark:to-primary bg-clip-text text-transparent">
          Analyzing Smart Contract
        </h3>
        
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Estimated time remaining: {getEstimatedTime()}
        </p>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-md text-sm text-blue-700 dark:text-blue-300 flex items-start">
          <div className="mr-2 mt-0.5 text-blue-500 dark:text-blue-400">
            <i className="ri-information-line"></i>
          </div>
          <div className="flex-1 text-left transition-opacity duration-300 opacity-100">
            {insights[currentInsight]}
          </div>
        </div>
        
        <div className="mt-6">
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100 dark:bg-gray-800">
              <div 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary to-blue-400 transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-left">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Pipeline:</h4>
          <ul className="space-y-2 text-sm">
            {stages.map((stage, index) => (
              <li 
                key={index} 
                className={`flex items-center p-2 rounded-md transition-colors duration-200 ${
                  stage.status === 'completed' 
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                    : stage.status === 'processing' 
                      ? 'text-primary bg-blue-50 dark:bg-blue-900/20' 
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {stage.status === 'completed' && (
                  <div className="flex-shrink-0 w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-800/30">
                    <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                  </div>
                )}
                {stage.status === 'processing' && (
                  <div className="flex-shrink-0 w-5 h-5 mr-2 flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin text-primary"></i>
                  </div>
                )}
                {stage.status === 'pending' && (
                  <div className="flex-shrink-0 w-5 h-5 mr-2 flex items-center justify-center">
                    <i className="ri-time-line text-gray-400"></i>
                  </div>
                )}
                <span className={stage.status === 'processing' ? 'font-medium' : ''}>
                  {stage.name}
                </span>
                {stage.status === 'processing' && (
                  <span className="ml-auto text-xs text-primary-600 dark:text-primary-400 animate-pulse">
                    In progress...
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Our AI agents are analyzing your code for security vulnerabilities, 
            gas optimization opportunities, and potential logic flaws.
          </p>
        </div>
      </div>
    </div>
  );
}
