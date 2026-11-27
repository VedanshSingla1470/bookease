

import {
  getCustomerNotifications,
  getOrganizationNotifications,
} from "../services/notification.service.js";

export async function getMyNotifications(req, res, next) {
  try {
    const result = await getCustomerNotifications(
      req.params.organizationId,
      req.user.id,
      req.validatedQuery
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationNotificationsController(
  req,
  res,
  next
) {
  try {
    const result = await getOrganizationNotifications(
      req.params.organizationId,
      req.validatedQuery
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
