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

    form: function () {
        return require('./lib/form-middleware.js');
    },

    json: function () {
        return require('./lib/json-middleware.js');
    },

    query: function () {
        return require('./lib/query-middleware.js');
    },

    static: function (opts) {
        return require('./lib/static-middleware.js')(opts);
    },
};
