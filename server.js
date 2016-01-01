var express = require('express');
var app = express();
var fs = require("fs");
var Canvas = require('canvas')
  //, Image = Canvas.Image
  , canvas = new Canvas(1000,900)
  , ctx = canvas.getContext('2d');
var mongoose = require('mongoose');
mongoose.connect('localhost/nine');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var Pixel = require("./pixel.js");
var request = require("request");



function receiveBitcoinPayment(callback) {
    var secret = 'Free energy';
    var my_address = '19RrYDX6tXJ948DpUGvs7H38UmcjxnhUWB';
    var invoice_id = new Date().getTime();
    var host = 'http://mystore.com/payment';
    var my_callback_url = host + '?invoice_id=' + invoice_id + '&secret=' + secret;
    var root_url = 'https://blockchain.info/api/receive';
    var parameters = 'method=create&address=' + my_address + '&callback=' + my_callback_url;
    var url = root_url + '?' + parameters;
    console.log(url);
    request.get(url, function(err, response) {
        var obj = JSON.parse(response.body);
        console.log(obj.destination);
        callback(obj.destination);
    });
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 25; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var pixelPrice = 0.001;

function drawPixelOnImage(pixel) {
    fs.readFile(__dirname + '/public/canvas.png', function(err, squid){
      if (err) throw err;
        var img = new Image();
        img.src = squid;
        ctx.drawImage(img, pixel.x, pixel.y, pixel.width, pixel.height);
        var out = fs.createWriteStream(__dirname + '/public/canvas.png')
        var stream = canvas.pngStream();

        stream.on('data', function(chunk){
          out.write(chunk);
        });
        
        stream.on('end', function(){
          console.log('saved png');
        });
      
    });
}

app.get('/payment', function(req, res) {
    console.log(req.query);
	if (req.query.confirmations < 1) {
		console.log('not enough confirmations!');
		res.end('*not ok*');
	}

    if (req.query.secret == "Free energy") {
        Pixel.findOne({ issue_date: req.query.invoice_id }, function (err, pixel) {
            console.log(err);
            console.log(pixel);
            if (req.query.amount >= pixel.width*pixel.height*pixelPrice) {
                drawPixelOnImage(pixel);
            	res.end('*ok*');
            } else {
                console.log('Donation was too small');
                res.end('*not ok*');
            }
        });
    } else {
        console.log('Wrong secret');
    }
});

app.post('/upload', multipartMiddleware, function(req, res) {
    fs.readFile(req.files.image.path, function (err, data) {
        // ...
        var newPath = __dirname + "/upload/"+makeid();
        if (req.body.url.substring(0, 4) != "http") {
            res.end('<font color="red">Error, invalid url, please include http:// or https://</font>');
        }
        var savedata = {
            'url': req.body.secret,
            'image_data': data,
            'paid': false,
            'width': req.body.width,
            'height': req.body.height,
            'x': req.body.x,
            'y': req.body.y,
            'secret': req.body.secret,
            'issue_date': Date.now()
        };
        var px = new Pixel(savedata);

        // calculate price
        var price = req.body.width * req.body.height * pixelPrice;
        price = Math.round(price * 1000) / 1000;
        if (isNaN(price) || price === 0) {
            res.end('<font color="red">Error, invalid dimensions</font>');
        }
        
        receiveBitcoinPayment(function(btc_address) {
            // return payment information
            res.end('<img src="https://blockchain.info/qr?data='+btc_address
              + '&size=200"><br>Please donate '+price+' BTC to '+btc_address);
        });
    });

});

app.use(express.static(__dirname + '/public'));
app.use('/', function(req, res) {
    var c = "";
    fs.readFile(__dirname + '/public/index.html', function(err, squid){
        if (err) throw err;
        
        res.end(squid);
    });
});
 

console.log('Listening to: 9000');
app.listen(9000);
