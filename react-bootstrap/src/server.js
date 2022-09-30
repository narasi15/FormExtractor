// Express Libraries and other Global vars
const express = require('express');
const {spawn} = require('child_process');
const multer = require('multer')
const fs = require('fs')
const path = require("path")
const app = express();
const cors = require("cors")


let coordinates = [];
let trainImg = [];
let dir = "backend/image";
let subDir = "backend/image/uploads"
let maxsize = 10*1024*1024 // max file size is default 10MB 
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "backend/image/uploads");
    },
    filename: function (req, file, cb) {
        cb(
          	null,
          	'train_' + file.originalname
        );
    },
});

let imageUpload = multer({storage: storage, limits:{fileSize: maxsize}})

// Executes when node server.js command is run
app.use(
    cors({
        origin: "http://localhost:3000"
    }), 
    express.urlencoded({
        extended: true
    }), 
	express.json(), 
	express.static('backend/image/uploads')
);

// GET endpoints
app.get('/', (req, res) => {
	res.send("Welcome to tExtract!")
    
});


app.get('/api/coords', (req, res) => {
   res.send(coordinates);
});

app.get('/api/trainImage', (req, res) => {
    res.send(trainImg);
});

app.get('/api/images', (req, res) => {
    //res.send([]);
});

app.get('/api/train', (req, res) => {
    //res.send([]);
});

// POST endpoints
app.post('/api/coords', (req, res) => { 
    coordinates = req.body.coords
    console.log(coordinates)
    res.send({coordinates});
});


app.post('/api/images', imageUpload.array("file", 100), (req, res) => {
    // endpoint for test images only 
    if(req.files) {
        req.files.forEach(file => {
            console.log(file.path)
			res.send(file.path)
        });
    }

    // Trigger python script to return coordinates
    var largeDataSet = [];
     // spawn new child process to call the python script
     const childPython1 = spawn('python3', ['backend/script.py']);
     // collect data from script
     childPython1.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
     });
     childPython1.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
     });
     childPython1.on('close', (code) => {
        console.log(`Child process exited with code: ${code}`);
     });
})

app.post('/api/train', imageUpload.array("file", 1), (req, res) => {
    if(req.files) {
        req.files.forEach(file => {
            console.log(file.path)
			res.send(file.path)
        });
    }
});


app.listen(8000, () => console.log('Listening on port 8000...'));

// Creates the image folder if not exists
if(!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(subDir);
};


module.exports = app;
