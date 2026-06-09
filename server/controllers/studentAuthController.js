import passport from 'passport';

export const googleAuth = passport.authenticate('google', {
  session: false,
  scope: ['profile', 'email'],
});

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, data, info) => {
    if (err) return next(err);
    if (!data) {
      return res.redirect(
        `/login?error=${encodeURIComponent(info?.message || 'Authentication failed')}`
      );
    }
    res.cookie('ns_student_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    return res.redirect(`${frontendUrl}/dashboard?token=${data.token}`);
  })(req, res, next);
};

export const githubAuth = passport.authenticate('github', {
  session: false,
  scope: ['user:email'],
});

export const githubCallback = (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, data, info) => {
    if (err) return next(err);
    if (!data) {
      return res.redirect(
        `/login?error=${encodeURIComponent(info?.message || 'Authentication failed')}`
      );
    }
    res.cookie('ns_student_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    return res.redirect(`${frontendUrl}/dashboard?token=${data.token}`);
  })(req, res, next);
};

export const getMe = (req, res) => {
  if (!req.studentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.studentUser });
};

export const logout = (req, res) => {
  res.clearCookie('ns_student_token');
  return res.json({ ok: true });
};
