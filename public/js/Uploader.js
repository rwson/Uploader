/**
 * Uploader
 * 支持多种形式的文件上传插件
 * author  rwson
 * site    http://rwson.github.io
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

    var _type2 = {};
    var doc = document;

    //  替换iframe中的<pre ...></pre>标签
    var preStart = /^\<pre.*?\>/i;
    var preEnd =  /\<\/pre\>$/i;

    var _defultCfg = {
        "type": "HTML5", // HTML5、ajax/iframe、form
        "draggable": true, //   support drag & drop to upload, only support "HTML5" mode
        "uploadUrl": "/upload",
        "data": {},
        "onStart": function() {},
        "onProgress": function() {},
        "onSuccess": function() {},
        "onAboard": function() {}
    };

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
                                "beforeSend": function() {}
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

        //  iframe方式的上传
        "_iframeUpload": function() {
            var _self = this;
            var iframe, form, timeout, res;

            //  给文件选择框绑定change事件
            _self.el.onchange = function() {
                iframe = _createIframe();
                form = _createForm(iframe, _self.el, _self.cfg.uploadUrl, _self.cfg.data);
                form.submit();

                //  后端响应成功回调
                iframe.onload = function() {
                    
                    res = _parseToObject(_getFrameContent(iframe).responseText);
                    if (_typeOf(_self.cfg.onSuccess) === "Function") {
                        _self.cfg.onSuccess(res);
                    }

                    timeout = setTimeout(function() {
                        clearTimeout(timeout);
                        doc.body.removeChild(iframe);
                        doc.body.removeChild(form);
                    }, 300);
                };

                //  后端响应失败回调
                iframe.onerror = function() {

                    res = _parseToObject(_getFrameContent(iframe).responseText);
                    if (_typeOf(_self.cfg.onSuccess) === "Function") {
                        _self.cfg.onError(res);
                    }
                    
                    timeout = setTimeout(function() {
                        clearTimeout(timeout);
                        doc.body.removeChild(iframe);
                        doc.body.removeChild(form);
                    }, 300);
                };
            };
        }

    };

    Uploader.fn.init.prototype = Uploader.fn;

    //  创建隐藏iframe,设置name属性然后将隐藏表单的target设置成该iframe的name(提交隐藏表单时刷新iframe)
    function _createIframe() {
        var iframe = doc.createElement("iframe");
        iframe.name = "uploadIframe";
        iframe.style.cssText = "width: 0;height: 0; opacity: 0; position: absolute; z-index: -1;left: -999em; top: -999em;"
        doc.body.appendChild(iframe);
        return iframe;
    }

    //  创建一个隐藏表单提交
    function _createForm(frame, fileElement, url, data) {
        var form = doc.createElement("form");
        var fragement = doc.createDocumentFragment();
        var fileFiled = fileElement.cloneNode(true);
        var dataFiled = null;

        fragement.appendChild(fileFiled);
        form.target = "uploadIframe";
        form.enctype = "multipart/form-data";
        form.method = "POST";
        form.action = url;

        if (_typeOf(data) === "Object") {
            for (var i in data) {
                dataFiled = doc.createElement("input");
                dataFiled.name = i;
                dataFiled.value = data[i];
                fragement.appendChild(dataFiled);
            }
        }

        form.style.cssText = "width: 0;height: 0; opacity: 0; position: absolute; z-index: -1;left: -999em; top: -999em;"

        form.appendChild(fragement);
        doc.body.appendChild(form);
        return form;
    }

    //  获取iframe中的内容文本内容
    function _getFrameContent(iframe) {
        var xml = {};
        try {
            if (iframe.contentWindow) {
                xml.responseText =iframe.contentWindow.document.body ?iframe.contentWindow.document.body.innerHTML : null;
                xml.responseXML =iframe.contentWindow.document.XMLDocument ?iframe.contentWindow.document.XMLDocument :iframe.contentWindow.document;

            } else if (iframe.contentDocument) {
                xml.responseText =iframe.contentDocument.document.body ?iframe.contentDocument.document.body.innerHTML : null;
                xml.responseXML =iframe.contentDocument.document.XMLDocument ?iframe.contentDocument.document.XMLDocument :iframe.contentDocument.document;
            }
        } catch (e) {
            throw e;
        }
        return xml;
    }

    //  把iframe文本内容转换成JSON输出
    function _parseToObject(str) {
        var res;
        if(_typeOf(str) === "Null") {
            res = {};
        } else {
            res = JSON.parse(str.replace(preStart, "").replace(preEnd, ""));
        }
        return res;
    }

    function _typeOf(obj) {
        return _type2.toString.call(obj).slice(8, -1);
    }

    function _merge(obj1, obj2) {
        for (var i in obj2) {
            obj1[i] = obj2[i];
        }
        return obj1;
    }

    function _uId() {
        return Math.random().toString(16).slice(2);
    }

    return Uploader;

});
