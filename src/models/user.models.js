/*users [icon: user]{
_id string pk
username string
email string
fullName string
avatar string
coverImage string
watchHistory string
password string
refeshToken string
createdAt Date
updatedAt Date
} */

import mongoose, { Schema} from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudinary URL
            required: true
        },
        coverImage: {
            type: String, //cloudinary URL
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"]
        },
        refreshToken: {
            type: String,
        }

    },
    { timestamps: true}
)

export const User = mongoose.model("User", userSchema)