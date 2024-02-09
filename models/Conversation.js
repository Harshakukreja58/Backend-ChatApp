const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const ConservationSchema= new Schema({
    recipents:[{
        type:Schema.Types.ObjectId,
        ref:'users'
    }],
    lastMessage:{
        type:String
    },

    date:{
        type:String,
        default:Date.now()
    }
})

const Conversation= mongoose.model('Conversations', ConservationSchema);
module.exports=Conversation;