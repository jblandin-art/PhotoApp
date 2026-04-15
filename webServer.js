require('dotenv').config();

 * Web Server Implementation
 * * This server extends previous functionality by connecting to the MongoDB 
 * database and serving files from the current directory.
 *
 * Usage:
 * node webServer.js
 *
 * Note: Localhost access allows retrieval of any file within the 
 * current working directory and its subdirectories.
 *
 *
 * API Endpoints:
 * /            - Server status check.
 * /test        - Fetches SchemaInfo JSON to verify database connectivity.
 * /test/info   - Alias for /test.
 * /test/counts - Returns JSON object with document counts for collections.
 *
 * Database-Driven Endpoints:
 * /user/list         - Returns an array of all User objects.
 * /user/:id          - Returns a specific User object by _id.
 * /photosOfUser/:id  - Returns all photos and associated comments for a user.
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const async = require("async");

const express = require("express");
const app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

// Express session and other new modules
const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");

app.use(session({secret: "secretKey", resave: false, saveUninitialized: false}));

app.use(bodyParser.json());

// Authentication middleware: protect all routes except login/logout/test
app.use((req, res, next) => {
  if (
    req.path === '/admin/login' ||
    req.path === '/admin/logout' ||
    (req.path === '/user' && req.method === 'POST') ||
    req.path.startsWith('/test') ||
    req.path === '/' ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.html') ||
    req.path.startsWith('/images') ||
    req.path.startsWith('/compiled')
  ) {
    return next();
  }
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  next();
});

// Endpoint to get current logged-in user
app.get('/me', function (req, res) {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  res.status(200).json(req.session.user);
});


// XXX - Your submission should work without this line. Comment out or delete
// this line for tests and before submission!
//const models = require("./modelData/photoApp.js").models;
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /user/info:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an
    // async call to each collections. That is tricky to do so we use the async
    // package do the work. We put the collections into array and use async.each
    // to do each .count() query.
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          const obj = {};
          for (let i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If the request doesnt support the parameters, then it returns a 400 Bad Request.
    // This informs the the client the parameter is invalid. 
    response.status(400).send("Bad param " + param);
  }
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", function (request, response) {
  // replace models.userListModel() with the appropriate query to the database to return the list of all users.
  User.find({}, '_id first_name last_name', function (err, users) {
    if (err) {
      console.error("Error in /user/list:", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    response.status(200).send(users);
  });
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", function (request, response) {
  const id = request.params.id;
  User.findById(id, '_id first_name last_name location description occupation', function (err, user) {
    if (err) {
      console.error("Error in /user/:id:", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    if (user === null) {
      console.log("User with _id:" + id + " not found.");
      response.status(400).send("Not found");
      return;
    }
    response.status(200).send(user);
  });
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", function (req, res) {
  const id = req.params.id;

  Photo.find({ user_id: id }, '_id file_name date_time user_id comments')
    .populate('comments.user_id', '_id first_name last_name') // fetch only name fields
    .exec(function (err, photos) {
      if (err) {
        console.error(err);
        res.status(500).send(err);
        return;
      }

      if (photos.length === 0) {
      //console.log("Photos for user with _id:" + id + " not found.");
      res.status(400).send("Not found");
      return;
      }
      const plainPhotos = JSON.parse(JSON.stringify(photos));

      plainPhotos.forEach(photo => {
        photo.comments.forEach(c => {
          c.user = c.user_id;
          delete c.user_id;
        });
      });

      // Log the comments arrays specifically to see the rename
      //plainPhotos.forEach(photo => {
        //console.log(`Photo ${photo._id} comments:`, photo.comments);
      //});
      res.status(200).send(plainPhotos);
    });
});

app.post("/admin/login", async function (request, response) {
  const loginName = request.body.login_name;
  const password = request.body.password;

  if (!loginName) {
    return response.status(400).send("Missing login_name");
  }
  if (!password) {
    return response.status(400).send("Missing password");
  }

  try {
    const user = await User.findOne({ login_name: loginName });

    if (!user) {
      return response.status(400).send("Invalid login_name");
    }
    if (user.password !== password) {
      return response.status(400).send("Invalid password");
    }

    request.session.user = {
      _id: user._id,
      first_name: user.first_name
    };

    return response.status(200).json({
      _id: user._id,
      first_name: user.first_name
    });

  } catch (err) {
    return response.status(500).send("Server error");
  }
});

app.post("/admin/logout", function (request, response) {
  if (!request.session.user) {
    return response.status(400).send("Not logged in");
  }

  request.session.destroy();
  return response.status(200).send("Logged out");
});

/**
 * URL /user - Registers a new user.
 * Requires: login_name, password, first_name, last_name in request body.
 * Returns 400 if login_name is already taken or required fields are missing.
 * Returns 200 with the new user object on success.
 */
app.post("/user", async function (request, response) {
  const { login_name, password, first_name, last_name } = request.body;

  // Validate required fields
  if (!login_name) {
    return response.status(400).send("Missing login_name");
  }
  if (!password) {
    return response.status(400).send("Missing password");
  }
  if (!first_name) {
    return response.status(400).send("Missing first_name");
  }
  if (!last_name) {
    return response.status(400).send("Missing last_name");
  }

  try {
    // Check if login_name is already taken
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return response.status(400).send("login_name already taken");
    }

    // Create the new user
    const newUser = await User.create({
      login_name,
      password,
      first_name,
      last_name,
    });

    return response.status(200).json({
      _id: newUser._id,
      login_name: newUser.login_name,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (err) {
    console.error("Error in POST /user:", err);
    return response.status(500).send("Server error");
  }
});

const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
