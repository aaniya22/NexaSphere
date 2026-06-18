export type BookmarkType = 'Event' | 'Activity' | 'Roadmap';

export interface BookmarkItem {
  id: string;
  type: BookmarkType;
  title: string;
  link?: string; // Route to navigate to the item
  date?: string; // Optional metadata for display
}

const STORAGE_KEY = 'ns-bookmarks';

export const getBookmarks = (): BookmarkItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[bookmarkStorage] Failed to parse bookmarks from localStorage:',
        (error as Error).message
      );
    }
    return [];
  }
};

export const saveBookmarks = (bookmarks: BookmarkItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[bookmarkStorage] Failed to save bookmarks to localStorage:',
        (error as Error).message
      );
    }
  }
};
