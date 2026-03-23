import jwt from 'jsonwebtoken';

export const loginAdmin = async (req, res) => {
  try {
    console.log('LOGIN BODY:', req.body);
    console.log('EXPECTED EMAIL:', process.env.ADMIN_SEED_EMAIL);
    console.log('EXPECTED PASSWORD:', process.env.ADMIN_SEED_PASSWORD);

    const { email, password } = req.body || {};

    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET || 'change_me';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};