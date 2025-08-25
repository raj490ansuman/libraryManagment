import React from 'react';
import './AnimatedBackground.css';

export const AnimatedBackground: React.FC = () => {
  // Generate multiple books with different animations
  const books = Array.from({ length: 15 }, (_, i) => (
    <div
      key={i}
      className="book"
      style={{
        '--delay': `${Math.random() * 10}s`,
        '--duration': `${10 + Math.random() * 20}s`,
        '--position': `${Math.random() * 100}%`,
        '--size': `${30 + Math.random() * 30}px`,
      } as React.CSSProperties}
    >
      <div className="book-spine"></div>
      <div className="book-cover"></div>
    </div>
  ));

  return (
    <div className="animated-background">
      <div className="books-container">
        {books}
      </div>
      <div className="overlay"></div>
    </div>
  );
};
