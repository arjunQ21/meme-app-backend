const mongoose = require("mongoose");
const path = require("path");

const memeSchema = mongoose.Schema({
    caption: String,
    filePath: {
        type: String,
        required: true,
    },
    likes: [
        {
            type: mongoose.Types.ObjectId,
            ref: "User",
        }
    ],
    uploadedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true });


memeSchema.methods.formatted = async function (req) {
    this.populate("uploadedBy");
    const populated = JSON.parse(JSON.stringify(await this.execPopulate()));
    const filePath = (req.secure ? "https://" : "http://") + req.headers.host + "/images/" + (this.filePath.split(path.sep).join("/"));
    return {
        ...{ likes: [] },
        ...populated,
        filePath,
    }
}


const Meme = mongoose.model(
    "Meme", memeSchema
)



module.exports = Meme;