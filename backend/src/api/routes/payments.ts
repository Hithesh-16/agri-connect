import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import {
  createOrderSchema,
  verifyPaymentSchema,
  escrowReleaseSchema,
  refundSchema,
  addMoneySchema,
} from '../../validations/payments';
import * as paymentController from '../controllers/payment-controller';

const router = Router();
const E = ENDPOINTS.PAYMENTS;

router.post(E.CREATE_ORDER, authenticate, validate(createOrderSchema), asyncHandler(paymentController.createOrder));
router.post(E.VERIFY, authenticate, validate(verifyPaymentSchema), asyncHandler(paymentController.verify));
router.post(E.ESCROW_RELEASE, authenticate, validate(escrowReleaseSchema), asyncHandler(paymentController.releaseEscrow));
router.post(E.REFUND, authenticate, validate(refundSchema), asyncHandler(paymentController.refund));
router.get(E.HISTORY, authenticate, asyncHandler(paymentController.history));
router.get(E.WALLET, authenticate, asyncHandler(paymentController.getWallet));
router.post(E.WALLET_ADD, authenticate, validate(addMoneySchema), asyncHandler(paymentController.addMoney));
router.get(E.EARNINGS, authenticate, asyncHandler(paymentController.getEarnings));
router.post(E.WEBHOOK, asyncHandler(paymentController.webhook));
router.get(E.INVOICE, authenticate, asyncHandler(paymentController.getInvoice));

export default router;
