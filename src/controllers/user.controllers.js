import {asyncHandler} from "../utils/AsyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, username, password} = req.body

    //validation
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    

})




export { registerUser }