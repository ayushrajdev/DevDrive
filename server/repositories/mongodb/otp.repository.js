import Otp from '../../models/otp.model';

class V2OtpRepository {
    async upsertOpt({ otp, email }) {
        await Otp.findOneAndUpdate(
            {
                email,
            },
            {
                otp,
            },
            {
                upsert: true,
                new: true,
            },
        );

        return true;
    }

    async getOtp(email) {
        const otp = Otp.findOne({
            email,
        }).lean();
        return otp 
    }
}
export default V2OtpRepository;
