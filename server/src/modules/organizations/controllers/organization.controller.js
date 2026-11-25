
import organizationService from "../services/organization.service.js";

const createOrganization = async (req, res, next) => {
  try {
    const result = await organizationService.createOrganization(
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrganizations = async (req, res, next) => {
  try {
    const organizations =
      await organizationService.getMyOrganizations(req.user.id);

    res.status(200).json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganization = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.organization,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const organization =
      await organizationService.updateOrganization(
        req.params.organizationId,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createOrganization,
  getMyOrganizations,
  getOrganization,
  updateOrganization,
};
