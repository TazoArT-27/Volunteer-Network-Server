const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra')
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qjf3c.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('works'));
app.use(fileUpload());

const port = 5000;

app.get('/', (req, res) => {
    res.send("hello from db of volunteer network")
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const volunteerInfoCollection = client.db("volunteerNetwork").collection("volunteerInfoCollection");
  const eventsCollection = client.db("volunteerNetwork").collection("eventsCollection");


  //sending volunteer info to db
  app.post("/addVolunteerInfo", (req, res) => {
      const volunteerInfo = req.body;
      console.log(volunteerInfo);
      volunteerInfoCollection.insertOne(volunteerInfo)
      .then(result => {
            res.send(result.insertedCount > 0);
      })
  })
  //getting volunteer info from db for events
  app.get('/eventsWork', (req, res) => {
    volunteerInfoCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
  });

  //sending volunteer work to db
  app.post('/addWork',(req, res) => {
      const file = req.files.file;
      const title = req.body.title;
      const description = req.body.description;
      const filePath = `${__dirname}/works/${file.name}`;
      //console.log(title, description, file);
      file.mv(filePath, err => {
          if (err){
              console.log(err);
              return res.status(500).send({msg: 'Failed to upload image'})
          }
          const newImg = fs.readFileSync(filePath);
          const encImg = newImg.toString('base64');

          var image ={
              contentType: req.files.file.mimetype,
              size: req.files.file.size,
              img: Buffer(encImg, 'base64')
          }
          eventsCollection.insertOne({title, description, image})
          .then(result => {
              fs.remove(filePath, error => {
                  if (error){
                      console.log(error);
                  }
                  res.send(result.insertedCount > 0);
              })
          })
          //return res.send({name: file.name, path: `/${file.name}`})
      })
  })

  //getting new added works from db
  app.get('/works', (req, res) => {
    eventsCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
  });

});





app.listen( process.env.PORT || port);