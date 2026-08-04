// Migrate local photos to S3 and update the database with the new URLs

/*
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Photo = require("./schema/photo");

mongoose.Promise = require("bluebird");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function migratePhotos() {
  await mongoose.connect(process.env.MONGODB_URI);

  const photos = await Photo.find({
    file_name: { $not: /^https?:\/\// }
  });

  for (const photo of photos) {
    const localPath = path.join(__dirname, "images", photo.file_name);

    if (!fs.existsSync(localPath)) {
      console.log(`Skipping missing file: ${photo.file_name}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);
    const key = `migrated/${photo._id}-${path.basename(photo.file_name)}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "application/octet-stream",
    }));

    photo.file_name = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    await photo.save();

    console.log(`Migrated ${photo._id}`);
  }

  console.log("Migration complete");
}

migratePhotos().catch((err) => {
  console.error(err);
  process.exit(1);
});

*/