import type { Request, Response, NextFunction } from 'express';
import type { IPaymentService } from './payment.service.js';
import type { PaymentProvider, PaymentType, BillingCycle } from '../../shared/types/index.js';

export class PaymentController {
    constructor(private readonly paymentService: IPaymentService) {}

    createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { planId, paymentType, billingCycle, provider } = req.body as {
                planId: string;
                paymentType: PaymentType;
                billingCycle: BillingCycle;
                provider: PaymentProvider;
            };

            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }

            if (provider !== 'razorpay' && provider !== 'stripe') {
                res.status(400).json({ success: false, message: 'Provider must be razorpay or stripe' });
                return;
            }

            const payment: any = await this.paymentService.createSubscription({
                planId,
                paymentType,
                billingCycle,
                provider,
                userInfo: {
                    _id: String(user._id),
                    email: user.email,
                    name: user.name,
                },
            });

            const responseObj = {
                provider,
                flow: provider === 'razorpay' ? 'popup' : 'redirect',
                data: {} as Record<string, any>,
            };

            if (provider === 'razorpay') {
                if (paymentType === 'one_time') {
                    responseObj.data = {
                        orderId: payment.id,
                        userInfo: payment.notes,
                        type: 'one_time',
                        url: '',
                    };
                } else {
                    responseObj.data = {
                        subscriptionId: payment.id,
                        userInfo: payment.notes,
                        type: 'subscription',
                        url: payment.short_url,
                    };
                }
            } else if (provider === 'stripe') {
                responseObj.data = {
                    checkoutSessionId: payment.id,
                    userInfo: payment.metadata,
                    userId: payment.client_reference_id,
                    url: payment.url,
                    type: paymentType,
                };
            }

            res.status(200).json({
                success: true,
                ...responseObj,
            });
        } catch (error) {
            next(error);
        }
    };

    getPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const plans = await this.paymentService.getAllPlans();
            res.status(200).json({ success: true, data: plans });
        } catch (error) {
            next(error);
        }
    };

    getUserSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = String(req.user!._id);
            const subscription = await this.paymentService.getUserSubscription(userId);
            res.status(200).json({ success: true, data: subscription });
        } catch (error) {
            next(error);
        }
    };
}
