import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

/**
 *
 * @param key - The key to check in the Redis cache.
 * @param dbCallback - The callback to fetch fresh data if the cache is empty.
 * @param ttl - The time-to-live (TTL) for the cached data in seconds (default: 3600).
 * @returns The cached or fresh data.
 */
export async function getCachedData<T>(
  key: string,
  dbCallback: () => Promise<T>,
  ttl = 3600
): Promise<T> {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }

    const freshData = await dbCallback();
    await redisClient.set(key, JSON.stringify(freshData), { EX: ttl });
    return freshData;
  } catch (err) {
    console.error("Redis error:", err);
    throw err; 
  }
}

export { redisClient };
