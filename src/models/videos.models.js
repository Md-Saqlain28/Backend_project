/* 
owner ObjectId users
videoFile string
thumbnail string
title string
description string
duration number
views number
isPublished boolean
createdAt Date
updatedAt Date
*/ 
import mongoose, { Schema} from "mongoose";

const videoSchema = new Schema(
{
    
    videoFile: {
        type: String, //CLoudinary url
        required: true
    },
    thumbnail: {
        type: String, //Cloudinary url
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

}, {timestamps: true})





export const User = mongoose.model("User", userSchema)