import { openDB } from 'idb';
export const libraryDatabase = () =>
  openDB('folha', 1, {
    upgrade(db) {
      db.createObjectStore('library');
    },
  });
