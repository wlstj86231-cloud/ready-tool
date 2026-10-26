// Keeps the current evidence pack on this device only (IndexedDB), so work survives
// a reload — for example when a low-memory phone closes the browser while the camera is open.
// Nothing here is sent anywhere. Every call fails soft: without IndexedDB the tool still works.

const DB_NAME = "goatool-evidence";
const VERSION = 1;

function open() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("no indexedDB"));
      return;
    }
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(storeName, mode, action) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = action(store);
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveMeta(value) {
  try {
    await run("meta", "readwrite", (store) => store.put(value, "pack"));
    return true;
  } catch {
    return false;
  }
}

export async function loadMeta() {
  try {
    return (await run("meta", "readonly", (store) => store.get("pack"))) || null;
  } catch {
    return null;
  }
}

export async function saveFile(record) {
  try {
    await run("files", "readwrite", (store) => store.put(record));
    return true;
  } catch {
    return false;
  }
}

export async function updateFile(id, changes) {
  try {
    const record = await run("files", "readonly", (store) => store.get(id));
    if (!record) return false;
    await run("files", "readwrite", (store) => store.put({ ...record, ...changes }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(id) {
  try {
    await run("files", "readwrite", (store) => store.delete(id));
  } catch {
    /* ignore */
  }
}

export async function loadFiles() {
  try {
    return (await run("files", "readonly", (store) => store.getAll())) || [];
  } catch {
    return [];
  }
}

export async function clearAll() {
  try {
    await run("files", "readwrite", (store) => store.clear());
    await run("meta", "readwrite", (store) => store.clear());
  } catch {
    /* ignore */
  }
}
