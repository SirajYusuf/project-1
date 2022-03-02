require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./utilities/error-handler');
const connectMongooseToDatabase = require('./config/mongooseConfig');
const connectToMongoDatabase = require('./config/mongodbConfig');
const routes = require('./routes')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// api routes
app.use(routes);

// connect mongoose
connectMongooseToDatabase();

// connect mongodb
const ConnectToMongoDb = async () => {
    const db = await connectToMongoDatabase()
    app.locals.db = db
}

ConnectToMongoDb()

app.use(errorHandler);

const port=111;


app.listen(port,()=>{
    console.log("Server is started on port 1111")

})
