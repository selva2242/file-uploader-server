require('dotenv').config();
const express = require('express');
const cors    = require('cors')
const app = express();
app.use(cors())
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
const multer = require('multer');
const uploader = multer({
    storage: multer.memoryStorage(),
});
const { Storage } = require('@google-cloud/storage');
const port = process.env.PORT || 8000


const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    keyFilename: process.env.GCLOUD_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL);

app.get('/', (req, res) => res.send('File upload API ready for use'));

app.post('/api/upload/', uploader.single('image'), async (req, res)=>{

    if(!req.file){
        res.status(400).send('Invalid File');
        return;
    }
    try{
        const blob = bucket.file(req.file.originalname);
        const blobWriter = blob.createWriteStream({
          resumable: false,
          metadata: {
            contentType: req.file.mimetype,
          },
        });
        blobWriter.on('error', (err) => res.status(400).send('Error Uploading File'));
        blobWriter.on('finish', () => {
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`;
          res.status(200).send({ fileName: req.file.originalname, fileLocation: publicUrl });
        });
        blobWriter.end(req.file.buffer);
    }catch(err){
        res.status(400).send('Error Uploading File');
    }
})

app.listen(port, () => console.log(`Server is running on port ${port}`));