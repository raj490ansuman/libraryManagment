import React from 'react';
import { Card } from 'antd';
import SuggestionList from '../components/suggestions/SuggestionList';
import { useAuth } from '../contexts/AuthContext';

export const SuggestionsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="suggestions-page">
      <Card title="Book Suggestions" className="mb-4">
        <p>
          Help us grow our library! Suggest books you'd like to see in our collection. 
          Other users can vote on suggestions, and our team will review the most popular ones.
        </p>
        {!user && (
          <p className="text-warning">
            Please log in to suggest books or vote on existing suggestions.
          </p>
        )}
      </Card>
      
      <SuggestionList />
    </div>
  );
};

export default SuggestionsPage;
