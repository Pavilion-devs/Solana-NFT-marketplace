interface AnalysisLoadingProps {
  progress: number;
  stages: {
    name: string;
    status: 'completed' | 'processing' | 'pending';
  }[];
}

export function AnalysisLoading({ progress, stages }: AnalysisLoadingProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Analyzing Contract</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This may take up to a minute depending on contract complexity</p>
        
        <div className="mt-6">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-xs font-semibold inline-block text-primary">
                Analysis in progress...
              </div>
              <div id="progress-percentage" className="text-right">
                <span className="text-xs font-semibold inline-block text-primary">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100 dark:bg-gray-800">
              <div 
                className="animate-progress shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-left">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Pipeline:</h4>
          <ul className="space-y-1 text-sm">
            {stages.map((stage, index) => (
              <li 
                key={index} 
                className={`flex items-center ${
                  stage.status === 'completed' 
                    ? 'text-green-600 dark:text-green-400' 
                    : stage.status === 'processing' 
                      ? 'text-primary' 
                      : 'text-gray-400'
                }`}
              >
                {stage.status === 'completed' && (
                  <i className="ri-checkbox-circle-fill mr-2"></i>
                )}
                {stage.status === 'processing' && (
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                )}
                {stage.status === 'pending' && (
                  <i className="ri-time-line mr-2"></i>
                )}
                {stage.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
