import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

await redisClient.connect();

export async function getCachedData(key: string, dbCallback: () => Promise<any>, ttl = 3600) {
  const cachedData = await redisClient.get(key);
  if (cachedData) {
    return JSON.parse(cachedData); 
  }

  const freshData = await dbCallback();
  await redisClient.set(key, JSON.stringify(freshData), { EX: ttl }); 
  return freshData;
}

export { redisClient };
