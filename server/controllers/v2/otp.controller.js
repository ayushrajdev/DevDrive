import V2OtpRepository from '../../repositories/mongodb/otp.repository.js';
import V2OtpService from '../../services/v2/otp.service.js';

class V2OtpController {
    constructor({ otpService } = {}) {
        const repository = new V2OtpRepository();
        this.otpService = otpService ?? new V2OtpService({ otpRepository: repository });
    }
    sendOtpToEmail = async (req, res, next) => {
        try {
            const email = req.body.email;
            await this.otpService.sendOtpToEmail(email);
            return res.status(200).json({ success: true, message: 'OTP sent' });
        } catch (error) {
            next(error);
        }
    };

    verifyOtp = async (req, res, next) => {
        try {
            const otpSentByClient = req.body.otp;
            const email = req.body.email;

            const isCorrectOtp = await this.otpService.verifyOtp({
                email,
                otpSentByClient,
            });

            if (!isCorrectOtp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP',
                });
            }

            return res
                .status(200)
                .json({ success: true, message: 'valid user' });
        } catch (error) {
            next(error);
        }
    };
}

export default V2OtpController;
