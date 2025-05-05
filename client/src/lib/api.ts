import { apiRequest } from './queryClient';
import { AnalysisOptions, AnalysisResponse } from '@shared/types';

export async function submitContract(
  code: string,
  options: AnalysisOptions
): Promise<AnalysisResponse> {
  const response = await apiRequest('POST', '/api/analyze', {
    code,
    options,
  });
  return response.json();
}

export async function getExampleContract(): Promise<string> {
  const response = await apiRequest('GET', '/api/examples/contract', {});
  const data = await response.json();
  return data.code;
}
