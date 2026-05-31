import MongoSubscriptionRepository from '../../repositories/mongodb/subscription.repository.js';
import V2PaymentService from '../../services/v2/payment.service.js';

export default class V2PaymentController {
    constructor() {
        this.paymentService = new V2PaymentService();
        this.subscriptionRepository = new MongoSubscriptionRepository();
    }
    createSubscription = async (req, res, next) => {
        try {
            let { planId, paymentType, billingCycle, provider } = req.body;
            const userInfo = req.user;

            console.log({
                planId,
                paymentType,
                billingCycle,
                provider,
            });

            if (!(provider == 'razorpay' || provider == 'stripe')) {
                return res.end('no provider');
            }

            const payment = await this.paymentService.createSubscription({
                planId,
                paymentType,
                billingCycle,
                provider,
                userInfo,
            });

            // const subscription =
            //     await this.subscriptionRepository.createSubcription({
            //         billingCycle,
            //         paymentType,
            //         planId,
            //         provider,
            //         status: 'pending',
            //         userId: userInfo._id,
            //     });
            // console.log(subscription);

            var responseObj = {
                provider: '',
                flow: '',
                data: {},
            };

            switch (provider) {
                case 'razorpay':
                    responseObj.provider = 'razorpay';
                    responseObj.flow = 'popup';
                    switch (paymentType) {
                        case 'one_time':
                            responseObj.data = {
                                orderId: payment.id,
                                userInfo: payment.notes,
                                type: 'one_time',
                                url: '',
                            };
                            return res.json(responseObj);

                        case 'subscription':
                            responseObj.data = {
                                subscriptionId: payment.id,
                                userInfo: payment.notes,
                                type: 'subscription',
                                url: payment.short_url,
                            };
                            return res.json(responseObj);

                        default:
                            throw new Error('payment type do not match');
                    }

                case 'stripe':
                    responseObj.provider = 'stripe';
                    responseObj.flow = 'redirect';
                    switch (paymentType) {
                        case 'one_time':
                            responseObj.data = {
                                checkoutSessionId: payment.id,
                                userInfo: payment.metadata,
                                userId: payment.client_reference_id,
                                url: payment.url,
                                type: 'one_time',
                            };
                            return res.json(responseObj);
                        case 'subscription':
                            responseObj.data = {
                                checkoutSessionId: payment.id,
                                userInfo: payment.metadata,
                                userId: payment.client_reference_id,
                                url: payment.url,
                                type: 'subscription',
                            };
                            return res.json(responseObj);

                        default:
                            throw new Error('payment type do not match');
                    }
            }
        } catch (error) {
            next(error);
        }
    };
}
