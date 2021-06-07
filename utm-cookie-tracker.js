(function () {

    // The browser supports Do Not Track!
    if (window.doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack || 'msTrackingProtectionEnabled' in window.external) {
        if (window.doNotTrack == "1" || navigator.doNotTrack == "yes" || navigator.doNotTrack == "1" || navigator.msDoNotTrack == "1" || (window.external && window.external.msTrackingProtectionEnabled)) {
            console.log("Do not track is on");
            return;
        }
    }

    // Application instance settings
    var settings = {
        cookieNameFirstTouchPrefix: "__ft_",
        cookieNamePrefix: "__lt_",
        utmParams: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],
        cookieExpiryDays: 180,
        isFirstTouch: null
    }

    // Utility methods
    var utils = {

        /**
         * Returns the current domain name of the host.
         * @returns {string}
         */
        topDomain: function () {
            var
                i,
                h,
                top_level_cookie = 'top_level_domain=cookie',
                hostname = document.location.hostname.split('.');
            for (i = hostname.length - 1; i >= 0; i--) {
                h = hostname.slice(i).join('.');
                document.cookie = top_level_cookie + ';domain=.' + h + ';';
                if (document.cookie.indexOf(top_level_cookie) > -1) {
                    document.cookie = top_level_cookie.split('=')[0] + '=;domain=.' + h + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    return h;
                }
            }
            return document.location.hostname;
        },

        /**
         * Check whether or not users first point of access.
         * @returns {boolean}
         */
        isFirstTouch: function () {
            if (settings.isFirstTouch != null) return settings.isFirstTouch;
            else {
                var f = document.cookie.indexOf(settings.cookieNameFirstTouchPrefix) === -1;
                console.log("first touch: " + f);
                settings.isFirstTouch = f;
                return f;
            }

        },

        /**
         * Checks wether or not we're creating a new tracking session.
         * @returns {boolean}
         */
        isNewSession: function () {
            var c = "__utm_tracking_session";
            var r = cookies.read(c) === undefined;
            cookies.create(c, true, 1 / 48);
            return r;
        }
    };

    // Cookie methods
    var cookies = {

        /**
         * Creates a cookie with an expiration date.
         * @param name
         * @param value
         * @param days
         */
        create: function (name, value, days) {
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = "; expires=" + date.toGMTString();
            } else
                var expires = "";

            var c = name + "=" + value + expires + ";domain=." + utils.topDomain() + ";  path=/";
            document.cookie = c;
        },

        /**
         * Read the value from a cookie.
         * @param name
         * @returns {string}
         */
        read: function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ')
                    c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0)
                    return c.substring(nameEQ.length, c.length);
            }
        },

        /**
         * Erases a cookies value.
         * @param name
         */
        erase: function (name) {
            this.createCookie(name, "", -1);
        },

        /**
         * Create the cookie with its values only if it's not already created.
         * @param name
         * @param value
         */
        writeCookieOnce: function (name, value) {
            if (utils.isFirstTouch()) {
                this.create(settings.cookieNameFirstTouchPrefix + name, value, settings.cookieExpiryDays);

            }
            this.create(settings.cookieNamePrefix + name,
                value,
                settings.cookieExpiryDays);
        },
    }

    //  Core methods
    var base = {

        /**
         * Returns the value of a URL parameter.
         * @param name
         * @returns {string}
         */
        getParameterByName: function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.search);
            if (results == null) {
                return "";
            } else {
                return decodeURIComponent(results[1].replace(/\+/g, " "));
            }
        },

        /**
         * Tests whether or not a UTM value is present.
         * @returns {boolean}
         */
        utmPresentInUrl: function () {
            for (var i = 0; i < settings.utmParams.length; i++) {
                var param = settings.utmParams[i];
                var value = this.getParameterByName(param);
                if (value !== "" && value !== undefined) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Parse the UTM params and write them to the cookie.
         */
        writeUtmCookieFromParams: function () {
            if (this.utmPresentInUrl()) {
                for (var i = 0; i < settings.utmParams.length; i++) {
                    var param = settings.utmParams[i];
                    var value = this.getParameterByName(param);
                    cookies.writeCookieOnce(param, value);
                }
            }
        },

        /**
         * Create/write the referrer cookie.
         */
        writeReferrer: function () {
            var value = document.referrer;
            var key = "referrer";
            if (value && value !== "" && value !== undefined && value.indexOf(document.location.host) === -1) {
                console.log(value);
                cookies.writeCookieOnce(key, value);
            } else {
                cookies.writeCookieOnce(key, "direct");
            }
        },

        /**
         * Create/write cookies when needed.
         */
        storeParamsInCookies: function () {
            if (utils.isNewSession()) {
                this.writeUtmCookieFromParams();
                this.writeReferrer();
            }
        }
    };


    /**
     * ***
     * *** Application Logic - Meat & Potatoes
     * ***
     */
    base.storeParamsInCookies();
})();