import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const {videoId} = req.params
    const userId = req.user?._id

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    //check if likr already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    if (existingLike) {
        //If liked already removed
        await existingLike.deleteOne();

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video Unliked"));
    }
    //if not liked already create new like
    await Like.create({
        video: videoId,
        likedBy: userId
    });

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked"))
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const { commentId } = req.params;
    const userId = req.user?._id;

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    if(existingLike) {
        await existingLike.deleteOne();

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment unliked"));
    }

    await Like.create({
        comment: commentId,
        likedBy: userId
    });

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment liked"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params;
    const userId = req.user?._id;

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if(existingLike) {
        await existingLike.deleteOne();

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet unliked"));
    }

    await Like.create({
        tweet: tweetId,
        likedBy: userId
    });

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Liked"))
}
);

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    const likedVideos = await Like.find({
        likedBy: userId,
        video: {$ne: null}
    }).populate("video");

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked video fetched succesfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}