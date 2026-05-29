import User from '../../models/user.model.js';

export default class MongoUserRepository {
    createUser = async ({ _id, name, email, password, rootDirId }) => {
        const user = await User.insertOne({
            _id: oidUser,
            name,
            email,
            password: hashedPassword,
            rootDirId: oidDirectory,
        });
        return user;
    };

    findUserByEmail = async ({ email }) => {
        const user = User.findOne({
            email,
        }).lean();
        return user;
    };

    findUserById = async ({ id }) => {
        const user = User.findById(id).lean();
        return user;
    };

    getAllUsers = async () => {
        const users = User.find().lean();
        return users;
    };

    deleteUser = async ({ id, data }) => {
        const deletedUser = User.findByIdAndDelete(id, data);
        return deletedUser;
    };

    disableUser = async ({ id }) => {
        const deletedUser = User.findByIdAndUpdate(id, {
            $set: {
                deleted: true,
            },
        });
        return deletedUser;
    };

    recoverUser = async ({ id }) => {
        const user = User.findByIdAndUpdate(id, {
            $set: {
                deleted: true,
            },
        });
        return user;
    };
}
