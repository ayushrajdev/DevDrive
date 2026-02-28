import Session from "../models/session.model.js";

export async function checkSessionValid(req, res, next) {
  const { sessionId } = req.signedCookies;
  console.log(req.signedCookies)
  if (!sessionId) {
    return res.json({ meassage: "please login!!!!!" });
  }
  const session = await Session.findById(sessionId)
  console.log(session)
  if(!session){
    res.clearCookie("sessionId")
    return res.json({meassage:"session expired, please login"})
  }
  req.session = session
  next()
}
