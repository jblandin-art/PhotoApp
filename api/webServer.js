//require('dotenv').config();

/*Web Server Implementation
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
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
// Load the Mongoose schema for User, Photo, and SchemaInfo
const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const User = require("../api/schema/user.js");
const Photo = require("../api/schema/photo.js");
const SchemaInfo = require("../api/schema/schemaInfo.js");
const MongoStore = require("connect-mongo").default || require("connect-mongo");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET;

async function uploadPhotoToS3(fileBuffer, filename, contentType) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: filename,
    Body: fileBuffer,
    ContentType: contentType || "application/octet-stream",
    ACL: "public-read",
  });

  await s3Client.send(command);

  const region = process.env.AWS_REGION || "us-east-1";
  return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${encodeURIComponent(filename)}`;
}

// Express session and other new modules
const processFormBody = multer({
  storage: multer.memoryStorage(),
}).single("uploadedphoto");

app.use(bodyParser.json());

mongoose.set("strictQuery", false);

/**
 * Wraps any promise with a hard timeout that REJECTS (instead of relying on
 * driver-level timeout options that aren't always honored). This guarantees
 * the caller gets a definitive success/failure within `ms`, rather than
 * hanging indefinitely.
 */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    console.log("[connectToDatabase] using cached connection");
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  console.log("[connectToDatabase] connecting...");

  cachedDb = await withTimeout(
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    }),
    5000,
    "MongoDB connection"
  );

  console.log("[connectToDatabase] connected");
  return cachedDb;
}

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("[connectToDatabase] failed:", err.message);
    res.status(503).json({ error: "Database unavailable", detail: err.message });
  }
});

// Build the session store once, lazily, with the same timeout guarantee —
// this avoids a second silent-hang point independent of connectToDatabase().
let sessionMiddleware = null;

async function getSessionMiddleware() {
  if (sessionMiddleware) {
    return sessionMiddleware;
  }

  console.log("[session] building MongoStore...");

  const store = await withTimeout(
    Promise.resolve(
      MongoStore.create({
        client: mongoose.connection.getClient(), // reuse the existing connection, don't open a second one
        collectionName: "sessions",
        ttl: 14 * 24 * 60 * 60,
      })
    ),
    5000,
    "Session store setup"
  );

  sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });

  console.log("[session] ready");
  return sessionMiddleware;
}

