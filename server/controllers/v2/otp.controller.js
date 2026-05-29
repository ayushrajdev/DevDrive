import V2OtpRepository from '../../repositories/mongodb/otp.repository';
import V2OtpService from '../../services/v2/otp.service';

class V2OtpController {
    constructor({optService}) {
        const otpRepository = new V2OtpRepository();
        const optService = new V2OtpService(otpRepository);
        this.optService = optService;
    }
    async sendOtpToEmail(req, res, next) {
        try {
            const email = req.body.email;
            await this.optService.sendOtpToEmail(email);
            return res.end();
        } catch (error) {
            next(error);
        }
    }
    async verifyOtp(req, res, next) {
        try {
            const otpSentByClient = req.body.otp;
            const email = req.body.email;

            const isCorrectOtp = await this.optService.verifyOtp({
                email,
                otpSentByClient,
            });

            if (!isCorrectOtp) {
                throw "otp sent by user is not valid!!";
            }

            return res
                .status(200)
                .json({ success: true, message: 'valid user' });
        } catch (error) {
            console.log(error.message);
        }
    }
}

export default V2OtpController;
