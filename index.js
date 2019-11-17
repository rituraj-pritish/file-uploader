const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage');

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

//upload file
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);
  res.json({ file: req.file });
});

//display all files in json
app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ err: 'No files found' });
    }

    res.json(files);
  });
});

//display file in json
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err,file) => {
    if(!file) {
      return res.status(404).json({err: 'File not found'})
    }

    return res.json(file)
  })
});

//display image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err,file) => {
    if(!file) {
      return res.status(404).json({err: 'File not found'})
    }

    //check if image
    if(file.contentType === 'image/jpeg' || file.contentType === 'img/jpg'){
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res)
    } else {
      res.status(404).json({err: 'Not an image'})
    }

  })
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log('listening'));
