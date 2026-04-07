import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { createListingSchema, updateListingSchema, createInquirySchema } from '../../validations/listings';
import * as listingController from '../controllers/listing-controller';

const router = Router();
const E = ENDPOINTS.LISTINGS;

router.get(E.NEARBY, asyncHandler(listingController.nearby));
router.get(E.LIST, asyncHandler(listingController.list));
router.get(E.DETAIL, asyncHandler(listingController.getDetail));
router.post(E.CREATE, authenticate, validate(createListingSchema), asyncHandler(listingController.create));
router.patch(E.UPDATE, authenticate, validate(updateListingSchema), asyncHandler(listingController.update));
router.delete(E.DELETE, authenticate, asyncHandler(listingController.remove));
router.post(E.INQUIRIES, authenticate, validate(createInquirySchema), asyncHandler(listingController.createInquiry));

export default router;
