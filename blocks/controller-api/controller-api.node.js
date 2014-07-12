/**@module controller-api*/
modules.define('controller-api', [
    'i-controller', 'app-api-requester', 'vow'
], function (provide, IController, appApiRequester, Vow) {
    "use strict";

    /**
     * @class ControllerApi
     * @extends IController
     */
    provide(IController.decl(/**@lends ControllerApi.prototype*/{

        /**
         * @param {Object} data
         */
        processRequest: function (data) {
            var method = data.request.method,
                routeParameters = data.route.parameters,
                bodies = (data.request.body ? data.request.body.bodies : []) || [],
                routes = routeParameters['r[]'],
                routesParameters = routeParameters['rP[]'] || [],
                response = data.response;

            if (!routes) {
                response.end(JSON.stringify({
                    error: 'no requests'
                }));
                return;
            }

            routes = Array.isArray(routes) ? routes : [routes];
            routesParameters = Array.isArray(routesParameters) ? routesParameters : [routesParameters];

            var promises = [],
                parameters,
                body;
            try {
                for (var i = 0, l = routes.length; i < l; i++) {
                    parameters = JSON.parse(routesParameters[i]);
                    body = bodies[i] === 'null' ? undefined : bodies[i];
                    promises.push(appApiRequester.sendRequest(method, routes[i], parameters, body));
                }
            } catch (e) {
                response.end(JSON.stringify({
                    error: e.message
                }));
                return;
            }

            Vow.allResolved(promises).then(function (promises) {
                response.end(JSON.stringify(promises.map(function (promise) {
                    return promise.valueOf();
                })));
            });
        }
    }, {

        _route: 'api'

    }));
});
