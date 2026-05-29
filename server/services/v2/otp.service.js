import transporter from '../../config/nodemailer/nodemailer.config';

class V2OtpService {
    constructor({otpRepository}) {
        this.otpRepository = otpRepository;
    }
    async sendOtpToEmail(email) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const isSavedOtp = await this.otpRepository.upsertOtp({ otp, email });

        await transporter.sendMail({
            from: 'DevDrive <devdrive.unaux.com>',
            to: email,
            subject: 'Verification OTP',
            text: `Your OTP is ${otp}`,
        });
    }

    async verifyOtp({ email, otpSentByClient }) {
        const savedOtp = await this.otpRepository.getOtp(email);
        if (!(otpSentByClient === savedOtp.otp)) {
            return false;
        }
        return true
    }
}

export default V2OtpService;
