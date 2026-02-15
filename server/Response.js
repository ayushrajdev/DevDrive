export function errorResponse(
  res,
  message = "server error from errorresponse",
  status = 400,
) {
  res.status(status).json({ message });
}
export function successResponse(res, message = "success", status = 200) {
  res.status(status).json({ message });
}
