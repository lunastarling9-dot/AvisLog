
const DB_NAME = 'AvisLogDB';
const DB_VERSION = 2; // Increment version to trigger onupgradeneeded

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('species')) {
        db.createObjectStore('species', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('observations')) {
        db.createObjectStore('observations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAll = <T,>(storeName: string): Promise<T[]> => {
  return new Promise(async (resolve) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const getItem = <T,>(storeName: string, key: string): Promise<T | undefined> => {
  return new Promise(async (resolve) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
  });
};

export const putItem = <T,>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
  });
};

export const deleteItem = (storeName: string, id: string): Promise<void> => {
  return new Promise(async (resolve) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
  });
};

export const clearStore = (storeName: string): Promise<void> => {
  return new Promise(async (resolve) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
  });
};
