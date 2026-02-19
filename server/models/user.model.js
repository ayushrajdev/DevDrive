import { model, Schema } from 'mongoose';

const userSchema = new Schema(
    {
        name: String,
        email: {
            type: String,
            required: [true, 'name field is required'],
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'email is invalid',
            ],
        },
        password:String,
        rootDirId:{
            type:Schema.Types.ObjectId,
            ref:"Directory"
        }

    },

    {
        timestamps: true,
        strict: 'throw', //by default -> true
        // versionKey: false, // now versioning of document is not defined,
        // collection: 'users',
        
    },
);

const User = model('User', userSchema);
export default User
