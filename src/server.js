import path from 'path';
import Express from 'express';
import compression from 'compression';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import Auth0Strategy from 'passport-auth0';

// Initialize authentication.
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
passport.use(new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: '/login/callback'
}, function(accessToken, refreshToken, extraParams, profile, done) {
    return done(null, profile);
}));

// Initialize the app.
const app = new Express();
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge: 3600000 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(compression());

// Authentication endpoints.
app.get('/login',
  passport.authenticate('auth0', { connection: process.env.AUTH0_CONNECTION }),
  function(req, res) { });
app.get('/login/callback',
  passport.authenticate('auth0'),
  function(req, res) { res.redirect('/'); });
app.get('/logout',
  function(req, res) {
    req.session.destroy();
    req.logout();
    res.redirect('/');
  });

// Force authentication for the next routes.
app.use(function(req, res, next) {
  (!req.isAuthenticated()) ? return res.redirect('/login') : next();
});

// Host the book.
app.use(Express.static(path.join(__dirname, '../content/_book')));

// Start the server.
const port = process.env.PORT || 4001;
app.listen(port, (error) => {
  (error) ? console.log(error) : console.log('Listening on http://localhost:' + port);
});
