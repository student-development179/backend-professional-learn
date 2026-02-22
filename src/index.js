import dotenv from "dotenv";

dotenv.config({
    path: './.env'
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Welcome to port 8000 :
        ${process.env.PORT}`);
    })
})

.catch((error) =>{
    console.log("MongoDB connection failed !!! ", error);
})




//this code are also good but we have to use more things so this code are verry heavy show and complex so this is avoid but okk 

/*
import express from "express";
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        //this are app listener
        app.on("error",(error) =>{
            console.log("This site is not answer your query: ", error);
            throw error;
        })

        app.listen(process.env.PORT,() => {
            console.log(`App is listening on port
                ${process.env.PORT}`);
        })

    } catch (error) {
        console.log("ERROR: ", error)
        throw error
    }
})()
*/
