import Session from "../models/session.model.js";

export async function checkSessionValid(req, res, next) {
  const { sessionId } = req.signedCookies;
  if (!sessionId) {
    return res.json({ meassage: "please login!!!!!" });
  }
  const session = await Session.findById(sessionId);

  if (!session) {
    res.clearCookie("sessionId");
    return res.json({ meassage: "session expired, please login" });
  }

//   const loggedInDevices = await Session.find({ userId: session.userId });

//   if (loggedInDevices.length >  2) {
//     console.log(loggedInDevices.length);
//     const firstDevice = loggedInDevices[0];
//     const logoutFirstDevice = await Session.deleteOne({ _id: firstDevice.id });
//     console.log("logged out first device", logoutFirstDevice);
//   }
  req.session = session;
  next();
}
