import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthLayout } from './AuthLayout';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { TextField } from '../../components/TextField';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { errorCleared, register } from '../../features/auth/authSlice';
import { AuthStackParamList } from '../../navigation/types';
import { spacing, typography, useColors } from '../../theme';
import {
  passwordStrength,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const colors = useColors();
  const pending = useAppSelector((state) => state.auth.pending);
  const serverError = useAppSelector((state) => state.auth.error);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });

  useEffect(() => {
    return () => {
      dispatch(errorCleared());
    };
  }, [dispatch]);

  const errors = useMemo(
    () => ({
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: confirm === password ? null : 'Passwords do not match',
    }),
    [confirm, email, name, password],
  );

  const strength = useMemo(() => passwordStrength(password), [password]);

  const canSubmit =
    !errors.name && !errors.email && !errors.password && !errors.confirm && !pending;

  const submit = useCallback(() => {
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!canSubmit) return;

    dispatch(register({ name: name.trim(), email: email.trim(), password }));
  }, [canSubmit, dispatch, email, name, password]);

  const strengthColor =
    strength.score >= 0.8 ? colors.success : strength.score >= 0.5 ? colors.warning : colors.danger;

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create account"
      subtitle="One account keeps your tasks in sync everywhere.">
      {serverError ? (
        <Banner message={serverError} onDismiss={() => dispatch(errorCleared())} />
      ) : null}

      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched((state) => ({ ...state, name: true }))}
        error={touched.name ? errors.name : null}
        placeholder="Harsh Vardhan"
        autoCapitalize="words"
        returnKeyType="next"
      />

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
        returnKeyType="next"
      />

      <View style={styles.passwordBlock}>
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched((state) => ({ ...state, password: true }))}
          error={touched.password ? errors.password : null}
          hint="At least 8 characters with a letter and a number"
          placeholder="Choose a strong password"
          autoCapitalize="none"
          secureToggle
          returnKeyType="next"
        />

        {password.length > 0 ? (
          <View style={styles.strength}>
            <View style={styles.strengthBar}>
              <ProgressBar ratio={strength.score} height={4} color={strengthColor} />
            </View>
            <Text style={[styles.strengthLabel, { color: colors.textMuted }]}>
              {strength.label}
            </Text>
          </View>
        ) : null}
      </View>

      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        onBlur={() => setTouched((state) => ({ ...state, confirm: true }))}
        error={touched.confirm ? errors.confirm : null}
        placeholder="Type it once more"
        autoCapitalize="none"
        secureToggle
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button
        label={pending ? 'Creating account' : 'Create account'}
        onPress={submit}
        loading={pending}
        disabled={!canSubmit}
        style={styles.submit}
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Already registered?</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[styles.footerLink, { color: colors.accent }]}>Sign in instead</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  passwordBlock: {
    gap: spacing(2.5),
  },
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
  },
  strengthBar: {
    flex: 1,
  },
  strengthLabel: {
    ...typography.micro,
    minWidth: 72,
    textAlign: 'right',
  },
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
});
