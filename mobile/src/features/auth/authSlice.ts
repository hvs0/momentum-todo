import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginRequest, logoutRequest, registerRequest } from '../../api/auth';
import { readErrorMessage } from '../../api/client';
import { clearSession, loadSession, saveSession } from '../../storage/session';
import { AuthSession, User } from '../../types';

export type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pending: boolean;
  error: string | null;
}

const initialState: AuthState = {
  status: 'booting',
  user: null,
  accessToken: null,
  refreshToken: null,
  pending: false,
  error: null,
};

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  return loadSession();
});

export const register = createAsyncThunk<
  AuthSession,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const session = await registerRequest(payload);
    await saveSession(session);
    return session;
  } catch (error) {
    return rejectWithValue(readErrorMessage(error, 'Could not create your account'));
  }
});

export const login = createAsyncThunk<
  AuthSession,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const session = await loginRequest(payload);
    await saveSession(session);
    return session;
  } catch (error) {
    return rejectWithValue(readErrorMessage(error, 'Could not sign you in'));
  }
});

export const logout = createAsyncThunk('auth/logout', async (_: void, { getState }) => {
  const state = getState() as { auth: AuthState };
  const token = state.auth.refreshToken;

  if (token) {
    try {
      await logoutRequest(token);
    } catch {
      // the local session is cleared either way
    }
  }

  await clearSession();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokensRefreshed(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    sessionExpired(state) {
      state.status = 'signedOut';
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = 'Your session expired. Please sign in again.';
    },
    errorCleared(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        const session = action.payload;

        if (session) {
          state.status = 'signedIn';
          state.user = session.user;
          state.accessToken = session.accessToken;
          state.refreshToken = session.refreshToken;
        } else {
          state.status = 'signedOut';
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'signedOut';
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'signedOut';
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null;
      });

    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.pending = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.pending = false;
          state.status = 'signedIn';
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.pending = false;
          state.error = action.payload ?? 'Something went wrong';
        });
    }
  },
});

export const { tokensRefreshed, sessionExpired, errorCleared } = authSlice.actions;
export default authSlice.reducer;
