const redisClient = require("../config/cacheConfig");

/**
 * Elimina la clave de caché en Redis.
 * @param {string} key - Clave que se va a invalidar.
 */
async function invalidateCache(key) {
  try {
    await redisClient.del(key);
    console.log(`Caché invalidado: ${key}`);
  } catch (error) {
    console.error(`Error al invalidar caché para ${key}:`, error);
  }
}

module.exports = {
  invalidateCache
};
