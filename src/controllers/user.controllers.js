import {asyncHandler} from "../utils/AsyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId)

        if(!user){
        throw new ApiError(404, "User not found")
    }

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {fullname, email, username, password} = req.body

    //validation
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if(coverImageLocalPath){
    //     coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // }

    let avatar;
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("uploaded avatar", avatar)
    }catch(error){
        console.log("Error uploading avatar", error)
        throw new ApiError(500, "Failed to upload avatar")
    }

    let coverImage;
    try{
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        console.log("uploaded cover image", coverImage)
    }catch(error){
        console.log("Error uploading cover image", error)
        throw new ApiError(500, "Failed to upload cover image")
    }


    try{
         const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "user registered successfully"))

    }catch(error){
        console.error("User creation failed:", error);

        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500, "Something went wrong while registering the user and images were deleted")


    }


})


const loginUser = asyncHandler(async (req, res) => {
    // get data from the body
    const {email, username, password} = req.body

    //validation
    if(!email){
        throw new ApiError(400, "Email is required")
    }
    if(!password){
        throw new ApiError(400, "Password is required")
    }
    if(!username){
        throw new ApiError(400, "Username is required")
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)


    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")

    if(!loggedInUser){
        throw new ApiError(500, "Something went wrong while logging in the user")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {user: loggedInUser, accessToken, refreshToken},
            "user logged in successfully"
        ))
    


})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {new: true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "user logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400, "Refresh token is required")
    }

    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token mismatch")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, 
                        refreshToken: newRefreshToken},
                    "Access token refreshed successfully"
                )
            );

    }catch(error){
        throw new ApiError(401, "Something went wrong while refreshing access token")
    }

})


export { registerUser, loginUser, refreshAccessToken, logoutUser }