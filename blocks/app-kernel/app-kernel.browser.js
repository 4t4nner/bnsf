/**@module app-kernel*/
modules.define('app-kernel', [
    'i-bem__dom', 'app-api-requester', 'app-navigation', 'jquery'
], function (provide, BEMDOM, apiRequester, navigation, $, appKernelDecl) {
    "use strict";

    /**
     * @class AppKernel
     * @extends BEMDOM
     * @exports
     */
    provide(BEMDOM.decl(this.name, appKernelDecl).decl(/**@lends AppKernel.prototype*/{

        onSetMod: {
            js: {
                /**
                 * @constructs
                 */
                inited: function () {
                    this.__base();
                    this._cacheCurrentPage(this.params.currentPage);
                }
            }
        },

        /**
         * @param {RequestData} data
         * @returns {RequestData}
         * @protected
         */
        _fillRequestData: function (data) {
            data = this.__base(data);
            data.apiRequester = apiRequester;
            return data;
        },

        /**
         * @param {number} statusCode
         * @param {RequestData} data
         * @returns {boolean} isHandled
         * @protected
         */
        _handleWrongStatusError: function (statusCode, data) {
            switch (statusCode) {
                case 0:
                    // ignore aborted queries
                    return true;
                default:
                    return this.__base(statusCode, data);
            }
        },

        /**
         * @param {String} pageName
         * @private
         */
        _cacheCurrentPage: function (pageName) {
            /**
             * @type {BEMDOM}
             * @private
             */
            this._currentPage = this.findBlockInside(pageName);
            /**
             * @type {String}
             * @private
             */
            this._currentPageName = pageName;
        },

        /**
         * @param {String} page
         * @returns {boolean}
         * @private
         */
        _isPartialUpdateAvailable: function (page) {
            return this._currentPageName === page;
        },

        /**
         * @param {String} page
         * @param {RequestData} data
         * @returns {vow:Promise}
         * @protected
         */
        _processPage: function (page, data) {
            //abort all app requests on page change
            apiRequester.abort();
            var updatePromise;
            if (this._isPartialUpdateAvailable(page) && (updatePromise = this._currentPage.update(data))) {
                return this._postProcessPage(updatePromise, data);
            } else {
                this._leaveCurrentPage();
                return this.__base(page, data);
            }
        },

        /**
         * @protected
         */
        _leaveCurrentPage: function () {
            this._currentPage.leave();
        },

        /**
         * @param {Function} Page
         * @param {RequestData} data
         * @returns {Object}
         * @protected
         */
        _getBEMJSON: function (Page, data) {
            return [
                this._getTitleBEMJSON(Page),
                this._getPageContentBEMJSON(Page, data)
            ];
        },

        /**
         * @param {Function} Page
         * @returns {object}
         * @protected
         */
        _getTitleBEMJSON: function (Page) {
            var bemjson = this.__base(Page);
            bemjson.tag = 'title';
            return bemjson;
        },

        /**
         * @param {RequestData} data
         * @protected
         */
        _onPageProcessSuccess: function (data) {
            navigation.navigate(data);
        },

        /**
         * @param {String} html
         * @param {RequestData} data
         * @param {Function} Page
         * @protected
         */
        _writeResponse: function (html, data, Page) {
            var $html = $(html);
            BEMDOM.replace(this._currentPage.domElem, $html[1]);
            this._cacheCurrentPage(Page.getName());
            document.title = $html.eq(0).text();
        },

        /**
         * @param {String} url
         * @param {RequestData} data
         * @protected
         */
        _redirect: function (url, data) {
            this._currentPage.leave();
            window.location = url;
        }
    }));
});
