const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default', // Este es el usuario predeterminado en Redis Cloud
    password: process.env.REDIS_PASSWORD, // Asegúrate de tener REDIS_PASSWORD en tu archivo .env
    socket: {
        host: process.env.REDIS_HOST, // Host del servidor Redis
        port: process.env.REDIS_PORT, // Puerto del servidor Redis
    },
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Conectado a Redis');
    } catch (error) {
        console.error('Error al conectar con Redis', error);
    }
})();

module.exports = redisClient;
