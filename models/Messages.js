const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema= new Schema({
    conversation:{
        type:Schema.Types.ObjectId,
        ref:'conservation' 
    },
    from:{
        type:Schema.Types.ObjectId,
        ref:'users'
    },
    to:{
        type:Schema.Types.ObjectId,
        ref:'users'
    },
    
    body:{
        type:String
    },

    date:{
        type:String,
        default:Date.now()
    }
})

const Message= mongoose.model('message', MessageSchema);
module.exports=Message;