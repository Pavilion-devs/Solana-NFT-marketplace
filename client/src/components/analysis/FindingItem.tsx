import { Finding } from '@shared/types';

interface FindingItemProps {
  finding: Finding;
}

export function FindingItem({ finding }: FindingItemProps) {
  // Determine style based on severity
  const getSeverityStyles = () => {
    switch (finding.severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          textTitle: 'text-red-800 dark:text-red-300',
          textBody: 'text-red-700 dark:text-red-300/90',
          codeBg: 'bg-red-100 dark:bg-red-900/40',
          icon: 'ri-error-warning-fill text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          textTitle: 'text-orange-800 dark:text-orange-300',
          textBody: 'text-orange-700 dark:text-orange-300/90',
          codeBg: 'bg-orange-100 dark:bg-orange-900/40',
          icon: 'ri-alert-fill text-orange-600 dark:text-orange-400',
          badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          textTitle: 'text-yellow-800 dark:text-yellow-300',
          textBody: 'text-yellow-700 dark:text-yellow-300/90',
          codeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
          icon: 'ri-alert-fill text-yellow-600 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          textTitle: 'text-blue-800 dark:text-blue-300',
          textBody: 'text-blue-700 dark:text-blue-300/90',
          codeBg: 'bg-blue-100 dark:bg-blue-900/40',
          icon: 'ri-information-line text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          textTitle: 'text-gray-800 dark:text-gray-300',
          textBody: 'text-gray-700 dark:text-gray-400',
          codeBg: 'bg-gray-100 dark:bg-gray-700',
          icon: 'ri-information-line text-gray-600 dark:text-gray-400',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg`}>
      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className={`${styles.icon} text-lg`}></i>
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${styles.textTitle}`}>{finding.title}</h3>
            <div className={`mt-2 text-sm ${styles.textBody}`}>
              <p>{finding.description}</p>
              
              {finding.code && (
                <div className={`mt-2 ${styles.codeBg} rounded p-2 font-mono text-xs overflow-x-auto`}>
                  <code>{finding.code}</code>
                </div>
              )}
              
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                  {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                </span>
                {finding.lineNumbers && (
                  <span className="text-xs ml-1">Line {finding.lineNumbers}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {finding.recommendation && (
        <div className={`border-t ${styles.border} ${styles.bg.replace('bg-', 'bg-opacity-50 bg-')} px-4 py-3 rounded-b-lg`}>
          <div className="text-sm">
            <div className={`font-medium ${styles.textTitle}`}>Recommendation</div>
            <p className={`${styles.textBody} mt-1`}>{finding.recommendation}</p>
            {finding.recommendationCode && (
              <div className={`mt-2 ${styles.codeBg} rounded p-2 font-mono text-xs overflow-x-auto`}>
                <code>{finding.recommendationCode}</code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
