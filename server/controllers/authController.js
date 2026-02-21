const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { OAuth2Client } = require('google-auth-library')
const { supabase } = require('../config/db')
const emailService = require('../services/emailService')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

exports.signup = async (req, res) => {
  try {
    const { email, displayName, password } = req.body

    // Check if user exists using Supabase
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('college_email', email)
      .limit(1)

    if (checkError) {
      console.error('Supabase check error:', checkError)
      return res.status(500).json({ message: 'Database error' })
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Generate verification token
    const verificationToken = uuidv4()

    // Create user using Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        college_email: email,
        display_name: displayName,
        password_hash: passwordHash,
        verification_token: verificationToken,
        is_verified: false
      })
      .select('user_id, college_email, display_name, is_verified')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return res.status(500).json({ message: 'Registration failed' })
    }

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken)

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        userId: newUser.user_id,
        collegeEmail: newUser.college_email,
        displayName: newUser.display_name,
        isVerified: newUser.is_verified,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user using Supabase
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('user_id, college_email, display_name, password_hash, is_verified')
      .eq('college_email', email)
      .limit(1)
      .single()

    if (fetchError || !users) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = users

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check if verified
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' })
    }

    // Update last login using Supabase
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', user.user_id)

    // Generate token
    const token = generateToken(user.user_id)

    res.json({
      token,
      user: {
        userId: user.user_id,
        collegeEmail: user.college_email,
        displayName: user.display_name,
        isVerified: user.is_verified,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body

    // Update user verification status using Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_verified: true, 
        verification_token: null 
      })
      .eq('verification_token', token)
      .select('user_id')
      .single()

    if (error || !data) {
      return res.status(400).json({ message: 'Invalid or expired verification token' })
    }

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verification error:', error)
    res.status(500).json({ message: 'Verification failed' })
  }
}

exports.getMe = async (req, res) => {
  try {
    // User is already attached by authMiddleware
    // Fetch fresh data from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, college_email, display_name, username, is_verified, profile_picture')
      .eq('user_id', req.user.user_id)
      .single()

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        userId: user.user_id,
        collegeEmail: user.college_email,
        displayName: user.display_name,
        username: user.username,
        isVerified: user.is_verified,
        profilePicture: user.profile_picture,
      },
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ message: 'Failed to fetch user' })
  }
}

// Helper function to check if email domain is allowed
const isEmailDomainAllowed = (email) => {
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
    ? process.env.ALLOWED_EMAIL_DOMAINS.split(',').map(d => d.trim().toLowerCase())
    : ['@gmail.com'] // Default to gmail.com if not configured

  const emailDomain = '@' + email.split('@')[1]?.toLowerCase()
  return allowedDomains.some(domain => emailDomain === domain || emailDomain.endsWith(domain))
}

// Google OAuth authentication
exports.googleAuth = async (req, res) => {
  try {
    const { credential, isSignup } = req.body

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' })
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const email = payload.email
    const name = payload.name
    const googleId = payload.sub
    const profilePicture = payload.picture || null

    // Check if email domain is allowed
    if (!isEmailDomainAllowed(email)) {
      return res.status(400).json({ 
        message: 'invalid mail id'
      })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id, college_email, display_name, username, google_id, profile_picture')
      .eq('college_email', email)
      .limit(1)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Supabase check error:', checkError)
      return res.status(500).json({ message: 'Database error' })
    }

    // If this is a signup attempt and user already exists, return isExistingUser flag
    // This check must come BEFORE any login logic to prevent auto-login during signup
    if (isSignup && existingUser && existingUser.user_id) {
      return res.json({
        isExistingUser: true,
        message: 'Account already exists. Please log in instead.',
      })
    }

    // If user exists and has username, log them in directly
    if (existingUser && existingUser.username) {
      // Update last login and user info
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          google_id: googleId,
          display_name: name,
          profile_picture: profilePicture
        })
        .eq('user_id', existingUser.user_id)

      const token = generateToken(existingUser.user_id)

      return res.json({
        token,
        user: {
          userId: existingUser.user_id,
          collegeEmail: existingUser.college_email,
          displayName: name,
          username: existingUser.username,
          isVerified: true,
          profilePicture: profilePicture || existingUser.profile_picture,
        },
        needsUsername: false,
      })
    }

    // User exists but no username - needs to set username
    if (existingUser) {
      // Update user info
      await supabase
        .from('users')
        .update({
          google_id: googleId,
          display_name: name,
          is_verified: true, // Mark as verified since Google OAuth is sufficient
          profile_picture: profilePicture
        })
        .eq('user_id', existingUser.user_id)

      const token = generateToken(existingUser.user_id)

      return res.json({
        token,
        user: {
          userId: existingUser.user_id,
          collegeEmail: existingUser.college_email,
          displayName: name,
          username: null,
          isVerified: true,
          profilePicture: profilePicture || existingUser.profile_picture,
        },
        needsUsername: true,
      })
    }

    // New user - create account
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        college_email: email,
        display_name: name,
        google_id: googleId,
        is_verified: true, // Verified via Google OAuth
        profile_picture: profilePicture
      })
      .select('user_id, college_email, display_name, profile_picture')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ message: 'Registration failed' })
    }

    // Generate token for new user
    const token = generateToken(newUser.user_id)

    return res.json({
      token,
      user: {
        userId: newUser.user_id,
        collegeEmail: newUser.college_email,
        displayName: newUser.display_name,
        username: null,
        isVerified: true,
        profilePicture: newUser.profile_picture,
      },
      needsUsername: true,
    })
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(500).json({ message: 'Authentication failed' })
  }
}


// Set username
exports.setUsername = async (req, res) => {
  try {
    const { userId, username } = req.body

    if (!userId || !username) {
      return res.status(400).json({ message: 'User ID and username are required' })
    }

    // Validate username format (alphanumeric, underscore, 3-20 chars)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ 
        message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
      })
    }

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('username', username)
      .limit(1)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check error:', checkError)
      return res.status(500).json({ message: 'Database error' })
    }

    if (existingUser && existingUser.user_id !== userId) {
      return res.status(400).json({ message: 'Username is already taken' })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update username
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ username })
      .eq('user_id', userId)
      .select('user_id, college_email, display_name, username, is_verified, profile_picture')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return res.status(500).json({ message: 'Failed to set username' })
    }

    // Generate token and log user in
    const token = generateToken(updatedUser.user_id)

    res.json({
      message: 'Username set successfully',
      token,
      user: {
        userId: updatedUser.user_id,
        collegeEmail: updatedUser.college_email,
        displayName: updatedUser.display_name,
        username: updatedUser.username,
        isVerified: updatedUser.is_verified,
        profilePicture: updatedUser.profile_picture,
      },
    })
  } catch (error) {
    console.error('Set username error:', error)
    res.status(500).json({ message: 'Failed to set username' })
  }
}
