export const checkHealth = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hiring-portal-backend',
    message: "Running perfectly"
  });
};


