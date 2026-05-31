class V2NodemailerService {
    async sendOtpToEmail(recieverEmail) {
        try {
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const savedOtpInDb = await Otp.findOneAndUpdate(
                {
                    email: recieverEmail,
                },
                {   
                    otp,
                    // createdAt: new Date(),
                },
                {
                    upsert: true,
                    new: true,
                },
            );
            await transporter.sendMail({
                from: 'DevDrive <devdrive.unaux.com>',
                to: recieverEmail,
                subject: 'Verification OTP',
                text: `Your OTP is ${otp}`,
            });
            console.log('Email sent to ', recieverEmail);
            return {
                success: true,
                error: null,
                message: 'Otp sent to the user',
            };
        } catch (error) {
            console.log(error.message);
            return {
                success: false,
                error: error.message,
                message: 'Otp not sent to user',
            };
        }
    }
}
