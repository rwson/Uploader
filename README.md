### Uploader

HTML5和iframe上传插件

<img src="Upload.png" width="100px" height="100px" />

---  

- iframe(类Ajax)上传

参数:

名称 | 意义 | 类型
---|---|---
type | 上传方法 | String(固定"iframe")
uploadUrl | 服务器端用于处理上传请求的地址 | String
data | 自定义数据 | Object
timeout | 超时时间(毫秒,-1为不指定超时时间) | Number
cssClass | 控制样式的CSS类 | Array.&lt;String&gt;
onStart | 开始上传回调 | Function
onSuccess | 上传成功回调 | Function
onError | 上传失败回调 | Function
onTimeout | 上传超时回调 | Function

注:

1. data最后会被当成input\[type="hidden"\](key对应input的name属性,value对应input的值)提交,一旦data不为一个空对象,则需要后端来接收,否则没有意义

2. onTimeout和(onSuccess/onError)互斥,只能执行其中一个或两个

完整的调用例子:

HTML: 
    
    <div>
        <input type="file" name="file" id="Uploader" />
    </div>

JavaScript:

	Uploader("#Uploader", {
		"uploadUrl": "/upload/iframe",
		"type": "iframe",
		"data": {
			"key": "1",
			"key2": "1",
			"maxSize": 1000
		},
		"timeout": 3000,
		"cssClass": ["upload-style1", "upload-style2"],
		"onSuccess": function(res) {
			console.log(res);
			var img = new Image();
			img.src = res.url;
			img.onload = function() {
				document.body.appendChild(img);
			};
		},
		"onError": function(ex) {
			console.log(ex);
		},
		"onTimeout": function(){
			alert("超时啦!");
		}
	});

- HTML5(通过Ajax给后端POST表单数据,可一次性拖拽上传多个文件)上传

参数:

名称 | 意义 | 类型
---|---|---
type | 上传方法 | String(固定"HTML5")
uploadUrl | 服务器端用于处理上传请求的地址 | String
data | 自定义数据 | Object
timeout | 超时时间(毫秒,-1为不指定超时时间) | Number
cssClass | 控制上传框样式的CSS类 | Array.&lt;String&gt;
tipClass | 控制上传提示文字样式的CSS类 | Array.&lt;String&gt;
onStart | 开始上传回调 | Function
onProgress | 上传中回调 | Function
onSuccess | 上传成功回调 | Function
onError | 上传失败回调 | Function
onLoad | 完成回调 | Function

注:

1. data最后会被当成普通表单提交(key对应input的name属性,value对应input的值)提交,一旦data不为一个空对象,则需要后端来接收,否则没有意义
2.相关回调执行顺序:onStart -> onProgress -> onSuccess/onError -> onLoad

完整的调用例子:

HTML: 
    
    <div id="uploadHTML5"></div>

JavaScript:

	Uploader("#uploadHTML5", {
		"uploadUrl": "/upload/html5",
		"type": "HTML5",
		"data": {
			"test": "1111",
			"maxSize": 1000
		},
		"styleClass": ["upload-html5"],
		"tipClass": ["upload-tip"],
		"onSuccess": function(res) {
			res.files.forEach(function(item) {
				var img = document.createElement("img");
				img.src = item.url;
				document.body.appendChild(img);
			});
		},
		"onError": function(ex) {
			console.log(ex);
		},
		"onProgress": function(ev) {
			console.log(ev);
		},
		"onLoad": function(ev) {
			console.log(ev);	
		}
	});

本插件几乎不带内置CSS,可以通过配置项中的styleClass和tipClass传入具体的css类名,根据UI出的设计稿自行定义样式😄
