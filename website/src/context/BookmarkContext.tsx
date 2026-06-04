import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { BookmarkItem, getBookmarks, saveBookmarks } from '../utils/bookmarkStorage';

interface BookmarkContextType {
  bookmarks: BookmarkItem[];
  addBookmark: (item: BookmarkItem) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  clearBookmarks: () => void;
}

export const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    // Load from local storage on mount
    setBookmarks(getBookmarks());
  }, []);

  const addBookmark = (item: BookmarkItem) => {
    setBookmarks((prev) => {
      // Prevent duplicates
      if (prev.some((b) => b.id === item.id)) return prev;
      const updated = [...prev, item];
      saveBookmarks(updated);
      return updated;
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveBookmarks(updated);
      return updated;
    });
  };

  const isBookmarked = (id: string) => {
    return bookmarks.some((b) => b.id === id);
  };

  const clearBookmarks = () => {
    setBookmarks([]);
    saveBookmarks([]);
  };

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, clearBookmarks }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};
