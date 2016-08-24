var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multipart = require("connect-multiparty");
var formidable = require("formidable");
var iframeFileUpload = require("iframe-file-upload-middleware");

var distPath = "upload";

var app = express();

iframeFileUpload.addRedirectResponder(app);

app.set('port', 3000);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/index', function(req, res, next) {
    res.render("index");
});

app.all("/upload/iframe", function(req, res, next) {
    var form = new formidable.IncomingForm(),
        extName = "",
        filePath = "",
        targetPath = "";
    form.encoding = "utf-8";
    form.keepExtensions = true;
    form.maxFieldsSize = 2 * 1024 * 1024;

    form.parse(req, function(err, fields, files) {
        if (err) {
            res.send(500, err);
        }

        var file = files.file;

        switch (file.type) {
            case "image/pjpeg":
            case "image/jpeg":
                //  jpg格式
                extName = "jpg";
                break;
            case "image/png":
            case "image/x-png":
                //  png格式
                extName = "png";
                break;
            default:
                res.send(400, {
                    "code": 400,
                    "msg": "上传失败!请检查文件类型!"
                });
                break;
        }

        if (!fs.existsSync(distPath)) {
            fs.mkdirSync(distPath);
        }

        //  目录不存在,手动创建上传目录
        filePath = file.path;
        targetPath = distPath + "/" + Date.now() + "." + extName;

        try {
            fs.renameSync(filePath, targetPath);
        } catch (e) {
            var inputStream = fs.createReadStream(filePath),
                outputStream = fs.createWriteStream(targetPath);
            inputStream.pipe(outputStream);
            inputStream.on("end", function() {
                fs.unlink(filePath);
            });
        }
        res.send(200, {
            "code": 200,
            "url": targetPath
        });
    });
});

app.all("/upload/html5", function(req, res, next) {
    var form = new formidable.IncomingForm(),
        extName = "",
        filePath = "",
        targetPath = "",
        files = [];
    form.encoding = "utf-8";
    form.keepExtensions = true;
    form.maxFieldsSize = 2 * 1024 * 1024;
    form.multiples = true;

    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
    }

    form.on("file", function(field, file) {
        targetPath = path.join(distPath, file.name);
        fs.rename(file.path, targetPath);
        files.push({
            url: targetPath
        });
    });

    form.on("error", function(err) {
        res.send(500, err);
    });

    form.parse(req, function(err, fields, files) {
        if (err) {
            res.send(500, err);
        }

        console.log(files);

    });

    form.on("end", function() {
        res.send(200, {
            "files": files
        });
    });

});

app.use(function(req, res, next) {
    try {
        res.sendfile(path.join(__dirname, req.path));
    } catch (ex) {
        var err = new Error('Not Found');
        console.log(req.path);
        err.status = 404;
        next(err);
    }
});

app.listen(app.get('port'), function() {
    console.log("🌐  start up at: http://localhost:" + app.get('port'));
});
