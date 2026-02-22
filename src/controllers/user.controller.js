import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";

//this is we declare method to generate access and refresh token because we will use this method in login and also in refresh token route so that is why we will declare this method outside of login method and also we will export this method because we will use this method in refresh token route also
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        //this access we give users 
        const accessToken = user.generateAccessToken()
        //this refresh token give also database , because not reapetatky ask passwpord to user
        const refreshToken = user.generateRefreshToken()
        //we will save refresh token in database
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // we will save this token in database but we will not validate before save because we already have this token and we will not change this token so that is why we will not validate before save
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //we write all the logical step to register user here

    /*
    1) get user from frontend
    2) validation - check not empty, email valid, password strong etc
    3) check if user already exists: username, email
    4) check for images, check for avtar
    5) upload them to cloudnary, avtar
    6) create user object - create entry in db
    7) remove password and refresh token from response                  
    8) check for user creation
    9) return response
    */

    // 1) now we are seen how user details makes
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);
    const { fullName, email, username, password } = req.body;
    //console.log("email: ", email);

    //we used this but its lengthy and also good but its will we check if else if that type we checked so that is why 
    /* if(fullName === "") {
        throw new ApiError(400, "Full name is required");
    }
    */
    //2nd) steps
    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }
    //3rd) step - we will check if user already exists or not in db
    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existUser) {
        throw new ApiError(409, "user with this email or username already exists")
    }
    //4th) step - we will check for images, check for avtar
    const avtarLocalPath = req.files?.avtar[0]?.path; //we check this file use in multer
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.
        coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].
            path;
    }


    if (!avtarLocalPath) {
        throw new ApiError(400, "avtar file is required")
    }

    //5th) step - we will upload them to cloudnary, avtar,images
    const avtar = await uploadOnCloudinary(avtarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    if (!avtar) {
        throw new ApiError(400, "avtar upload failed")

    }
    //6th) step - we will create user object - create entry in db
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avtar: avtar.url,
        coverImage: coverImage?.url || "" // this coverImage we will check to operate because not validate this have or not
    });
    //7th) step - we will remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        //in this we write what we not required
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while creating user")
    }

    //8th) step - we will check for user creation and also we will return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});


const loginUser = asyncHandler(async (req, res) => {
    //lets write all the steps which we can denote write code
    /*
    1) req body -> data
    2) username or email
    3) find the user
    4) password check
    5) access and refresh token
    6) send cookie
    */
    // 1) req body -> data
    const { username, email, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // 2,3) username or email, find user
    const user = await User.findOne({
        $or: [{ username }, { email }] // this or use we use in array objects
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //4) password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password credentials")
    }

    //5) access and refresh token
    const { accessToken, refreshToken } = await
        generateAccessAndRefreshToken(user._id)
    //in this we have which data has not required which not contain
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in succesfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refresToken

    if (!incommingRefreshToken) {
        throw new ApiError(400, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )  //when its jwt token verify so give decodedToken

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await
            generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token is Refresh"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message ||
            "Invalid Refrsh Token"
        )
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.
    isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed succesfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched succesfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details update succesfully"))
})

const updateUserAvtar = asyncHandler(async (req, res) => {
    const avtarLocalPath = req.file?.path

    if(!avtarLocalPath) {
        throw new ApiError(400, "Avtar file is missing")
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)

    if(!avtar) {
        throw new ApiError(400, "Error while uploading on avtar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avtar: avtar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User avtar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if(!username?.trim) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }    
        },
        {
            $addFields: {
                subscribrerCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?.id, "$subscribers.subscriber"]}, //this $in is check its alive in or not
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            //this project to use we have decide which field we want to show in response and which not show in response
            $project: {
                fullName: 1,
                username: 1,
                avtar: 1,
                subscribrerCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
}) 

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField:"owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avtar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            2000,
            user[0].watchHistory,
            "User watch history fetched successfully"
        )
    )
})
export {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};