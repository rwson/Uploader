/**
 * Uploader
 * 支持多种形式的文件上传插件
 */

"use strict";

(function(root, factory) {

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return factory(root);
        });
    } else {
        root.Uploader = factory(root);
    }

})(window, function(root, undefined) {


    /***jQuery ajax start***/
    var _type2 = {};

    function type(obj) {
        return _type2.toString.call(obj).toLowerCase().split(" ")[1].replace("]", "");
    }

    var jsonpID = 0,
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/

    function ajax(options) {
        var settings = extend({}, options || {})
        for (key in ajax.settings)
            if (settings[key] === undefined) settings[key] = ajax.settings[key]

        ajaxStart(settings)

        if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
            RegExp.$2 != window.location.host

        var dataType = settings.dataType,
            hasPlaceholder = /=\?/.test(settings.url)
        if (dataType == 'jsonp' || hasPlaceholder) {
            if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
            return ajax.JSONP(settings)
        }

        if (!settings.url) settings.url = window.location.toString()
        serializeData(settings)

        var mime = settings.accepts[dataType],
            baseHeaders = {},
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = ajax.settings.xhr(),
            abortTimeout

        if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
        if (mime) {
            baseHeaders['Accept'] = mime
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
        }
        if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))
            baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
        settings.headers = extend(baseHeaders, settings.headers || {})

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                clearTimeout(abortTimeout)
                var result, error = false
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
                    result = xhr.responseText

                    try {
                        if (dataType == 'script')(1, eval)(result)
                        else if (dataType == 'xml') result = xhr.responseXML
                        else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)
                    } catch (e) {
                        error = e
                    }

                    if (error) ajaxError(error, 'parsererror', xhr, settings)
                    else ajaxSuccess(result, xhr, settings)
                } else {
                    ajaxError(null, 'error', xhr, settings)
                }
            }
        }

        var async = 'async' in settings ? settings.async : true
        xhr.open(settings.type, settings.url, async)

        for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort()
            return false
        }

        if (settings.timeout > 0) abortTimeout = setTimeout(function() {
            xhr.onreadystatechange = empty
            xhr.abort()
            ajaxError(null, 'timeout', xhr, settings)
        }, settings.timeout)

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null)
        return xhr
    }


    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
        //todo: Fire off some events
        //var event = $.EVENT(eventName)
        //$(context).trigger(event, data)
        return true; //!event.defaultPrevented
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    ajax.active = 0

    function ajaxStart(settings) {
        if (settings.global && ajax.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }

    function ajaxStop(settings) {
        if (settings.global && !(--ajax.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context
        if (settings.beforeSend.call(context, xhr, settings) === false ||
            triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
            return false

        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }

    function ajaxSuccess(data, xhr, settings) {
        var context = settings.context,
            status = 'success'
        settings.success.call(context, data, status, xhr)
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
        ajaxComplete(status, xhr, settings)
    }

    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings) {
        var context = settings.context
        settings.error.call(context, xhr, type, error)
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
        ajaxComplete(type, xhr, settings)
    }

    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context
        settings.complete.call(context, xhr, status)
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
        ajaxStop(settings)
    }

    // Empty function, used as default callback
    function empty() {}

    ajax.JSONP = function(options) {
        if (!('type' in options)) return ajax(options)

        var callbackName = 'jsonp' + (++jsonpID),
            script = document.createElement('script'),
            abort = function() {
                //todo: remove script
                //$(script).remove()
                if (callbackName in window) window[callbackName] = empty
                ajaxComplete('abort', xhr, options)
            },
            xhr = { abort: abort },
            abortTimeout,
            head = document.getElementsByTagName("head")[0] || document.documentElement

        if (options.error) script.onerror = function() {
            xhr.abort()
            options.error()
        }

        window[callbackName] = function(data) {
            clearTimeout(abortTimeout)
                //todo: remove script
                //$(script).remove()
            delete window[callbackName]
            ajaxSuccess(data, xhr, options)
        }

        serializeData(options)
        script.src = options.url.replace(/=\?/, '=' + callbackName)

        // Use insertBefore instead of appendChild to circumvent an IE6 bug.
        // This arises when a base node is used (see jQuery bugs #2709 and #4378).
        head.insertBefore(script, head.firstChild);

        if (options.timeout > 0) abortTimeout = setTimeout(function() {
            xhr.abort()
            ajaxComplete('timeout', xhr, options)
        }, options.timeout)

        return xhr
    }

    ajax.settings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        beforeSend: empty,
        // Callback that is executed if the request succeeds
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function() {
            return new window.XMLHttpRequest()
        },
        // MIME types mapping
        accepts: {
            script: 'text/javascript, application/javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 0
    }

    function mimeToDataType(mime) {
        return mime && (mime == htmlType ? 'html' :
            mime == jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text'
    }

    function appendQuery(url, query) {
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
        if (type(options.data) === 'object') options.data = param(options.data)
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
            options.url = appendQuery(options.url, options.data)
    }

    ajax.get = function(url, success) {
        return ajax({ url: url, success: success })
    }

    ajax.post = function(url, data, success, dataType) {
        if (type(data) === 'function') dataType = dataType || success, success = data, data = null
        return ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })
    }

    ajax.getJSON = function(url, success) {
        return ajax({ url: url, success: success, dataType: 'json' })
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope) {
        var array = type(obj) === 'array';
        for (var key in obj) {
            var value = obj[key];

            if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
                // handle data in serializeArray() format
            if (!scope && array) params.add(value.name, value.value)
                // recurse into nested objects
            else if (traditional ? (type(value) === 'array') : (type(value) === 'object'))
                serialize(params, value, traditional, key)
            else params.add(key, value)
        }
    }

    function param(obj, traditional) {
        var params = []
        params.add = function(k, v) {
            this.push(escape(k) + '=' + escape(v))
        }
        serialize(params, obj, traditional)
        return params.join('&').replace('%20', '+')
    }

    function extend(target) {
        var slice = Array.prototype.slice;
        slice.call(arguments, 1).forEach(function(source) {
            for (key in source)
                if (source[key] !== undefined)
                    target[key] = source[key]
        });
        return target
    }

    /***jQuery ajax end****/


    var _defultCfg = {
        "type": "HTML5", // HTML5、ajax/iframe、form
        "draggable": true, //   support drag & drop to upload, only support "HTML5" mode
        "uploadUrl": "/upload",
        "before": function() {},
        "onStart": function() {},
        "onProgress": function() {},
        "onEnd": function() {},
        "onAboard": function() {}
    };

    var doc = document;

    function _merge(obj1, obj2) {
        for (var i in obj2) {
            obj1[i] = obj2[i];
        }
        return obj1;
    }

    function Uploader(el, opt) {
        return new Uploader.fn.init(el, opt);
    }

    Uploader.fn = Uploader.prototype = {

        "constructor": Uploader,

        "init": function(el, opt) {

            this.el = doc.querySelector(el);
            this.cfg = _merge(_defultCfg, opt);

            switch (this.cfg.type) {
                case "HTML5":
                    this._HTML5Upload();
                    break;

                case "form":
                    this._FormUpluad();
                    break;

                case "ajax":
                    this._AjaxUpload();
                    break;

                case "iframe":
                    this._iframeUpload();
                    break;

                default:
                    throw new Error("please pass in the correct type argument!");
                    break;
            }
        },

        "_HTML5Upload": function() {
            var _self = this,
                _el = _self.el,
                tip;

            _el.classList.add("upload-html5");

            //  拖入上传框
            _el.ondragenter = function(ev) {
                tip = doc.createElement("p");
                tip.classList.add("upload-html5-tip");
                tip.innerHTML = "松开鼠标即可上传";
                _self.el.appendChild(tip);
                ev.preventDefault();
                return false;
            };

            //  在上传框区域内不松开鼠标
            _el.ondragover = function(ev) {
                ev.preventDefault();
            }

            //  物体离开上传框
            _el.ondragleave = function(ev) {
                if (tip) {
                    _self.el.removeChild(tip);
                }
                ev.preventDefault();
                return false;
            };

            //  鼠标松手
            _el.ondrop = function(ev) {
                ev = ev || event;
                var files = ev.dataTransfer.files,
                    fRead;
                if (tip) {
                    _self.el.removeChild(tip);
                }
                for (var i = 0, len = files.length; i < len; i++) {
                    if (files[i].type) {
                        fRead = new FileReader();
                        fRead.readAsDataURL(files[i]);
                        fRead.onload = function() {
                            ajax({
                                "url": _self.cfg.uploadUrl,
                                "type": "POST",
                                "data": this.result,
                                "context": _self,
                                "beforeSend": function(){}
                            });
                        };
                    }
                }
                ev.preventDefault();
                return false;
            };
        },

        "_FormUpluad": function() {},

        "_AjaxUpload": function() {},

        "_iframeUpload": function() {}

    };

    Uploader.fn.init.prototype = Uploader.fn;

    return Uploader;

});
