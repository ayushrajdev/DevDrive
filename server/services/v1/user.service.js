export class UserService {
    
    constructor({ userRepository, sessionRepository, directoryRepositoy }) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.directoryRepositoy = directoryRepositoy;
    }

    createUser() {}
    getUser() {}
    getAllUsers() {}
    deleteUser() {}
    disableUser() {}
    recoverUser() {}
    
}
