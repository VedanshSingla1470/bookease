
import membershipService from "../services/membership.service.js";

const getMembers = async (req, res, next) => {
  try {
    const members = await membershipService.getOrganizationMembers(
      req.params.organizationId
    );

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const membership = await membershipService.updateMemberRole(
      req.params.organizationId,
      req.params.membershipId,
      req.membership.role,
      req.body.role
    );

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await membershipService.removeMember(
      req.params.organizationId,
      req.params.membershipId,
      req.user.id,
      req.membership.role
    );

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMembers,
  updateMemberRole,
  removeMember,
};
