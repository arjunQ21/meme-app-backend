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
    // const populated = JSON.parse(JSON.stringify(await this.execPopulate()));
    let populated = await this.execPopulate();
    populated.uploadedBy= await populated.uploadedBy.formatted(req) ;
    const popUser = JSON.parse(JSON.stringify(populated)) ;
    const filePath = (req.secure ? "https://" : "http://") + req.headers.host + "/images/" + (this.filePath.split(path.sep).join("/"));
    return {
        ...{ likes: [] },
        ...popUser,
        // ...{uploadedBy: await populated.uploadedBy.formatted(req)},
        filePath,
    }
}


const Meme = mongoose.model(
    "Meme", memeSchema
)



module.exports = Meme;