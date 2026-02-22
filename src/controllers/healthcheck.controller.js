import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//this health check only work only said server is okkay?? or not , that are only thing that said so write only return statement
const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "server is running succesfully"
        )
    );
});

export {
    healthcheck
    }
    