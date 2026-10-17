import { Router } from 'express';
import type { PaymentController } from './payment.controller.js';
import type { SessionMiddleware } from '../../middlewares/session.middleware.js';
import type { AuthMiddleware } from '../../middlewares/auth.middleware.js';

export function createPaymentRouter(
    paymentController: PaymentController,
    sessionMiddleware: SessionMiddleware,
    authMiddleware: AuthMiddleware,
): Router {
    const router = Router();
    const requireAuth = [sessionMiddleware.checkSession, authMiddleware.checkUser];

    // Public view of available plans
    router.get('/plans', paymentController.getPlans);

    // Authenticated payment actions
    router.post('/subscriptions', ...requireAuth, paymentController.createSubscription);
    router.get('/my-subscription', ...requireAuth, paymentController.getUserSubscription);

    return router;
}
