var express = require('express');
var router = express.Router();
var http = require('http'),fs = require('fs');
var mqtt = require('mqtt');
var URL = require('url');


const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://water.123456@127.0.0.1:27017/drankstation'


var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var  __dirname = "/home/pan/www1/wind3/";


function getinfo(info)
{

var COMNAME = info.substr(1,3);
var MID = info.substr(4,9);
var  TIME = info.substr(13,14);
var WTYPE = info.substr(27,2);

var WNUM = info.substr(29,4);
var U1 = info.substr(33,2);
var U2 = info.substr(35,2);
var U3 = info.substr(37,2);
var U4 = info.substr(39,2);
var U5 = info.substr(41,2);
var U6 = info.substr(43,2);

var R1 = info.substr(45,2);
var R2 = info.substr(47,2);
var R3 = info.substr(49,2);
var R4 = info.substr(51,2);
var R5 = info.substr(53,2);
var R6 = info.substr(55,2);

var COLD = info.substr(57,4);
var HOT = info.substr(61,4);

var S1 = info.substr(65,1);
var S2 = info.substr(66,1);
var S3 = info.substr(67,1);
var S4 = info.substr(68,1);

//String  info111 = "GDSCDC07AH00120190815142460HT0000000000000000000000000000-00025.51111END";

var theobj = {
    "COMNAME":COMNAME,
     "MID":MID,
     "TIME":TIME,
     "WTYPE":WTYPE,
     "WNUM":WNUM,
     "U1":U1,
     "U2":U2,
     "U3":U3,
     "U4":U4,
     "U5":U5,
     "U6":U6,
     "R1":R1,
     "R2":R2,
     "R3":R3,
     "R4":R4,
     "R5":R5,
     "R6":R6,
     "COLD":COLD,
     "HOT":HOT,
     "S1":S1,
     "S2":S2,
     "S3":S3,
     "S4":S4
}

console.log(theobj.MID);

io.emit("waterinfo",theobj);
 
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var query = {MID:theobj.MID};
    var dbo = db.db("drankstation"); 
  
    var newvalues = { $set: theobj };
    dbo.collection("machine").updateOne(query, newvalues, {upsert: true, safe: false},function(err, res) {
      if (err) throw err;
      console.log("1 document updated");
      db.close();
    })
  })

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("drankstation");
    dbo.collection("machine").find({},{projection:{MID:1,U1:2}}).toArray(function(err, result)  {
      if (err) throw err;
      io.emit("listinfo",result);
      db.close();
    })
  }) 
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/page1.html');
});

app.get('/*.html', function (req, res) {
  var url_parts = URL.parse(req.url);
  var thepath = url_parts.pathname;
  res.sendFile(__dirname + '/' + thepath);
})

app.get('/*.png', function (req, res) {
  var url_parts = URL.parse(req.url);
  var thepath = url_parts.pathname;
  res.sendFile(__dirname + '/' + thepath);
})

app.get('/DC07A*',function(req,res){
  res.sendFile(__dirname + '/page2.html');
})


app.get('/mapinfo', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var dbo = db.db("drankstation"); 
    dbo.collection("mapinfo").find({}).toArray(function(err, result) {
      if (err) throw err;
      res.end(JSON.stringify(result));
      db.close();
    })
  })
});


app.get('/orders', function(req, res){

  res.setHeader('Content-Type', 'application/json');
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var dbo = db.db("drankstation"); 
    dbo.collection("order").find({}).toArray(function(err, result) {
      if (err) throw err;
      res.end(JSON.stringify(result));
      db.close();
    })
  })
});

app.get('/saveorder',function(req, res) {

  var theinfo = {"payid":"0001","paytype":"paypal","orderinfo":"24_00_00_10_20_10:","price":"3.00","time":"2019-09-15 20:48:56","orderstate":"payed","MachineID":"DSDA17H0002"};
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);

      var dbo = db.db("drankstation"); 
      dbo.collection("order").insertOne(theinfo,function(err, result) {
        if (err) throw err;
        res.end("saved");
        console.log("1 order save");
        db.close();
      })
    })

})



io.on('connection', function(socket){
  socket.on('loadmachine',function(msg){
  console.log("load machine " + msg);
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var query = {"MID":msg};
    var dbo = db.db("drankstation"); 
    dbo.collection("machine").findOne(query,function(err, result) {
      if (err) throw err;
      io.emit("waterinfo2",result);
      db.close();
    })
  })
  });
  


socket.on('loadlist',function(msg){
  console.log("load list");
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("drankstation");
    dbo.collection("machine").find({},{projection:{MID:1,U1:2}}).toArray(function(err, result)  {
      if (err) throw err;
      io.emit("listinfo",result);
      db.close();
    })
  }) 
})

socket.on('loadmapinfo',function(msg){
  console.log("load mapinfo");
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var dbo = db.db("drankstation"); 
    dbo.collection("mapinfo").find({}).toArray(function(err, result) {
      if (err) throw err;
      io.emit("mapinfo",result);
      db.close();
    })
  })
})

});


http.listen(80, function(){
  console.log('listening on *:80');
});


var options = {port:2000,clientId:"DrankStationADMIN001"};

var client  = mqtt.connect('mqtt://www.windcoffee.club',options);

client.on('connect', function () {

    client.subscribe('DrankStation', function (err) {
        if (!err) {
      console.log("mqtt sub DrankStation ok");
      }else {
      console.log("mqtt sub DrankStation "  + console.error());
      }
      });

      client.subscribe('mapinfo', function (err) {
        if (!err) {
      console.log("mqtt sub mapinfo ok");
      }else {
      console.log("mqtt sub mapinfo "  + console.error());
      }
      });
})

client.on('message', function (topic, message) {  
  if (topic == "DrankStation")
  {
    console.log(message.toString());
    getinfo(message.toString());
  }

  if (topic == "mapinfo")
  {
    var  theinfo = message.toString();
    console.log(theinfo);

    MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);

      var theobj = JSON.parse(theinfo);

      var query = {DS_id:theobj.DS_id};
      var dbo = db.db("drankstation"); 
    
      var newvalues = { $set: theobj };
      dbo.collection("mapinfo").updateOne(query, newvalues, {upsert: true, safe: false},function(err, res) {
        if (err) throw err;
        console.log("1 mapinfo updated");
        db.close();
      })
    })
  }


  
} )
