const util = require('util');

var tools = require('./tools');

var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
app.use(express.static('public'));

var mongo = require('mongodb');
var host  = 'localhost';
var port  = 27017;
var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var multer  = require('multer')
var upload = multer({ dest: 'public/uploads/' })

var fs = require('fs');

//var db = new mongo.Db('quad', new mongo.Server(host, port, {}), {safe:false});

//var quaddb = db.db('quad');

app.set('view engine','pug');

app.get('/',function(req,res){


	(async function() {
		try {
			var database = await MongoClient.connect(url);
			const db = database.db('quad')
			
			var quads = db.collection("quads");

			var name = req.query.name;
			var description = req.query.description;

			var data = await quads.find().toArray();

			console.log(data);
			console.log(data.length);

			//res.render('quads_list',{'quadsList':data});
			//res.render('add_quad');
			res.render('admin_panel.pug',{'quadsList':data});

			database.close();
			
		} catch(e) {
			console.log(e);
		}
	})()

})

app.get('/set_hash',function(req,res){

	(async function() {
		var hash_obj = await tools.checkHash(req,res);

		res.end('your hash_id is '+hash_obj.hash_id );
		
	})();



})

app.get('/check_quad_form',function(req,res){
	(async function() {
		try {
			var hash_obj = await tools.checkHash(req,res);

			/*var database = await MongoClient.connect(url);
			const db = database.db('quad')
			
			var quads = db.collection("quads");*/

			res.render('check_quad_form.pug');

			//database.close();
		} catch(e) {
			console.log(e);
		}
	})()
})

app.post('/check_quad',function(req,res){
	(async function() {
		try {
			var database = await MongoClient.connect(url);
			const db = database.db('quad')
			var quads = db.collection("quads");
			var checkins = db.collection("checkins");

			var hash_obj = await tools.checkHash(req,res);

			//console.log(util.inspect(req.body))

			var quad_code = req.body.quad_code;

			console.log('quad code is '+quad_code);

			var found_quad = await quads.findOne({quad_code:quad_code});

			//console.log('found quad is '+util.inspect(found_quad));

			if (found_quad) {
				await checkins.insert({hash_id:hash_obj.hash_id,quad_id:found_quad._id})
				//res.end('checkin is done');
				res.redirect('/ego_wall?quad=done');
			} else {
				//res.end('quad is absent');
				res.redirect('/ego_wall?quad=absent');
			}

			database.close();

		} catch(e) {
			console.log(e);
		}
	})()

})

app.get('/ego_wall',function(req,res){
	(async function() {
		try {
			var database = await MongoClient.connect(url);
			const db = database.db('quad')
			var quads = db.collection("quads");
			var checkins = db.collection("checkins");

			var hash_obj = await tools.checkHash(req,res);

			var user_checkins =await checkins.aggregate([
									    { $lookup:
									       {
									         from: 'quads',
									         localField: 'quad_id',
									         foreignField: '_id',
									         as: 'user_checkins'
									       }
									    }]).toArray();

			res.render('user_checkins.pug',{'userCheckins':user_checkins});

			//console.log('user_checkins'+util.inspect(user_checkins, false, null));


			/*var data = await checkins.find({hash_id:hash_obj.hash_id}).toArray();

			console.log(data);
			console.log(data.length);

			res.end(util.inspect(data));

			*/

			//res.end('chekins are here');




			//res.render('quads_list',{'quadsList':data});
			//res.render('add_quad');
			//res.render('admin_panel.pug',{'quadsList':data});

			database.close();

		} catch(e) {
			console.log(e);
		}
	})()
})

app.post('/add_quad', upload.single('picture'), function (req, res, next){

	(async function() {

		try {

			var database = await MongoClient.connect(url);
			const db = database.db('quad')
			var quads = db.collection("quads");

			var name = req.body.name;
			var description = req.body.description;
			var quad_code = req.body.quad_code;
			var filename = req.file.originalname;

			await quads.insert({name:name,description:description,quad_code:quad_code,filename:filename})

			await fs.rename(req.file.path, 'public/uploads/'+req.file.originalname)

			res.redirect('/');
		
		} catch(e) {
			console.log(e);
		}
	

	})()
})

var server = app.listen(8080,function(){

	console.log('Server got the power');

})