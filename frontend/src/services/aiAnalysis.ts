interface AIAnalysisResult {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const analyzeAssignment = async (file: File): Promise<AIAnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to analyze assignment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing assignment:', error);
    throw error;
  }
};

export const getAnalysisStatus = async (
  analysisId: string
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: AIAnalysisResult;
  error?: string;
}> => {
  try {
    const response = await fetch(`/api/ai/status/${analysisId}`);
    if (!response.ok) {
      throw new Error('Failed to get analysis status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting analysis status:', error);
    throw error;
  }
};
