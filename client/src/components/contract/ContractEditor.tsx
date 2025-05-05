import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { setupMonaco, disposeMonaco } from '@/lib/monaco';
import { getExampleContract } from '@/lib/api';
import * as monaco from 'monaco-editor';

interface ContractEditorProps {
  onCodeChange: (code: string) => void;
  onAnalyzeClick: () => void;
  isAnalyzing: boolean;
}

export function ContractEditor({ onCodeChange, onAnalyzeClick, isAnalyzing }: ContractEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState<string>('// Paste your Solidity code here or upload a file');
  const [blockchain, setBlockchain] = useState<string>('ethereum');
  const [solidityVersion, setSolidityVersion] = useState<string>('auto');

  // Initialize Monaco editor when component mounts
  useEffect(() => {
    if (editorContainerRef.current) {
      const editor = setupMonaco(editorContainerRef.current, code, (value) => {
        setCode(value);
        onCodeChange(value);
      });
      setEditorInstance(editor);

      return () => {
        disposeMonaco(editor);
      };
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        onCodeChange(content);
        if (editorInstance) {
          editorInstance.setValue(content);
        }
      };
      reader.readAsText(file);
    }
  };

  // Load example contract
  const handleLoadExample = async () => {
    try {
      const exampleCode = await getExampleContract();
      setCode(exampleCode);
      onCodeChange(exampleCode);
      if (editorInstance) {
        editorInstance.setValue(exampleCode);
      }
    } catch (error) {
      console.error('Failed to load example contract', error);
    }
  };

  // Create a hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Smart Contract Code</h2>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".sol"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="ri-upload-2-line mr-1.5"></i> Upload
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLoadExample}
          >
            <i className="ri-file-code-line mr-1.5"></i> Example
          </Button>
        </div>
      </div>
      
      {/* Monaco Editor Container */}
      <div 
        ref={editorContainerRef}
        className="monaco-editor-container"
        style={{ height: '400px' }}
      />
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="space-y-1 min-w-[180px]">
              <Label htmlFor="blockchain-select">Target Blockchain</Label>
              <Select value={blockchain} onValueChange={setBlockchain}>
                <SelectTrigger id="blockchain-select">
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
                  <SelectItem value="goerli">Ethereum Goerli</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label htmlFor="version-select">Solidity Version</Label>
              <Select value={solidityVersion} onValueChange={setSolidityVersion}>
                <SelectTrigger id="version-select">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="0.8.24">0.8.24</SelectItem>
                  <SelectItem value="0.8.20">0.8.20</SelectItem>
                  <SelectItem value="0.8.17">0.8.17</SelectItem>
                  <SelectItem value="0.8.0">0.8.0</SelectItem>
                  <SelectItem value="0.7.6">0.7.6</SelectItem>
                  <SelectItem value="0.6.12">0.6.12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={onAnalyzeClick} 
            disabled={isAnalyzing || !code || code.trim().length === 0}
            className="mt-4 sm:mt-0"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <i className="ri-search-line mr-2"></i> Analyze Contract
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
