import express from 'express';
import V2PaymentController from '../../controllers/v2/payment.controller.js';

const router = express.Router();

const paymentController = new V2PaymentController();

router
    .route('/subscriptions')
    .post(paymentController.createSubscription);

export default router;
