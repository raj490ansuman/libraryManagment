import api from './api';

export interface Vote {
  id: number;
  userId: number;
  suggestionId: number;
  createdAt: string;
}

export interface Suggestion {
  id: number;
  title: string;
  author: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED';
  userId: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
  };
  votes?: Vote[];
}

export interface CreateSuggestionData {
  title: string;
  author: string;
  reason?: string;
}

export const getSuggestions = async (): Promise<Suggestion[]> => {
  const response = await api.get('/suggestions');
  return response.data;
};

export const createSuggestion = async (data: CreateSuggestionData): Promise<Suggestion> => {
  const response = await api.post('/suggestions', data);
  return response.data;
};

export const voteForSuggestion = async (suggestionId: number): Promise<{ voted: boolean }> => {
  const response = await api.post(`/suggestions/${suggestionId}/vote`);
  return response.data;
};

export const updateSuggestionStatus = async (
  suggestionId: number, 
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED'
): Promise<Suggestion> => {
  const response = await api.patch(`/suggestions/${suggestionId}/status`, { status });
  return response.data;
};

export const deleteSuggestion = async (suggestionId: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/suggestions/${suggestionId}`);
  return response.data;
};
