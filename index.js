'use strict';

/**
 * @author George Borisov <git@gir.me.uk>
 * @copyright George Borisov 2018
 * @license LGPL-3.0
 */

exports.App = require('./lib/App.js');

exports.middleware = {
    body: function () {
        return require('./lib/body-middleware.js');
    },

    query: function () {
        return require('./lib/query-middleware.js');
    },
};
