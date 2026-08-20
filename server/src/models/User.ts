import crypto from 'crypto';
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const MAX_SESSIONS = 5;

export interface RefreshTokenEntry {
  tokenHash: string;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  refreshTokens: RefreshTokenEntry[];
  comparePassword(candidate: string): Promise<boolean>;
  addRefreshToken(token: string): Promise<void>;
  hasRefreshToken(token: string): boolean;
  removeRefreshToken(token: string): Promise<void>;
}

function fingerprint(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.addRefreshToken = async function addRefreshToken(token: string) {
  this.refreshTokens.push({ tokenHash: fingerprint(token), createdAt: new Date() });

  if (this.refreshTokens.length > MAX_SESSIONS) {
    this.refreshTokens = this.refreshTokens.slice(-MAX_SESSIONS);
  }

  await this.save();
};

userSchema.methods.hasRefreshToken = function hasRefreshToken(token: string) {
  const hash = fingerprint(token);
  return this.refreshTokens.some((entry: RefreshTokenEntry) => entry.tokenHash === hash);
};

userSchema.methods.removeRefreshToken = async function removeRefreshToken(token: string) {
  const hash = fingerprint(token);
  this.refreshTokens = this.refreshTokens.filter(
    (entry: RefreshTokenEntry) => entry.tokenHash !== hash,
  );
  await this.save();
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
