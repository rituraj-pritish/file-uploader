const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage');

const mongoUri =
  'mongodb+srv://shubham:vinny007@emaily-dev-7yqaa.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const conn = mongoose.connection;

conn.once('open', () => {
  console.log('db connected');

  //initialize stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});
//create storage engine
const storage = new GridFsStorage({
  url: mongoUri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }

        const fileName = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: fileName,
          bucketName: 'uploads'
        };

        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });

module.exports = upload;
