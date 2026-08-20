import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthLayout } from './AuthLayout';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { errorCleared, login } from '../../features/auth/authSlice';
import { AuthStackParamList } from '../../navigation/types';
import { spacing, typography, useColors } from '../../theme';
import { validateEmail, validateRequired } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const colors = useColors();
  const pending = useAppSelector((state) => state.auth.pending);
  const serverError = useAppSelector((state) => state.auth.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    return () => {
      dispatch(errorCleared());
    };
  }, [dispatch]);

  const errors = useMemo(
    () => ({
      email: validateEmail(email),
      password: validateRequired(password, 'Password'),
    }),
    [email, password],
  );

  const canSubmit = !errors.email && !errors.password && !pending;

  const submit = useCallback(() => {
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    dispatch(login({ email: email.trim(), password }));
  }, [canSubmit, dispatch, email, password]);

  return (
    <AuthLayout
      eyebrow="Momentum"
      title="Welcome back"
      subtitle="Sign in to pick up exactly where you left off.">
      {serverError ? (
        <Banner message={serverError} onDismiss={() => dispatch(errorCleared())} />
      ) : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setTouched((state) => ({ ...state, email: true }))}
        error={touched.email ? errors.email : null}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        onBlur={() => setTouched((state) => ({ ...state, password: true }))}
        error={touched.password ? errors.password : null}
        placeholder="Your password"
        autoCapitalize="none"
        secureToggle
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button
        label={pending ? 'Signing in' : 'Sign in'}
        onPress={submit}
        loading={pending}
        disabled={!canSubmit}
        style={styles.submit}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>New here?</Text>
        <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
          <Text style={[styles.footerLink, { color: colors.accent }]}>Create an account</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('Server')} hitSlop={8} style={styles.serverRow}>
        <Text style={[styles.serverLink, { color: colors.textFaint }]}>Change server address</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: spacing(2),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
  },
  footerText: {
    ...typography.caption,
  },
  footerLink: {
    ...typography.caption,
  },
  serverRow: {
    alignItems: 'center',
  },
  serverLink: {
    ...typography.caption,
    textDecorationLine: 'underline',
  },
});
