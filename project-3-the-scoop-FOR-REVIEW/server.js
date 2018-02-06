// npm install js-yaml
let yaml = require('js-yaml');
// this is preloaded in node
let fs = require('fs');
// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
	comments: {},
  nextArticleId: 1,
	nextCommentId: 1
};
// bonus functions to follow, pretty self-explanatory
function saveDatabase(){
	fs.writeFileSync( 'yaml/database.yaml', yaml.dump(database) );
	return 0
};
function loadDatabase(){
	database = yaml.safeLoad( fs.readFileSync('yaml/database.yaml','utf8') );
	return database
};
//routes
const routes = {
	// task 1: new comment route 'C'
	'/comments': {
		'POST':	makeComment
	},
	// task 2 update / delete comment route 'U' / 'D'
	'/comments/:id': {
		'PUT': updateComment,
		'DELETE': deleteComment
	},
	// task 3 another update route 'U'
	'/comments/:id/upvote': {
		'PUT': upvoteComment
	},
	// task 4 a last update route 'U'
	'/comments/:id/downvote': {
		'PUT': downvoteComment
	},
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  }
};
// its a little more clear if i split this function out
// all we're doing here is retreiving the current id, then
// incrementing the next id
function getCommentId() {
	let id = database.nextCommentId;
	database.nextCommentId++;
	return id;
};
// task 4 a last update route 'U'
function downvoteComment(url, request) {
	const response = {};
	// get comment id from the url
	const commentId = Number(url.split('/')[url.split('/').length-2]);
	// from the tests, return 400
	if (!request.body){
		response.status = 400;
		return response;
	}
	//get username from the request body
	const username = request.body['username'];
	// from the tests, return 400
	if (!database.users[username]) {
		response.status = 400;
		return response;
	}
	// if we have a comment id
	if (commentId){
		// from the tests, return 400
		if (!database.comments[commentId]){
			response.status = 400;
			return response;
		}
		// and a username
		if (username){
			// lets check if they've already downvoted
			let alreadyVoted = false;
			// go through each downvote
			database.comments[commentId]['downvotedBy'].forEach(
				// our callback function will be checking users
				// who have already downvoted this comment
				function(user){
					if (user === username){
						// if they've already voted, then don't do anything
						alreadyVoted = true;
					}
				}
			);
			// if they haven't voted yet, add em to the list
			if (!alreadyVoted){
				database.comments[commentId]['downvotedBy'].push(username);
			}
			// now lets check if they upvoted this comment previously
			database.comments[commentId]['upvotedBy'].forEach(
				function(user){
					if (user === username){
						// if so, we need to splice the upvotedby list and remove their username
						let index = database.comments[commentId]['upvotedBy'].indexOf(username);
						database.comments[commentId]['upvotedBy'].splice(index,1);
					}
				}
			);
			// so here we return the comment and a status of 200 OK
			response.body = {comment: database.comments[commentId]}
			response.status = 200;
		}else{
			// if no username, we need to return a status 400
			response.status = 400;
		}
	}else{
		// if no comment id we need to return a status 400
		response.status = 400;
	}
	// and return our response object
	return response;
}
// task 3 another update route 'U'
function upvoteComment(url, request) {
	// get comment id from the url
	const commentId = Number(url.split('/')[url.split('/').length-2]);
	// set up our response object
	const response = {};
	// from the tests, return 400
	if (!request.body){
		response.status = 400;
		return response;
	}
	//get username from the request body
	const username = request.body['username'];
	// from the tests, return 400
	if (!database.users[username]) {
		response.status = 400;
		return response;
	}

	// if we have a comment id
	if (commentId){
		// from the tests, return 400
		if (!database.comments[commentId]){
			response.status = 400;
			return response;
		}
		// and a username
		if (username){
			// lets check if they've already voted
			let alreadyVoted = false;
			// go through each downvote
			database.comments[commentId]['upvotedBy'].forEach(
				// our callback function will be checking users
				// who have already upvoted this comment
				function(user){
					if (user === username){
						// if they've already voted, then don't do anything
						alreadyVoted = true;
					}
				}
			);
			if (!alreadyVoted){
			// if they haven't voted yet, add em to the list
				database.comments[commentId]['upvotedBy'].push(username);
			}
			// now lets check if they downvoted this comment previously
			database.comments[commentId]['downvotedBy'].forEach(
				function(user){
					if (user === username){
						// if so, we need to splice the downvotedBy list and remove their username
						let index = database.comments[commentId]['downvotedBy'].indexOf(username);
						database.comments[commentId]['downvotedBy'].splice(index,1);
					}
				}
			);
			// so here we return the comment and a status of 200 OK
			response.body = {comment: database.comments[commentId]}
			response.status = 200;
		}else{
			// if no username, we need to return a status 400
			response.status = 400;
		}
	}else{
		// if no comment id we need to return a status 400
		response.status = 400;
	}
	// and return our response object
	return response;
}
// task 1: new comment route 'C'
function makeComment(url, request) {
	// set up an object for our response
  const response = {};
	// from the tests, return 400
	if (!request.body){
		response.status = 400;
		return response
	}
	// get the comment from the request body
  const _comment = request.body['comment'];
	if (_comment) {
		// check the keys and database before we being to make sure we are
		// being supplied all the information required to make a comment and
		// that our user exists and that the article we're commentin on exists
		if ( (_comment.body && (_comment.body !== null) && (_comment.body !== undefined) ) &&
					(_comment.username && (_comment.username in database.users)) &&
					(_comment.articleId && (_comment.articleId in database.articles)) ){
			// get the next comment id
			let commentId = getCommentId();
			if (commentId) {
				//set up our comment object
				let comment = {
					id:  commentId,
					body: _comment['body'],
					username: _comment['username'],
					articleId: _comment['articleId'],
					upvotedBy: [],
					downvotedBy: [],
				};
				// insert our comment into the database
				database.comments[commentId] = comment;
				// make sure we add the comment id to the article too
				database.articles[_comment['articleId']]['commentIds'].push(commentId);
				// make sure to add the commend id to the user's articles
				database.users[_comment['username']]['commentIds'].push(commentId);
				// add the comment to our response body
				response.body = {comment:database.comments[commentId]}
				// send a 201
				response.status = 201;
			} else {
				// if we don't get a comment id, return 400
				response.status = 400;
			}
		} else {
			// if our comment doesn't meet the requirements, 400
			response.status = 400;
		}
  } else {
		// if we don't have a comment in our request, send a 400
    response.status = 400;
  }
	//return our response
  return response;
};
//task 2, part b, delete a comment
function deleteComment(url,request) {
	// get the comment id from the url
	const commentId = Number(url.split('/')[url.split('/').length-1]);
	// set up our response object
	const response = {};
	// if we have a comment id
	if (commentId) {
		// get the comment, we need some info from it
		const comment = database.comments[commentId];
		if (comment) {
			// set the comment object in the database to null
			database.comments[commentId] = null;
			// remove comment id from users' comment ids
			let myIndex = database.users[comment.username].commentIds.indexOf(commentId);
			database.users[comment.username].commentIds.splice( myIndex,1 );
			// now lets go through each article and their commentids
			for (const article in database.articles) {
				database.articles[article].commentIds.forEach(cId => {
					if (cId === commentId) {
						// if we find the comment id for this comment, splice the list
						// to remove it
						let index = database.articles[article].commentIds.indexOf(cId);
						database.articles[article].commentIds.splice(index,1);
					}
				});
			};
			// return a 204 if we deleted the comment
			response.status = 204;
		} else {
			// comment doesn't exist in users commentIds
			response.status = 404;
		}
	} else {
		// return a 400 if we don't have a comment id
		response.status = 400;
	}
	// and return our response
	return response;
};
// task 2 part a, update an existing comment
function updateComment(url,request) {
	// set up our response object
	const response = {};
	// from the tests, return 400
	if (!request.body || !request.body.comment ) {
		response.status = 400;
		return response;
	}
	// get the comment from our request body
	const _comment = request.body.comment;
	if ( _comment && _comment.body.length > 0  ) { // did we get a comment
		// comment id is in the url, grab that
		let commentId = Number(url.split('/')[url.split('/').length-1]);
		if (commentId) { // if we have an id as well
			// grab the comment if it exists
			let current_comment = database.comments[commentId];
			if (current_comment) {
				// sub the body of the comment with the request
				database.comments[commentId].body = _comment.body
				// status 200 in this case, and return the updated comment
				response.status = 200;
				response.body = {comment:database.comments[commentId]}
			} else { // if the commentId doesn't exist in the database
				response.status = 404
			}
		} else { // if we don't have a comment id, from the instructions
			response.status = 200;
		}
	} else { // if we don't get supplied a comment, from the instructions
		return response.status = 400;
	}
	// return
	return response;
};

function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++,
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].articleIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', null);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});
