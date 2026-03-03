import Session from "../models/session.model.js";

const getAllSessions =async (req, res, next) => {
  try {
    const sessionUsers = await Session.find();
    return res.json({sessionUsers});
  } catch (error) {
    console.log(error.message);
  }
}

export const adminController = {
    getAllSessions
}