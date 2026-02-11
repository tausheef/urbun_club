// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        proxy: true, // ✅ CRITICAL: This tells Passport to trust the proxy (Render uses proxies)
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('🔐 Google OAuth Profile:', {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName
          });

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, return user
            console.log('✅ Existing user found:', user.email);
            return done(null, user);
          }

          // Check if user exists with this email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // User exists with email, link Google account
            console.log('🔗 Linking Google account to existing user:', user.email);
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value;
            await user.save();
            return done(null, user);
          }

          // Create new user
          console.log('➕ Creating new user from Google profile');
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0]?.value,
            role: "user", // Google users are always regular users
          });

          console.log('✅ New user created:', user.email);
          return done(null, user);
        } catch (error) {
          console.error("❌ Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};