import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true //this index make a good for searchings..
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avtar: {
            type: String, //cloudinary url //means aws has part that he is part of production
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "video"  // we have used this ref in future
            }
        ],
        password:{
            type: String,  // database password encrypt problem how this we solve 
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        }

    },
    {
        timestamps: true,
        //in this second object we can add more options createdAt and updatedAt
    }
)

//this time we used hook
//this hooks time we cannot use arrow function because its not allowed this object keyword its allowed normal type of write function
userSchema.pre("save", async function (next) {

    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//now we make a method
userSchema.methods.isPasswordCorrect = async function 
(password){
    return await bcrypt.compare(password, this.password)
}

//now we create jwt token
userSchema.methods.generateAccessToken = function (){
    //in jwt sign we have to pass two things first is payload second is secret key
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function (){
        return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

export const User = mongoose.model("User", userSchema)