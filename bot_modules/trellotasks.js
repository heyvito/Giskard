// $ trelloTasks
// $ Authors: Zeh
// $ Created on: Mon Apr  4 22:04:38 BRT 2016
// - Test: This is a sample command description that will be parsed
// and shown to users when they request help. Make sure to document
// every command your module provides.

// Tasks
//-------------
// Check error
// Give some feedback if not find user
// Random anwsers when finish the process

var Base 	= require('../src/base_module'),
	Trello 	= require("node-trello");

//Add R2D3 profile and get the API key
var t = new Trello("6e3b510ead1a6e515e6ebc6754944c0c", "7e13a9db81b180b51b8b3068a78d6a291ff909c5bf813ed29d55f0f59a304fe7");

//Add new checklist mode options
var checkModel 	= [ "Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

//Global
var username;

var trelloTasks = function(bot) {
    Base.call(this, bot);
    this.respond(/(.*)?trello card(.*)?/i, function(response) {

    	username = response.user.name;
    	response.reply("Só um segundo.");
	    getRightList("SjRJiE2O")
	  		.then(function(idList) { return createCard(idList); })
   	 		.then(function(idCard) { return createChecklist(idCard); })
    		.then(function() {
    			response.reply("Feito, amiguinho.");
    	});

	});
};

Base.setup(trelloTasks, 'trelloTasks');
module.exports = trelloTasks;

//----------------------
//Helper functions
//---------------------

function getRightList(boardId) {
	return new Promise(function(resolve, reject) {

		t.get(`/1/boards/${boardId}/lists`, function(err, data) {
		  if (err) reject(Error("Network Error: "+err) );

		  var boardList = data.sort(function(a) { return new Date(a.name.split(" - ")); });
		  resolve(boardList[0].id);

		});

  });
}

function getUserID(username) {
	return new Promise(function(resolve, reject) {

		t.get("/1/search/members", { query: username }, function(err, data) {
		  if (err) reject(Error("Network Error: "+err) );

		  resolve(data[0].id);

		});

	});
}


function createCard(idList) {
	return new Promise(function(resolve, reject) {

		getUserID(username).then(function(userID) {

			var newCard = {
				name: username,
			  	idList: idList,
			  	idMembers: userID
			}

			t.post("1/cards",newCard, function(err, data) {
			  if (err) reject(Error(err) );

			  resolve(data.id);

			});

		});

	});
}

function createChecklist(idCard) {
	return new Promise(function(resolve, reject) {

		checkModel.forEach(function (value, key) {

			var newChecklist = {
				idCard: idCard,
				name: value,
				pos: key
			}

			t.post("/1/checklists",newChecklist, function(err, data) {
		  		if (err) reject(Error(err) );
			});

		});

		resolve();
  	});
}




