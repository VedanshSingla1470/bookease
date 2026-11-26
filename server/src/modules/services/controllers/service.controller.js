import {
  createService,
  getOrganizationServices,
  getServiceById,
  updateService,
  archiveService,
} from "../services/service.service.js";

export const createServiceController = async (req, res) => {
  const service = await createService(
    req.organization._id,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Service created successfully.",
    data: service,
  });
};

export const getServicesController = async (req, res) => {
  const result = await getOrganizationServices(
    req.organization._id,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    data: result.services,
    pagination: result.pagination,
  });
};

export const getServiceController = async (req, res) => {
  const service = await getServiceById(
    req.organization._id,
    req.params.serviceId
  );

  res.status(200).json({
    success: true,
    data: service,
  });
};

export const updateServiceController = async (req, res) => {
  const service = await updateService(
    req.organization._id,
    req.params.serviceId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Service updated successfully.",
    data: service,
  });
};

export const archiveServiceController = async (req, res) => {
  const service = await archiveService(
    req.organization._id,
    req.params.serviceId
  );

  res.status(200).json({
    success: true,
    message: "Service archived successfully.",
    data: service,
  });
};