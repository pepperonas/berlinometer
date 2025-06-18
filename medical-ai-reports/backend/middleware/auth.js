const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Keine Berechtigung' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.practiceId = decoded.practiceId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Ungültiger Token' });
  }
};
