const mongoose = require("mongoose");
const path = require("path");
const User = require("./user.model");

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
    // const populated = JSON.parse(JSON.stringify(await this.execPopulate()));
    // let populated = await this.execPopulate();
    // populated.uploadedBy= await populated.uploadedBy.formatted(req) ;
    const uploader = await User.findOne({_id: this.uploadedBy})
    const popUser = JSON.parse(JSON.stringify(this)) ;
    const filePath = (req.secure ? "https://" : "http://") + req.headers.host + "/images/" + (this.filePath.split(path.sep).join("/"));
    return {
        ...{ likes: [] },
        ...popUser,
        ...{uploadedBy: await uploader.formatted(req)},
        filePath,
    }
}


const Meme = mongoose.model(
    "Meme", memeSchema
)



module.exports = Meme;