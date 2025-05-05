import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContractEditor } from '@/components/contract/ContractEditor';
import { AnalysisOptionsPanel } from '@/components/contract/AnalysisOptionsPanel';
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { AnalysisOptions } from '@shared/types';
import { useContractAnalysis } from '@/hooks/use-contract-analysis';

export default function Home() {
  const [contractCode, setContractCode] = useState<string>('');
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    security: true,
    gas: true,
    logic: true,
    specificFunctions: '',
    blockchain: 'ethereum',
    solidityVersion: 'auto',
  });

  const {
    analyzeContract,
    isAnalyzing,
    analysisResult
  } = useContractAnalysis();

  // Analysis loading progress state
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  type StageStatus = 'pending' | 'processing' | 'completed';
  const [analysisStages, setAnalysisStages] = useState<Array<{name: string, status: StageStatus}>>([
    { name: 'Parsing Solidity code', status: 'pending' },
    { name: 'Generating Abstract Syntax Tree', status: 'pending' },
    { name: 'Running Security Agent', status: 'pending' },
    { name: 'Gas Optimization Agent', status: 'pending' },
    { name: 'Logic Analysis Agent', status: 'pending' },
    { name: 'Generating Final Report', status: 'pending' },
  ]);

  // Update progress and stages when analysis starts
  const handleAnalyzeClick = () => {
    if (!contractCode || contractCode.trim().length === 0) return;
    
    setAnalysisProgress(0);
    setAnalysisStages(prevStages => 
      prevStages.map(stage => ({ ...stage, status: 'pending' }))
    );

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);

    // Simulate stage changes based on progress
    const stageUpdates: Array<{progress: number, index: number, status: StageStatus}> = [
      { progress: 5, index: 0, status: 'processing' },
      { progress: 10, index: 0, status: 'completed' },
      { progress: 15, index: 1, status: 'processing' },
      { progress: 25, index: 1, status: 'completed' },
      { progress: 30, index: 2, status: 'processing' },
      { progress: 45, index: 2, status: 'completed' },
      { progress: 50, index: 3, status: 'processing' },
      { progress: 65, index: 3, status: 'completed' },
      { progress: 70, index: 4, status: 'processing' },
      { progress: 85, index: 4, status: 'completed' },
      { progress: 90, index: 5, status: 'processing' },
    ];

    stageUpdates.forEach(update => {
      setTimeout(() => {
        setAnalysisStages(prevStages => {
          const newStages = [...prevStages];
          newStages[update.index] = { ...newStages[update.index], status: update.status };
          return newStages;
        });
      }, update.progress * 100);
    });

    // Start analysis
    analyzeContract({ 
      code: contractCode, 
      options: analysisOptions 
    });

    // Clean up interval if component unmounts
    return () => clearInterval(progressInterval);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Input Area */}
            <div className="lg:col-span-7">
              <ContractEditor
                onCodeChange={setContractCode}
                onAnalyzeClick={handleAnalyzeClick}
                isAnalyzing={isAnalyzing}
              />
              
              <AnalysisOptionsPanel
                options={analysisOptions}
                onChange={setAnalysisOptions}
              />
            </div>
            
            {/* Right Column - Results Area */}
            <div className="lg:col-span-5">
              {isAnalyzing ? (
                <AnalysisLoading
                  progress={analysisProgress}
                  stages={analysisStages}
                />
              ) : analysisResult ? (
                <AnalysisResults result={analysisResult} />
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center justify-center text-center h-full">
                  <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M7 16a7 7 0 1114 0H7z"></path>
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Analysis Results Yet</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    Paste your Solidity code in the editor or upload a file, then click "Analyze Contract" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
