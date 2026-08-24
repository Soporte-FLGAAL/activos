const success = (res, data, message = 'OK', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

const error = (res, message = 'Error', status = 500, details = null) => {
  const response = { success: false, message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

module.exports = { success, error };