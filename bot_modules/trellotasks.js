// $ trelloTasks
// $ Authors: Zeh
// $ Created on: Mon Apr  4 22:04:38 BRT 2016
// - trello card: Me(r2d3) will create your week trello card

// Tasks
//-------------
// Check error
// Give some feedback if not find user
// Random anwsers when finish the process
// Add new checklist mode options

var Base 	= require('../src/base_module'),
	Trello 	= require("node-trello");

var t = new Trello( process.env.trellotasks_key , process.env.trellotasks_token);
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




