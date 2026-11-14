const User = require('../models/user');

const verifyAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
        }
        if (user.isBlocked) {
            return res.status(403).json({ message: 'Account is blocked.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authorization check failed.' });
    }
};

module.exports = verifyAdmin;