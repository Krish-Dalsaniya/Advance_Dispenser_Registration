const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Code:', err.code);
  console.error('Stack:', err.stack);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Duplicate entry. A record with this value already exists.',
      detail: err.detail,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced record not found.',
      detail: err.detail,
    });
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    return res.status(400).json({
      error: `Required field missing: ${err.column}`,
      detail: err.detail,
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
