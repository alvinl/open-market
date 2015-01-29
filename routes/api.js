
/**
 * Dependencies
 */

var config  = require('../config'),
    express = require('express'),
    router  = express.Router();

var models = require('../models'),
    redis  = require('redis').createClient(config.redisPort, config.redisHost, { auth_pass: config.redisPass || null  });

/**
 * GET /api/prices
 *
 * Required params
 *   - `item` Item name
 *   - `appID` Items appID
 */
router.get('/prices', function (req, res, next) {

  var ONE_DAY_AGO = Date.now() - (24 * 60 * 60 * 1000);

  var itemName = req.param('item'),
      appID    = req.param('appID');

  if (!itemName)
    return res.status(400).json({ error: 'Missing item parameter' });

  else if (!appID)
    return res.status(400).json({ error: 'Missing appID parameter' });

  else if (isNaN(appID))
    return res.status(400).json({ error: 'Invalid appID' });

  // Lookup the items price history
  redis.lrange('market:prices:' + appID + ':' + encodeURIComponent(itemName), 0, 24, function (err, priceHistory) {

    if (err)
      return next(err);

    // Format priceHistory and only return data from the past 24 hours
    priceHistory = priceHistory.map(function (pricePoint) {

      return { time: new Date(new Date(parseInt(pricePoint.split(' ')[0], 10)).toUTCString()).getTime(), price: parseInt(pricePoint.split(' ')[1], 10) };

    }).filter(function (pricePoint) {

      return (parseInt(pricePoint.time, 10) > ONE_DAY_AGO);

    });

    return res.json({ history: priceHistory });

  });

});

/**
 * GET /api/search
 *
 * Required params
 *   - `name` Search query
 *
 * Optional params
 *   - `appID` Limit search scope to this appID
 *   - `limit` Limit the search results returned (Defaults to 10)
 */
router.get('/search', function (req, res, next) {

  /**
   * MongoDB search query
   * @type {Object}
   */
  var findQuery = {

    $text: { $search: req.param('name') }

  };

  if (req.param('appID'))
    findQuery.appID = req.param('appID');

  if (!req.param('name'))
    return res.status(400).json({ error: 'Missing name parameter' });

  else if (req.param('appID') && isNaN(req.param('appID')))
    return res.status(400).json({ error: 'Invalid appID' });

  else if (req.param('limit') && isNaN(req.param('limit')))
    return res.status(400).json({ error: 'Invalid limit parameter' });

  models.items.find(findQuery, { score: { $meta: 'textScore' }, _id: 0 })
              .limit(req.param('limit') || 10)
              .sort({ score: { $meta: 'textScore' }, timesSeen: -1 })
              .exec(function (err, results) {

                if (err)
                  return next(err);

                // Convert timestamps to UTC
                var JSONresults = results.map(function (result) {

                  var newResult = JSON.parse(JSON.stringify(result));

                  newResult.firstSeen = new Date(new Date(result.firstSeen).toUTCString()).getTime();

                  return newResult;

                });

                return res.json({ results: JSONresults });

              });

});

module.exports = router;
