import { useLocalTheme } from "@/hooks/use-theme";

export function Header() {
  const { theme, toggleTheme } = useLocalTheme();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.93 19.07L7.5 11.5L12 16L16.5 11.5L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16L7.5 11.5L9 7L12 9L15 7L16.5 11.5L12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-xl font-semibold">AI-Powered Smart Contract Analyzer</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <i className="ri-sun-line text-lg"></i>
              ) : (
                <i className="ri-moon-line text-lg"></i>
              )}
            </button>
            <a 
              href="https://github.com/your-repo/smart-contract-analyzer" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
            >
              Documentation
            </a>
            <a 
              href="#" 
              className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Connect Wallet
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
