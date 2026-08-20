import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { issueTokens, verifyRefreshToken } from '../utils/jwt';
import { LoginInput, RegisterInput } from '../validators/auth.schema';

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with that email already exists');
  }

  const user = await User.create({ name, email, password });
  const tokens = issueTokens({ sub: user._id.toString(), email: user.email });

  const withTokens = await User.findById(user._id).select('+refreshTokens');
  await withTokens?.addRefreshToken(tokens.refreshToken);

  res.status(201).json({ success: true, data: { user: user.toJSON(), ...tokens } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  const tokens = issueTokens({ sub: user._id.toString(), email: user.email });
  await user.addRefreshToken(tokens.refreshToken);

  res.json({ success: true, data: { user: user.toJSON(), ...tokens } });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token is invalid or has expired');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user) {
    throw ApiError.unauthorized('Account no longer exists');
  }

  const known = user.hasRefreshToken(refreshToken);
  if (!known) {
    throw ApiError.unauthorized('Session has been revoked');
  }

  await user.removeRefreshToken(refreshToken);

  const tokens = issueTokens({ sub: user._id.toString(), email: user.email });
  await user.addRefreshToken(tokens.refreshToken);

  res.json({ success: true, data: { user: user.toJSON(), ...tokens } });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };

  const user = await User.findById(req.user?.sub).select('+refreshTokens');
  if (user) {
    await user.removeRefreshToken(refreshToken);
  }

  res.json({ success: true, data: { message: 'Signed out' } });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user?.sub);
  if (!user) {
    throw ApiError.notFound('Account no longer exists');
  }

  res.json({ success: true, data: { user: user.toJSON() } });
}
