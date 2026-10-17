import { RedisSessionRepository } from './modules/session/session.repository.js';
import { SessionService } from './modules/session/session.service.js';
import { MongoUserRepository } from './modules/user/user.repository.js';
import { UserService } from './modules/user/user.service.js';
import { UserController } from './modules/user/user.controller.js';
import { MongoOtpRepository } from './modules/otp/otp.repository.js';
import { OtpService } from './modules/otp/otp.service.js';
import { OtpController } from './modules/otp/otp.controller.js';
import { MongoDirectoryRepository } from './modules/directory/directory.repository.js';
import { DirectoryService } from './modules/directory/directory.service.js';
import { DirectoryController } from './modules/directory/directory.controller.js';
import { MongoFileRepository } from './modules/file/file.repository.js';
import { FileService } from './modules/file/file.service.js';
import { FileController } from './modules/file/file.controller.js';
import { MongoPlanRepository } from './modules/payment/plan.repository.js';
import { MongoSubscriptionRepository } from './modules/payment/subscription.repository.js';
import { PaymentService } from './modules/payment/payment.service.js';
import { PaymentController } from './modules/payment/payment.controller.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { RazorpayWebhookHandler } from './modules/webhook/razorpay.webhook.js';
import { StripeWebhookHandler } from './modules/webhook/stripe.webhook.js';
import { SessionMiddleware } from './middlewares/session.middleware.js';
import { AuthMiddleware } from './middlewares/auth.middleware.js';
import { getTransporter } from './config/nodemailer.config.js';

export class AppContainer {
    // Repositories
    public readonly sessionRepository: RedisSessionRepository;
    public readonly userRepository: MongoUserRepository;
    public readonly otpRepository: MongoOtpRepository;
    public readonly directoryRepository: MongoDirectoryRepository;
    public readonly fileRepository: MongoFileRepository;
    public readonly planRepository: MongoPlanRepository;
    public readonly subscriptionRepository: MongoSubscriptionRepository;

    // Services
    public readonly sessionService: SessionService;
    public readonly userService: UserService;
    public readonly otpService: OtpService;
    public readonly directoryService: DirectoryService;
    public readonly fileService: FileService;
    public readonly authService: AuthService;
    public readonly paymentService: PaymentService;

    // Middlewares
    public readonly sessionMiddleware: SessionMiddleware;
    public readonly authMiddleware: AuthMiddleware;

    // Controllers
    public readonly userController: UserController;
    public readonly otpController: OtpController;
    public readonly directoryController: DirectoryController;
    public readonly fileController: FileController;
    public readonly authController: AuthController;
    public readonly paymentController: PaymentController;

    // Webhooks
    public readonly razorpayWebhookHandler: RazorpayWebhookHandler;
    public readonly stripeWebhookHandler: StripeWebhookHandler;

    constructor() {
        // 1. Initialize Repositories
        this.sessionRepository = new RedisSessionRepository();
        this.userRepository = new MongoUserRepository();
        this.otpRepository = new MongoOtpRepository();
        this.directoryRepository = new MongoDirectoryRepository();
        this.fileRepository = new MongoFileRepository();
        this.planRepository = new MongoPlanRepository();
        this.subscriptionRepository = new MongoSubscriptionRepository();

        // 2. Initialize Services with injected Repositories
        this.sessionService = new SessionService(this.sessionRepository);
        this.userService = new UserService(this.userRepository, this.sessionService);
        this.otpService = new OtpService(this.otpRepository, getTransporter());
        this.directoryService = new DirectoryService(this.directoryRepository, this.fileRepository);
        this.fileService = new FileService(this.fileRepository, this.directoryRepository);
        this.authService = new AuthService(this.userRepository, this.sessionService, this.directoryService);
        this.paymentService = new PaymentService(this.planRepository, this.subscriptionRepository);

        // 3. Initialize Middlewares with injected dependencies
        this.sessionMiddleware = new SessionMiddleware(this.sessionService);
        this.authMiddleware = new AuthMiddleware(this.userRepository);

        // 4. Initialize Controllers with injected Services
        this.userController = new UserController(this.userService);
        this.otpController = new OtpController(this.otpService);
        this.directoryController = new DirectoryController(this.directoryService);
        this.fileController = new FileController(this.fileService);
        this.authController = new AuthController(this.authService);
        this.paymentController = new PaymentController(this.paymentService);

        // 5. Initialize Webhooks
        this.razorpayWebhookHandler = new RazorpayWebhookHandler(this.subscriptionRepository);
        this.stripeWebhookHandler = new StripeWebhookHandler(this.subscriptionRepository);
    }
}
