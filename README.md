### Uploader

HTML5和iframe上传插件

<img src="Upload.png" width="100px" height="100px" />

---  

- iframe(类Ajax)上传

支持的所有参数:


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

- HTML5上传

#### developing