app.use(async (req, res, next) => {
  try {
    const mw = await getSessionMiddleware();

    console.log("[session] invoking middleware (this is where store.get() runs)...");

    await withTimeout(
      new Promise((resolve, reject) => {
        mw(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
      5000,
      "Session load (store.get)"
    );

    console.log("[session] middleware done, session id:", req.sessionID);
    next();
  } catch (err) {
    console.error("[session] failed:", err.message);
    if (!res.headersSent) {
      res.status(503).json({ error: "Session store unavailable", detail: err.message });
    }
  }
});

// Authentication middleware: protect all routes except login/logout/test
app.use((req, res, next) => {
  const path = req.path.replace(/\/$/, "");

  if (
    path === "/admin/login" ||
    path === "/admin/logout" ||
    (path === "/user" && req.method === "POST") ||
    path.startsWith("/test") ||
    path === "/"
  ) {
    return next();
  }
  if (!req.session.user) {
    console.log("Unauthorized access attempt to", req.path, req.method, "without a valid session"
    )
    return res.status(401).send("Unauthorized");
  }
  return next();
});

// Endpoint to get current logged-in user
app.get("/me", function (req, res) {
  console.log("[/me] session user:", req.session.user);
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }
  return res.status(200).json(req.session.user);
});

app.get("/test/:p1", function (request, response) {
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        console.error("Error in /user/info:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        response.status(500).send("Missing SchemaInfo");
        return;
      }
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
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
    response.status(400).send("Bad param " + param);
  }
});

app.get("/user/list", function (request, response) {
  User.find({}, "_id first_name last_name", function (err, users) {
    if (err) {
      console.error("Error in /user/list:", err);
      return response.status(500).send(JSON.stringify(err));
    }
    return response.status(200).send(users);
  });
});

app.get("/user/:id", function (request, response) {
  const id = request.params.id;
  User.findById(
    id,
    "_id first_name last_name location description occupation",
    function (err, user) {
      if (err) {
        if (err.name === "CastError") {
          return response.status(400).send("Invalid user id");
        }
        console.error("Error in /user/:id:", err);
        return response.status(500).send(JSON.stringify(err));
      }
      if (user === null) {
        console.log("User with _id:" + id + " not found.");
        return response.status(400).send("Not found");
      }
      return response.status(200).send(user);
    }
  );
});

app.get("/users/mentionSearch", function (request, response) {
  const searchText = (request.query.search || "").trim();

  if (!searchText) {
    return response.status(400).send("Missing search parameter");
  }
  return User.find({
    $or: [
      { login_name: { $regex: searchText, $options: "i" } },
      { first_name: { $regex: searchText, $options: "i" } },
    ],
  })
    .select("_id login_name first_name last_name")
    .limit(8)
    .then((users) => {
      const suggestions = users.map((user) => ({
        id: user._id,
        display: `${user.first_name} ${user.last_name} (${user.login_name})`,
      }));
      response.status(200).send(suggestions);
    })
    .catch((err) => {
      console.error("Error in /users/mentionSearch:", err);
      response.status(500).send("An error occurred while searching for users");
    });
});

app.get("/photosOfUser/:id", function (req, res) {
  const id = req.params.id;

  Photo.find({ user_id: id }, "_id file_name date_time user_id comments")
    .populate("comments.user_id", "_id first_name last_name")
    .populate("comments.mentions", "_id login_name first_name last_name")
    .exec(function (err, photos) {
      if (err) {
        if (err.name === "CastError") {
          return res.status(400).send("Invalid user id");
        }
        console.error(err);
        return res.status(500).send(err);
      }

      if (photos.length === 0) {
        return res.status(400).send("Not found");
      }
      const plainPhotos = JSON.parse(JSON.stringify(photos));

      plainPhotos.forEach((photo) => {
        photo.comments.forEach((c) => {
          c.user = c.user_id;
          delete c.user_id;
          if (!c.mentions || c.mentions.length === 0) {
            delete c.mentions;
          }
        });
      });

      return res.status(200).send(plainPhotos);
    });
});

app.get("/photosWithMentions/:user_id", async function (request, response) {
  const userId = request.params.user_id;

  try {
    const mentionedUser = await User.findById(userId, "_id first_name last_name");
    if (!mentionedUser) {
      return response.status(400).send("User not found");
    }

    const photos = await Photo.find(
      { "comments.mentions": userId },
      "_id file_name date_time user_id comments"
    )
      .lean()
      .exec();

    const ownerIds = Array.from(new Set(photos.map((photo) => String(photo.user_id))));
    const owners = await User.find({ _id: { $in: ownerIds } }, "_id first_name last_name")
      .lean()
      .exec();
    const ownerById = new Map(owners.map((owner) => [String(owner._id), owner]));

    const payload = photos.map((photo) => {
      const ownerData = ownerById.get(String(photo.user_id)) || null;
      const owner = ownerData
        ? {
            _id: String(ownerData._id),
            first_name: ownerData.first_name || "",
            last_name: ownerData.last_name || "",
          }
        : null;

      const photoObj = {
        _id: photo._id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: String(photo.user_id),
        owner: owner,
        mention_comments: [],
      };

      photo.comments.forEach((comment) => {
        const mentionIds = (comment.mentions || []).map((id) => String(id));
        if (mentionIds.includes(String(userId))) {
          photoObj.mention_comments.push({
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            user_id: comment.user_id,
          });
        }
      });

      return photoObj;
    });

    return response.status(200).json({
      user: mentionedUser,
      photos: payload,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return response.status(400).send("Invalid user id");
    }
    console.error("Error in GET /photosWithMentions/:user_id:", err);
    return response.status(500).send("Server error");
  }
});

async function resolveMentionIds(commentText, requestMentionIds) {
  const uniqueIds = new Set();
  const invalidMentionIds = [];

  if (Array.isArray(requestMentionIds)) {
    requestMentionIds.forEach((id) => {
      if (id === null || id === undefined) {
        return;
      }
      const normalizedId = String(id).trim();
      if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
        invalidMentionIds.push(normalizedId);
        return;
      }
      uniqueIds.add(normalizedId);
    });
  }

  if (invalidMentionIds.length > 0) {
    return {
      ok: false,
      message: "Invalid mention user id",
    };
  }

  const mentionLoginNames = new Set();
  const mentionRegex = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]+)/g;
  let match = mentionRegex.exec(commentText);
  while (match) {
    mentionLoginNames.add(match[2]);
    match = mentionRegex.exec(commentText);
  }

  if (mentionLoginNames.size > 0) {
    const users = await User.find(
      {
        login_name: {
          $in: Array.from(mentionLoginNames).map((name) => new RegExp(`^${name}$`, "i")),
        },
      },
      "_id login_name"
    );

    const byLowerLogin = new Map();
    users.forEach((user) => {
      byLowerLogin.set(String(user.login_name).toLowerCase(), String(user._id));
    });

    const invalidLoginNames = [];
    mentionLoginNames.forEach((name) => {
      const foundId = byLowerLogin.get(String(name).toLowerCase());
      if (foundId) {
        uniqueIds.add(foundId);
      } else {
        invalidLoginNames.push(name);
      }
    });

    if (invalidLoginNames.length > 0) {
      return {
        ok: false,
        message: `Invalid @mentions: ${invalidLoginNames.join(", ")}`,
      };
    }
  }

  const mentionIdList = Array.from(uniqueIds);
  if (mentionIdList.length === 0) {
    return { ok: true, mentionIds: [] };
  }

  const mentionUsersById = await User.find(
    { _id: { $in: mentionIdList } },
    "_id login_name first_name last_name"
  );
  if (mentionUsersById.length !== mentionIdList.length) {
    return {
      ok: false,
      message: "Invalid mention user id",
    };
  }

  return {
    ok: true,
    mentionIds: mentionUsersById.map((user) => user._id),
    mentionUsers: mentionUsersById,
  };
}

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
      first_name: user.first_name,
    };

    return response.status(200).json({
      _id: user._id,
      first_name: user.first_name,
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

app.post("/user", async function (request, response) {
  function toTitleCase(str) {
    if (!str) return str;

    return str
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
    }

  const { login_name, password } = request.body;
  const first_name = toTitleCase(request.body.first_name);
  const last_name = toTitleCase(request.body.last_name);


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
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return response.status(400).send("login_name already taken");
    }

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

app.post("/commentsOfPhoto/:photo_id", async function (request, response) {
  const photoId = request.params.photo_id;
  const commentText = request.body.comment;
  const requestMentionIds = request.body.mentions;

  if (!commentText || !String(commentText).trim()) {
    return response.status(400).send("Missing comment");
  }

  try {
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return response.status(400).send("Photo not found");
    }

    const mentionResolution = await resolveMentionIds(String(commentText).trim(), requestMentionIds);
    if (!mentionResolution.ok) {
      return response.status(400).send(mentionResolution.message);
    }

    const comment = {
      comment: String(commentText).trim(),
      date_time: new Date(),
      user_id: request.session.user._id,
      mentions: mentionResolution.mentionIds,
    };

    photo.comments.push(comment);
    await photo.save();

    const createdComment = photo.comments[photo.comments.length - 1];
    const populatedMentions = mentionResolution.mentionUsers || [];

    return response.status(200).json({
      _id: createdComment._id,
      comment: createdComment.comment,
      date_time: createdComment.date_time,
      mentions: populatedMentions,
      user: {
        _id: request.session.user._id,
        first_name: request.session.user.first_name,
        last_name: request.session.user.last_name || "",
      },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return response.status(400).send("Invalid photo id");
    }
    console.error("Error in POST /commentsOfPhoto/:photo_id:", err);
    return response.status(500).send("Server error");
  }
});

app.post("/photos/new", function (request, response) {
  if (!request.session.user) {
    return response.status(401).send("Unauthorized");
  }

  const user_id = request.session.user._id;

  return processFormBody(request, response, async function (err) {
    if (err || !request.file) {
      console.error("Error in /photos/new: No file provided", err);
      return response.status(400).send("photo required");
    }

    if (!S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return response
        .status(500)
        .send(
          "S3 upload is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and S3_BUCKET."
        );
    }

    const timestamp = new Date().valueOf();
    const filename = "U" + String(timestamp) + request.file.originalname;

    try {
      const imageUrl = await uploadPhotoToS3(request.file.buffer, filename, request.file.mimetype);

      await Photo.create({
        file_name: imageUrl,
        date_time: new Date(),
        user_id: new mongoose.Types.ObjectId(user_id),
        comments: [],
      });

      return response.status(200).send("Photo uploaded successfully");
    } catch (err2) {
      console.error("Error uploading photo to S3:", err2);
      return response.status(500).send(err2 && err2.message ? err2.message : "Database error");
    }
  });
});

module.exports = async (req, res) => {
  console.log("[handler] incoming url:", req.url, "query:", req.query);

  // Rebuild the real path from the ?path= param that our vercel.json rewrites
  // now explicitly forward (Vercel drops unreferenced rewrite params otherwise).
  if (req.query && req.query.path) {
    req.url = req.query.path;
  }

  console.log("[handler] resolved url for Express:", req.url);

  try {
    // Call the Express app directly as a (req, res) function — Express apps
    // are callable this way natively. This writes straight to the real
    // response stream Vercel gave us, unlike serverless-http's Lambda-style
    // event/context adapter, which builds its own internal response object
    // instead of writing to the actual socket.
    await withTimeout(
      new Promise((resolve, reject) => {
        res.on("finish", resolve);
        res.on("error", reject);
        app(req, res);
      }),
      8000,
      "Request"
    );
  } catch (err) {
    console.error("[handler] failed or timed out:", err.message);
    if (!res.headersSent) {
      res.statusCode = 504;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message }));
    }
  }
};
