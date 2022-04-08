(function () {

    // If the browser supports Do Not Track, we respect the request and disable our campaign tracking.
    if (window.doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack || 'msTrackingProtectionEnabled' in window.external) {
        if (window.doNotTrack == "1" || navigator.doNotTrack == "yes" || navigator.doNotTrack == "1" || navigator.msDoNotTrack == "1" || (window.external && window.external.msTrackingProtectionEnabled)) {
            console.log("Campaign tracking features have been disabled.");
            return;
        }
    }

    // Application instance settings
    var settings = {
        cookieNameFirstTouchPrefix: "__ft_",
        cookieNamePrefix: "__lt_",
        utmParams: [
            "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_adgroup",
            "int_medium", "int_source", "int_campaign", "int_adgroup", "int_content"
        ],
        cookieExpiryDays: 30,
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
         * Tests whether UTM values are present in the URL.
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
         * Tests whether there is a refering page or not.
         */
        isReferrer: function() {
            var value = document.referrer;
            var key = "referrer";
            if (value && value !== "" && value !== undefined && value.indexOf(document.location.host) === -1) {
                return true;
            } else {
                return false;
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

    // Detect and update UTM tracking codes
    base.storeParamsInCookies();

    // Referrer override - Yes referer (except when referer !== current domain) & No UTM in URL = Delete all
    // non-referrer UTM cookie values
    if (base.isReferrer() && base.utmPresentInUrl()) {
        if (document.referrer.replace(/(^\w+:|^)\/\//, '') !== 'www'+window.location.hostname) {
            settings.utmParams.forEach(function(param) {
                cookies.erase(param)
            })
        }
    }

    // Referrer override - No referer & No UTM in URL = Update last touch referrer cookie value as "direct"
    if (!base.isReferrer() && !base.utmPresentInUrl()) {
        cookies.writeCookieOnce("referrer", "direct");
    }

    // Override and hold from paid mediums. Override paid mediums with newest paid medium's values.
    var url_medium = base.getParameterByName("utm_medium")
    if (
        url_medium === 'cpc' ||
        url_medium === 'psm' ||
        url_medium === 'web' ||
        url_medium === 'csy' ||
        url_medium === 'dml' ||
        url_medium === 'rdk'
    ) {
        cookies.writeCookieOnce("utm_medium", url_medium);
        cookies.writeCookieOnce("utm_source", base.getParameterByName("utm_source"));
        cookies.writeCookieOnce("utm_campaign", base.getParameterByName("utm_campaign"));
        cookies.writeCookieOnce("utm_term", base.getParameterByName("utm_term"));
        cookies.writeCookieOnce("utm_content", base.getParameterByName("utm_content"));
        cookies.writeCookieOnce("utm_adgroup", base.getParameterByName("utm_adgroup"));
    }

    // Quick function for erasing all Internal Tracking codes
    var eraseInternalTrackingCookies = function() {
        cookies.writeCookieOnce("int_medium", "");
        cookies.writeCookieOnce("int_source", "");
        cookies.writeCookieOnce("int_campaign", "");
        cookies.writeCookieOnce("int_content", "");
        cookies.writeCookieOnce("int_adgroup", "");
    };

    // If an internal tracking link has a cookie value and a new url parameter value is different, erase all
    // internal tracking cookies, resetting them with new values to avoid mismatched tracking values.
    // Look to update internal tracking cookies every script load
    if (base.getParameterByName("int_medium")) {
        if (base.getParameterByName("int_medium") !== cookies.read("__lt_int_medium")) {
            eraseInternalTrackingCookies();
        }
    }
    if (base.getParameterByName("int_source")) {
        if (base.getParameterByName("int_source") !== cookies.read("__lt_int_source")) {
            eraseInternalTrackingCookies();
        }
    }
    if (base.getParameterByName("int_campaign")) {
        if (base.getParameterByName("int_campaign") !== cookies.read("__lt_int_campaign")) {
            eraseInternalTrackingCookies();
        }
    }
    if (base.getParameterByName("int_content")) {
        if (base.getParameterByName("int_content") !== cookies.read("__lt_int_content")) {
            eraseInternalTrackingCookies();
        }
    }
    if (base.getParameterByName("int_adgroup")) {
        if (base.getParameterByName("int_adgroup") !== cookies.read("__lt_int_adgroup")) {
            eraseInternalTrackingCookies();
        }
    }

    // Look to update internal tracking cookies every script load
    if (base.getParameterByName("int_medium")) {
        cookies.writeCookieOnce("int_medium", base.getParameterByName("int_medium"));
    }
    if (base.getParameterByName("int_source")) {
        cookies.writeCookieOnce("int_source", base.getParameterByName("int_source"));
    }
    if (base.getParameterByName("int_campaign")) {
        cookies.writeCookieOnce("int_campaign", base.getParameterByName("int_campaign"));
    }
    if (base.getParameterByName("int_adgroup")) {
        cookies.writeCookieOnce("int_adgroup", base.getParameterByName("int_adgroup"));
    }
    if (base.getParameterByName("int_content")) {
        cookies.writeCookieOnce("int_content", base.getParameterByName("int_content"));
    }

    // Clear out undefined value with an empty string when reading cookies
    var cleanUndefinedValue = function(value) {
        return value === undefined ? "" : value;
    }

    // Function that sets value in forms
    var addValuesToFormsFromCookie = function() {
        // Store UTM tracking codes into hidden fields when available
        var utm_medium_elm = document.getElementsByName("utm_medium");
        var utm_content_elm = document.getElementsByName("utm_content");
        var utm_adgroup_elm = document.getElementsByName("utm_adgroup");
        var utm_term_elm = document.getElementsByName("utm_term");
        var utm_source_elm = document.getElementsByName("utm_source");
        var utm_campaign_elm = document.getElementsByName("utm_campaign");
        var utm_referrer_elm = document.getElementsByName("utm_referrer");
        if (utm_medium_elm.length) {
            utm_medium_elm[0].value = cleanUndefinedValue(cookies.read("__lt_utm_medium"));
        }
        if (utm_content_elm.length) {
            utm_content_elm[0].value = cleanUndefinedValue(cookies.read("__lt_utm_content"));
        }
        if (utm_adgroup_elm.length) {
            utm_adgroup_elm[0].value = cleanUndefinedValue(cookies.read("__lt_utm_adgroup"));
        }
        if (utm_term_elm.length) {
            utm_term_elm[0].value = cleanUndefinedValue(cookies.read("__lt_utm_term"));
        }
        if (utm_source_elm.length) {
            utm_source_elm[0].value = cleanUndefinedValue(cookies.read("__lt_utm_source"));
        }
        if (utm_campaign_elm.length) {
            utm_campaign_elm[0].value = cleanUndefinedValue(cookies.read("__lt_utm_campaign"));
        }
        if (utm_referrer_elm.length) {
            utm_referrer_elm[0].value = cleanUndefinedValue(cookies.read("__lt_referrer"));
        }

        // Store Internal tracking codes into hidden fields when available
        var int_medium_elm = document.getElementsByName("int_medium__c");
        var int_source_elm = document.getElementsByName("int_source__c");
        var int_campaign_elm = document.getElementsByName("int_campaign__c");
        var int_adgroup_elm = document.getElementsByName("int_adgroup__c");
        var int_content_elm = document.getElementsByName("int_content__c");
        if (int_medium_elm.length) {
            int_medium_elm[0].value = cleanUndefinedValue(cookies.read("__lt_int_medium"));
        }
        if (int_source_elm.length) {
            int_source_elm[0].value = cleanUndefinedValue(cookies.read("__lt_int_source"));
        }
        if (int_campaign_elm.length) {
            int_campaign_elm[0].value = cleanUndefinedValue(cookies.read("__lt_int_campaign"));
        }
        if (int_adgroup_elm.length) {
            int_adgroup_elm[0].value = cleanUndefinedValue(cookies.read("__lt_int_adgroup"));
        }
        if (int_content_elm.length) {
            int_content_elm[0].value = cleanUndefinedValue(cookies.read("__lt_int_content"));
        }
    }

    // Function to read values from cookies and add them to forms
    var addValuesToMarketoFormsFromCookie = function() {
        if (typeof MktoForms2 != "undefined") {
            MktoForms2.whenReady(function(form) {
                addValuesToFormsFromCookie();
            })
        }
    }

    // Attempt to set values initially on script run
    if (document.location.host !== '127.0.0.1:8080') {
        addValuesToMarketoFormsFromCookie() ;
    } else {
        addValuesToFormsFromCookie();
    }

    // Update hidden field's values after they are loaded
    var intervalCount = 0
    var intervalRunner = setInterval(function() {
        if (document.location.host !== '127.0.0.1:8080') {
            addValuesToMarketoFormsFromCookie() ;
        } else {
            addValuesToFormsFromCookie();
        }
        if (intervalCount >= 30) {
            clearInterval(intervalRunner);
        }
        intervalCount += 1;
    }, 250);

})();