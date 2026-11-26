import mongoose from "mongoose";

import Staff from "../models/staff.model.js";
import User from "../../users/models/user.model.js";
import Membership from "../../memberships/models/membership.model.js";

import AppError from "../../../common/errors/AppError.js";

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid staff ID.", 400);
  }
};

export const createStaff = async (
  organizationId,
  createdBy,
  data
) => {
  const user = await User.findOne({
    email: data.email,
    status: "ACTIVE",
  }).select("_id");

  if (!user) {
    throw new AppError(
      "No active BookEase user exists with this email address.",
      404
    );
  }

  const existingMembership = await Membership.findOne({
    organization: organizationId,
    user: user._id,
  });

  if (existingMembership) {
    throw new AppError(
      "This user already has a membership in the organization.",
      409
    );
  }

  const session = await mongoose.startSession();

  try {
    let createdStaff;

    await session.withTransaction(async () => {
      await Membership.create(
        [
          {
            organization: organizationId,
            user: user._id,
            role: "STAFF",
            status: "ACTIVE",
            joinedAt: new Date(),
          },
        ],
        { session }
      );

      const [staff] = await Staff.create(
        [
          {
            organization: organizationId,
            user: user._id,
            jobTitle: data.jobTitle,
            bio: data.bio,
            specialties: data.specialties,
            calendarColor: data.calendarColor,
            createdBy,
          },
        ],
        { session }
      );

      createdStaff = staff;
    });

    return await Staff.findById(createdStaff._id)
      .populate("user", "firstName lastName email");
  } finally {
    await session.endSession();
  }
};


export const getOrganizationStaff = async (
  organizationId,
  filters
) => {
  const { page, limit, status, search } = filters;

  const match = {
    organization: new mongoose.Types.ObjectId(organizationId),
  };

  if (status !== "ALL") {
    match.status = status;
  }

  const pipeline = [
    {
      $match: match,
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
  ];

  if (search) {
    const escapedSearch = search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    pipeline.push({
      $match: {
        $or: [
          {
            "user.firstName": {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            "user.lastName": {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            "user.email": {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            jobTitle: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
        ],
      },
    });
  }

  pipeline.push(
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
        ],
        data: [
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              organization: 1,
              jobTitle: 1,
              bio: 1,
              specialties: 1,
              calendarColor: 1,
              status: 1,
              createdBy: 1,
              createdAt: 1,
              updatedAt: 1,
              user: {
                _id: "$user._id",
                firstName: "$user.firstName",
                lastName: "$user.lastName",
                email: "$user.email",
              },
            },
          },
        ],
      },
    }
  );

  const [result] = await Staff.aggregate(pipeline);

  const total = result?.metadata[0]?.total ?? 0;

  return {
    staff: result?.data ?? [],
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

export const getStaffById = async (
  organizationId,
  staffId
) => {
  validateObjectId(staffId);

  const staff = await Staff.findOne({
    _id: staffId,
    organization: organizationId,
  }).populate("user", "firstName lastName email");

  if (!staff) {
    throw new AppError("Staff member not found.", 404);
  }

  return staff;
};

export const updateStaff = async (
  organizationId,
  staffId,
  data
) => {
  validateObjectId(staffId);

  const staff = await Staff.findOneAndUpdate(
    {
      _id: staffId,
      organization: organizationId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("user", "firstName lastName email");

  if (!staff) {
    throw new AppError("Staff member not found.", 404);
  }

  return staff;
};

export const updateStaffStatus = async (
  organizationId,
  staffId,
  status
) => {
  validateObjectId(staffId);

  const session = await mongoose.startSession();

  try {
    let updatedStaff;

    await session.withTransaction(async () => {
      const staff = await Staff.findOne({
        _id: staffId,
        organization: organizationId,
      }).session(session);

      if (!staff) {
        throw new AppError("Staff member not found.", 404);
      }

      const membership = await Membership.findOne({
        organization: organizationId,
        user: staff.user,
        role: "STAFF",
      }).session(session);

      if (!membership) {
        throw new AppError(
          "Staff membership not found.",
          404
        );
      }

      staff.status = status;
      await staff.save({ session });

      membership.status =
        status === "ACTIVE" ? "ACTIVE" : "SUSPENDED";

      await membership.save({ session });

      updatedStaff = staff;
    });

    return await Staff.findById(updatedStaff._id)
      .populate("user", "firstName lastName email");
  } finally {
    await session.endSession();
  }
};