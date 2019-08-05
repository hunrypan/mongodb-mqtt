var express = require('express');
var router = express.Router();
var http = require('http'),fs = require('fs');
var mqtt = require('mqtt');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://water.123456@127.0.0.1:27017/drankstation'


var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var  __dirname = "/home/pan/www1/wind3/";



function getinfo(info)
{

var Trading_Partner_Name = info.substr(0,12);
var Transaction_ID = info.substr(12,25);
var  Primary_Telemetry_ID = info.substr(37,2);
var Equipment_Identifier = info.substr(39,11);

var Date_Of_Transaction = info.substr(50,18);
var thes = Date_Of_Transaction.substr(0,10) + " " + Date_Of_Transaction.substr(10,8);
Date_Of_Transaction = thes;

var Product_UPC_Code = info.substr(68,12);
var Product_Quantity = info.substr(80,4);
var Syrup_1_Used = info.substr(84,4);
var Syrup_2_Used = info.substr(88,4);
var Syrup_3_Used = info.substr(92,4);
var Syrup_4_Used = info.substr(96,4);
var Syrup_1_Remaining = info.substr(100,4);
var Syrup_2_Remaining = info.substr(104,4);
var Syrup_3_Remaining = info.substr(108,4);
var Syrup_4_Remaining = info.substr(112,4);
var Chiller_Bucket_Actual_Temp = info.substr(116,4);
var Hot_Tank_Actual_Temp = info.substr(120,4);

var theobj = {
    "Trading_Partner_Name":Trading_Partner_Name,
     "Transaction_ID":Transaction_ID,
     "Primary_Telemetry_ID":Primary_Telemetry_ID,
     "Equipment_Identifier":Equipment_Identifier,
     "Date_Of_Transaction":Date_Of_Transaction,
     "Product_UPC_Code":Product_UPC_Code,
     "Product_Quantity":Product_Quantity,
     "Syrup_1_Used":Syrup_1_Used,
     "Syrup_2_Used":Syrup_2_Used,
     "Syrup_3_Used":Syrup_3_Used,
     "Syrup_4_Used":Syrup_4_Used,
     "Syrup_1_Remaining":Syrup_1_Remaining,
     "Syrup_2_Remaining":Syrup_2_Remaining,
     "Syrup_3_Remaining":Syrup_3_Remaining,
     "Syrup_4_Remaining":Syrup_4_Remaining,
     "Chiller_Bucket_Actual_Temp":Chiller_Bucket_Actual_Temp,
     "Hot_Tank_Actual_Temp":Hot_Tank_Actual_Temp
}

console.log(theobj.Transaction_ID);

io.emit("waterinfo",theobj);
 
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var query = {Transaction_ID:theobj.Transaction_ID};
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
    dbo.collection("machine").find({},{projection:{Equipment_Identifier:1,Syrup_1_Used:2}}).toArray(function(err, result)  {
      if (err) throw err;
      io.emit("listinfo",result);
      db.close();
    })
  }) 
  
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  
});

app.get('/drinkstation.png', function(req, res){
  res.sendFile(__dirname + '/drinkstation.png');
});


app.get('/drink_used1.png', function(req, res){
  res.sendFile(__dirname + '/drink_used1.png');
});

app.get('/drink_used2.png', function(req, res){
  res.sendFile(__dirname + '/drink_used2.png');
});

app.get('/drink_used3.png', function(req, res){
  res.sendFile(__dirname + '/drink_used3.png');
});

app.get('/warn1.png', function(req, res){
  res.sendFile(__dirname + '/warn1.png');
});

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

io.on('connection', function(socket){
  console.log('a user connected');
  
  socket.on('loadmachine',function(msg){
  console.log("load machine " + msg);
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    var query = {"Equipment_Identifier":msg};
    var dbo = db.db("drankstation"); 
    dbo.collection("machine").findOne(query,function(err, result) {
      if (err) throw err;
      io.emit("waterinfo",result);
      db.close();
    })
  })
  });
  


socket.on('loadlist',function(msg){
  console.log("load list");
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("drankstation");
    dbo.collection("machine").find({},{projection:{Equipment_Identifier:1,Syrup_1_Used:2}}).toArray(function(err, result)  {
      if (err) throw err;
      io.emit("listinfo",result);
      db.close();
    })
  }) 
})

});


http.listen(80, function(){
  console.log('listening on *:80');
});


var options = {port:2000,clientId:"DrankStationADMIN"};

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
