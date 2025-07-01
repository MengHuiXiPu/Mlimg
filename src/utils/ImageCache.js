// ImageCache.js

const DB_NAME = 'imageCacheDB';
const STORE_NAME = 'images';

export default {
    async getImage(id) {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const request = store.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = function () {
                    const result = request.result;
                    if (result) {
                        // 检查时间戳是否超过了24小时
                        const currentTime = Date.now();
                        if (currentTime - result.timestamp < 24 * 60 * 60 * 1000) {
                            resolve(result.data);
                        } else {
                            // 数据已过期，删除并返回null
                            store.delete(id);
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = function () {
                    reject(request.error);
                };
            });
        } catch (error) {
            return Promise.reject(error);
        }
    },

    async saveImage(id, imageData) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // 将图片数据存入缓存，包括时间戳
        const timestamp = Date.now();
        await store.put({ id, data: imageData, timestamp });

        // 提交事务
        await tx.complete;
    }
};

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}
