import jwt from 'jsonwebtoken';

export function validateGame(req, res, next) {
  const token = req.body.gameToken || req.query.gameToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Missing game token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.gameSession = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired game token' });
  }
}
