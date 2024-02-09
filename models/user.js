const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const UserSchema= new Schema({
    name:{
        require:true,
        type:String,
    },
    userName:{
        require:true,
        type:String,
        unique:true
    },
    password:{
        require:true,
        type:String,
    },
    date:{
        type:String,
        default:Date.now()
    }
})

const Users= mongoose.model('users', UserSchema);
module.exports=Users