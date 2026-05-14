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
            unique: true,
        },
        password: String,
        rootDirId: {
            type: Schema.Types.ObjectId,
            ref: 'Directory',
            alias: 'rootDir',
        },
        picture: {
            type: String,
            default: '',
        },
        authProvider: {
            type: String,
            enum: ['google', 'email', 'facebook', 'github'],
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'manager'],
            default: 'user',
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        maxStorageInBytes: {
            type: Number,
            required: true,
            default: 1024 ** 3,
        },

        // age: {
        //   type: Number,
        // },
    },

    {
        // timestamps: true,
        // strict: 'throw', //by default -> true
        // // versionKey: false, // now versioning of document is not defined,
        // // collection: 'users',
        // virtuals: {
        //   isAdult: {
        //     get() {
        //       return this.age > 18;
        //     },
        //   },
        //   emailSplit: {
        //     get() {
        //       return this.email
        //         .split('@')
        //         .map((letter) => letter.split('.'))
        //         .flat();
        //     },
        //     set(value) {
        //       this.email = value;
        //     },
        //   },
        // },
        // toJSON: {
        //   virtuals: true,
        // },
        // toObject: {
        //   virtuals: true,
        // },
        // methods: {
        //   getDomainOfEmail() {
        //     return this.email.split('@')[1];
        //   },
        // },
    },
);
// userSchema.pre('createCollection', function (params) {
//   console.log(this);
// });
const User = model('User', userSchema);
export default User;
