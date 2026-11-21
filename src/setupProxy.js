const { createRestaurantMiddleware } = require('../server/restaurantsApi');

module.exports = function setupProxy(app) {
  app.use('/restaurants-to-try/api/restaurants', createRestaurantMiddleware());
};
