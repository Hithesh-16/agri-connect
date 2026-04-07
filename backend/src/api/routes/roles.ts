import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, requireRole } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { assignRoleSchema } from '../../validations/roles';
import * as roleController from '../controllers/role-controller';

const router = Router();
const E = ENDPOINTS.RBAC;

router.get(E.LIST, authenticate, requirePermission('roles', 'read'), asyncHandler(roleController.list));
router.get(E.PERMISSIONS, authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(roleController.getPermissions));
router.get(E.AUDIT_LOGS, authenticate, requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN'), asyncHandler(roleController.getAuditLogs));
router.get(E.DETAIL, authenticate, requirePermission('roles', 'read'), asyncHandler(roleController.detail));
router.post(E.ASSIGN_ROLE, authenticate, requirePermission('roles', 'manage'), validate(assignRoleSchema), asyncHandler(roleController.assignRole));
router.delete(E.REMOVE_ROLE, authenticate, requirePermission('roles', 'manage'), asyncHandler(roleController.removeRole));
router.get(E.USER_ROLES, authenticate, requirePermission('users', 'read'), asyncHandler(roleController.getUserRoles));

export default router;
