module.exports = {
  success(res, data, status = 200) {
    res.status(status).json({ success: true, data });
  },

  error(res, err, status = 500) {
    res.status(status).json({
      success: false,
      message: err?.message || 'Server error',
    });
  },
};