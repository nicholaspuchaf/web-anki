import { openDB } from 'idb';
export const feedDatabase = () =>
  openDB('folha-feed', 1, {
    upgrade(db) {
      db.createObjectStore('state');
    },
  });
