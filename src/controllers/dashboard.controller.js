import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user?._id;

    if(!channelId) {
        throw new ApiError(400, "Unauthorized access")
    }

    //1)Total videos
    const totalVideos = await Video.countDocuments({
        owner: channelId
    });

    //2)Total views (Aggregation to sum views)
    const viewsData = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId);
            }
        },
        {
            $group: {
                _id: null,
                totalViews = { $sum: "$views"}
            }
        }
    ]);

    const totalViews = viewsData[0]?.totalViews || 0;

    //3)Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    //4)Total likes on all videos
    const likeData = await Like.aggregate([
        {
            $lookup: {
                from: "video",
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        {
            $unwind: "$videoData"
        },
        {
            $match: {
                "videoData.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum : 1 }
            }
        }
    ]);
    
    const totalLikes = likeData[0]?.totalLikes || 0;

    return res
    .status(200)
    .json(new ApiResponse(200))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user?._id;

    if(!channelId) {
        throw new ApiError(400, "Unauthorized access")
    }

    const videos = await Video.find({
        owner: channelId
    }).sort({ createdAt: -1});

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats, 
    getChannelVideos
    }