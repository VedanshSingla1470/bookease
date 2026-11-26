import mongoose from "mongoose";
import Service from "../models/service.model.js";
import AppError from "../../../common/errors/AppError.js";

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid service ID.", 400);
  }
};

export const createService = async (
  organizationId,
  userId,
  data
) => {
  const service = await Service.create({
    ...data,
    organization: organizationId,
    createdBy: userId,
  });

  return service;
};

export const getOrganizationServices = async (
  organizationId,
  filters
) => {
  const {
    page,
    limit,
    status,
    category,
    search,
  } = filters;

  const query = {
    organization: organizationId,
  };

  if (status !== "ALL") {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.name = {
      $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Service.countDocuments(query),
  ]);

  return {
    services,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

export const getServiceById = async (
  organizationId,
  serviceId
) => {
  validateObjectId(serviceId);

  const service = await Service.findOne({
    _id: serviceId,
    organization: organizationId,
  });

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  return service;
};

export const updateService = async (
  organizationId,
  serviceId,
  data
) => {
  validateObjectId(serviceId);

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      organization: organizationId,
      status: "ACTIVE",
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!service) {
    throw new AppError(
      "Active service not found.",
      404
    );
  }

  return service;
};

export const archiveService = async (
  organizationId,
  serviceId
) => {
  validateObjectId(serviceId);

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      organization: organizationId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "INACTIVE",
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!service) {
    throw new AppError(
      "Active service not found.",
      404
    );
  }

  return service;
};