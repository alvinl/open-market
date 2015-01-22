
module.exports = {

  redisPort: process.env.REDIS_PORT || 6379,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPass: process.env.REDIS_PASS,

  mongoURI:  process.env.MONGO_URI

};
