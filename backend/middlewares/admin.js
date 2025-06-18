const adminOnly = (req, res, next) => {
    console.log(req.user.role)
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

module.exports = adminOnly;
