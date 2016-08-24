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
    var preEnd = /\<\/pre\>$/i;

    var _defultCfg = {
        "type": "HTML5", //   HTML5、iframe
        "draggable": true, //   support drag & drop to upload, only support "HTML5" mode
        "uploadUrl": "/upload", //   server address
        "data": {}, //   custom data
        "timeout": -1, //   time
        "styleClass": [], //   customCss class
        "onStart": function() {},
        "onProgress": function() {},
        "onSuccess": function() {},
        "onError": function() {},
        "onTimeout": function() {}
    };

    function Uploader(el, opt) {
        return new Uploader.fn.init(el, opt);
    }

    Uploader.fn = Uploader.prototype = {

        "constructor": Uploader,

        "init": function(el, opt) {
            this.el = doc.querySelector(el);
            this.elSelector = el;
            this.cfg = _merge(_defultCfg, opt);
            switch (this.cfg.type) {
                case "HTML5":
                    this._HTML5Upload();
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
                tip = null,
                tipClass = "";

            //  处理自定义样式
            if (_self.cfg.styleClass) {
                _self.cfg.styleClass = _typeOf(_self.cfg.styleClass) === "Array" ? _self.cfg.styleClass : [_self.cfg.styleClass];
                _el.setAttribute("class", (_el.class || "") + " " + _self.cfg.styleClass.join(" "));
            }

            if (_self.cfg.tipClass) {
                _self.cfg.tipClass = _typeOf(_self.cfg.tipClass) === "Array" ? _self.cfg.tipClass : [_self.cfg.tipClass];
                tipClass = _self.cfg.tipClass.join(" ");
            }

            //  拖入上传框
            _el.ondragenter = function(ev) {
                tip = doc.createElement("p");
                tip.innerHTML = "松开鼠标即可上传";
                tip.setAttribute("class", tipClass);
                _self.el.appendChild(tip);
                ev.preventDefault();
                return false;
            };

            //  在上传框区域内不松开鼠标
            _el.ondragover = function(ev) {
                ev.preventDefault();
                return false;
            };

            //  物体离开上传框
            _el.ondragleave = function(ev) {
                if (tip) {
                    _self.el.removeChild(tip);
                    tip = null;
                }
                ev.preventDefault();
                return false;
            };

            //  鼠标松手
            _el.ondrop = function(ev) {
                var files = ev.dataTransfer.files,
                    file, xhr, form;
                if (tip) {
                    _self.el.removeChild(tip);
                    tip = null;
                }

                form = new FormData();

                //  拼接自定义数据
                if (_typeOf(_self.cfg.data) === "Object") {
                    for (var i in _self.cfg.data) {
                        form.append(i, _self.cfg.data[i]);
                    }
                }

                xhr = new XMLHttpRequest();
                xhr.open("POST", _self.cfg.uploadUrl, true);
                xhr.withCredentials = true;
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                //  开始上传
                if (_typeOf(_self.cfg.onStart) === "Function") {
                    _self.cfg.onStart();
                }

                for (var i = 0, len = files.length; i < len; i++) {
                    form.append("file" + i, files[i], files[i].name);
                }
                xhr.send(form);

                //  XMLHttpRequest的readyState为完成状态
                xhr.onreadystatechange = function() {
                    console.log("onreadystatechange");
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 && _typeOf(_self.cfg.onSuccess) === "Function") {
                            _self.cfg.onSuccess(JSON.parse(xhr.responseText));
                        } else if (_typeOf(_self.cfg.onError) === "Function") {
                            _self.cfg.onError(JSON.parse(xhr.responseText));
                        }
                    }
                };

                //  四个阶段
                xhr.onprogress = function(ev) {
                    console.log("onprogress");
                    if (_typeOf(_self.cfg.onProgress) === "Function") {
                        _self.cfg.onProgress(ev);
                    }
                };

                xhr.onload = function(ev) {
                    console.log("onload");
                    if (_typeOf(_self.cfg.onLoad) === "Function") {
                        _self.cfg.onLoad(ev);
                    }
                };

                ev.preventDefault();
                return false;
            };
        },

        //  iframe方式的上传
        "_iframeUpload": function() {
            var _self = this;
            var iframe, form, timeout, isOvertime, timeoutOver, res;

            form = _createForm(iframe, _self.el, _self.cfg.uploadUrl, _self.cfg.data, _self.cfg.styleClass);
            _self.el = form.querySelector(_self.elSelector);

            //  给文件选择框绑定change事件
            _self.el.onchange = function() {

                isOvertime = false;
                iframe = _createIframe();
                form.submit();

                //  开始上传
                if (_typeOf(_self.cfg.onStart)) {
                    _self.cfg.onStart();
                }

                //  指定了超时时间
                if (_self.cfg.timeout > 0) {
                    timeoutOver = setTimeout(function() {
                        clearTimeout(timeoutOver);
                        isOvertime = true;

                        if (_typeOf(_self.cfg.onTimeout) === "Function") {
                            _self.cfg.onTimeout();
                        }

                    }, _self.cfg.timeout);
                }

                //  后端响应成功回调
                iframe.onload = function() {

                    //  已经超时了,就不往下走
                    if (isOvertime) {
                        return;
                    }

                    clearTimeout(timeoutOver);
                    res = _parseToObject(_getFrameContent(iframe).responseText);
                    if (_typeOf(_self.cfg.onSuccess) === "Function") {
                        _self.cfg.onSuccess(res);
                    }

                    timeout = setTimeout(function() {
                        clearTimeout(timeout);
                        doc.body.removeChild(iframe);
                    }, 300);
                };

                //  后端响应失败回调
                iframe.onerror = function() {

                    //  已经超时了,就不往下走
                    if (isOvertime) {
                        return;
                    }

                    clearTimeout(timeoutOver);
                    res = _parseToObject(_getFrameContent(iframe).responseText);
                    if (_typeOf(_self.cfg.onSuccess) === "Function") {
                        _self.cfg.onError(res);
                    }

                    timeout = setTimeout(function() {
                        clearTimeout(timeout);
                        doc.body.removeChild(iframe);
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

    //  创建一个表单提交,把原来的file克隆过来,并且删除原来的
    function _createForm(frame, fileElement, url, data, cssClass) {
        var form = doc.createElement("form");
        var fragement = doc.createDocumentFragment();
        var parent = fileElement.parentNode;
        var fileFiled = fileElement.cloneNode(true);
        var dataFiled = null;

        parent.removeChild(fileElement);

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
                dataFiled.type = "hidden";
                fragement.appendChild(dataFiled);
            }
        }

        form.appendChild(fragement);
        parent.appendChild(form);

        if (cssClass) {
            cssClass = _typeOf(cssClass) === "Array" ? cssClass : [cssClass];
            parent.setAttribute("class", (parent.class || "") + " " + cssClass.join(" "));
        }

        return form;
    }

    //  获取iframe中的文本内容
    function _getFrameContent(iframe) {
        var res = {};
        try {
            if (iframe.contentWindow) {
                res.responseText = iframe.contentWindow.document.body ? iframe.contentWindow.document.body.innerHTML : null;
                res.responseXML = iframe.contentWindow.document.XMLDocument ? iframe.contentWindow.document.XMLDocument : iframe.contentWindow.document;

            } else if (iframe.contentDocument) {
                res.responseText = iframe.contentDocument.document.body ? iframe.contentDocument.document.body.innerHTML : null;
                res.responseXML = iframe.contentDocument.document.XMLDocument ? iframe.contentDocument.document.XMLDocument : iframe.contentDocument.document;
            }
        } catch (e) {
            throw e;
        }
        return res;
    }

    //  把iframe文本内容转换成JSON输出
    function _parseToObject(str) {
        var res;
        if (_typeOf(str) === "Null") {
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
        var res = _copy(obj1);
        for (var i in obj2) {
            res[i] = obj2[i];
        }
        return res;
    }

    //  深层拷贝对象,传递对象类型参数时解除引用
    function _copy(obj) {
        var _type = _typeOf(obj),
            _typeIn, res;
        if (_type !== "Array" && _type !== "Object") {
            return obj;
        } else {
            switch (_type) {
                case "Array":
                    res = [];
                    for(var i = 0, len = obj.length;i < len; i ++) {
                        _typeIn = _typeOf(obj[i]);
                        if(_typeIn === "Array" || _typeIn === "Object") {
                            _copy(obj[i]);
                        } else {
                            res.push(obj[i]);
                        }
                    }
                    break;

                case "Object":
                    res = {};
                    for(var i in obj) {
                        _typeIn = _typeOf(obj[i]);
                        if(_typeIn === "Array" || _typeIn === "Object") {
                            _copy(obj[i]);
                        } else {
                            res[i] = obj[i];
                        }
                    }
                    break;

                default:
                    break;
            }            
        }
        return res;
    }

    function _uId() {
        return Math.random().toString(16).slice(2);
    }

    return Uploader;

});
