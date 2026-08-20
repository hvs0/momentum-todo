import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { configureApiClient } from './api/client';
import { store } from './app/store';
import { restoreSession, sessionExpired, tokensRefreshed } from './features/auth/authSlice';
import { RootNavigator } from './navigation/RootNavigator';
import { clearSession, saveSession } from './storage/session';
import { ThemeProvider } from './theme';

configureApiClient({
  getTokens: () => {
    const { accessToken, refreshToken } = store.getState().auth;
    return { accessToken, refreshToken };
  },
  onTokensRefreshed: (tokens) => {
    store.dispatch(tokensRefreshed(tokens));

    const { user } = store.getState().auth;
    if (user) {
      saveSession({ user, ...tokens }).catch(() => undefined);
    }
  },
  onSessionExpired: () => {
    store.dispatch(sessionExpired());
    clearSession().catch(() => undefined);
  },
});

function Bootstrapper() {
  useEffect(() => {
    store.dispatch(restoreSession());
  }, []);

  return <RootNavigator />;
}

export default function AppRoot() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Bootstrapper />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}
