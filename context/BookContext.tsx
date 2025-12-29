import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book } from '../types';
import { MOCK_BOOKS } from '../constants';
import { fetchBooksFromSheet, getApiUrl } from '../services/api';

interface BookContextType {
  books: Book[];
  isLoading: boolean;
  refreshBooks: () => Promise<void>;
  isUsingLive: boolean;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingLive, setIsUsingLive] = useState(false);

  const loadBooks = async () => {
    const url = getApiUrl();
    if (!url) {
        setBooks(MOCK_BOOKS);
        setIsUsingLive(false);
        return;
    }

    setIsLoading(true);
    try {
      const sheetBooks = await fetchBooksFromSheet();
      if (sheetBooks && sheetBooks.length > 0) {
        // Reverse to show newest first
        setBooks(sheetBooks.reverse()); 
        setIsUsingLive(true);
      } else {
        // Fallback to mock if sheet is empty or error, but still marking as attempted live
        setBooks(MOCK_BOOKS);
        setIsUsingLive(false);
      }
    } catch (e) {
      console.error(e);
      setBooks(MOCK_BOOKS);
      setIsUsingLive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <BookContext.Provider value={{ books, isLoading, refreshBooks: loadBooks, isUsingLive }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};