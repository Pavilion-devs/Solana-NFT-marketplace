export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">Documentation</span>
              <i className="ri-file-text-line text-lg"></i>
            </a>
            <a href="https://github.com/your-repo/smart-contract-analyzer" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">GitHub</span>
              <i className="ri-github-fill text-lg"></i>
            </a>
            <a href="https://twitter.com/your-twitter" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">Twitter</span>
              <i className="ri-twitter-fill text-lg"></i>
            </a>
          </div>
          <p className="mt-8 md:mt-0 text-center md:text-right text-sm text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} AI-Powered Smart Contract Analyzer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
