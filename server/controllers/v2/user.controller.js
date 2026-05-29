 class V2UserController {
    constructor() {
        const sessionRepository = new RedisSessionRepository();
        const userRepository = new MongoUserRepository();
        const directoryRepositoy = new MongoUserRepository();

        const userService = new UserService({
            sessionRepository,
            userRepository,
            directoryRepositoy,
        });
        this.userService = userService
    }
    async registerUser() {
        
    }
}
export default V2UserController