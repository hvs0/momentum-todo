import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { getApiBaseUrl, pingServer, setApiBaseUrl } from '../api/client';
import { DEFAULT_API_BASE_URL } from '../config';
import { AuthStackParamList } from '../navigation/types';
import { clearServerUrl, saveServerUrl } from '../storage/serverUrl';
import { radius, spacing, typography, useColors } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Server'>;

export function ServerScreen({ navigation }: Props) {
  const colors = useColors();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const test = async () => {
    setTesting(true);
    setResult(null);

    const outcome = await pingServer(url);
    setResult(outcome);
    setTesting(false);
  };

  const save = async () => {
    const stored = await saveServerUrl(url);
    setApiBaseUrl(stored);
    setUrl(stored);
    navigation.goBack();
  };

  const reset = async () => {
    await clearServerUrl();
    setApiBaseUrl(DEFAULT_API_BASE_URL);
    setUrl(DEFAULT_API_BASE_URL);
    setResult(null);
  };

  return (
    <Screen>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.back, { color: colors.textMuted }]}>Back</Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>Server</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: colors.textMuted }]}>
          Point the app at whichever backend you are running. The address is remembered on this
          device.
        </Text>

        {result ? (
          <Banner
            message={result.message}
            tone={result.ok ? 'info' : 'error'}
            onDismiss={() => setResult(null)}
          />
        ) : null}

        <TextField
          label="API address"
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.5:4000/api"
          hint="Host and port are enough, /api is added for you"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Button
          label={testing ? 'Testing' : 'Test connection'}
          onPress={test}
          loading={testing}
          variant="ghost"
        />

        <Button label="Save and use this server" onPress={save} disabled={testing} />

        <Pressable onPress={reset} hitSlop={8} style={styles.resetRow}>
          <Text style={[styles.reset, { color: colors.textMuted }]}>
            Reset to default ({DEFAULT_API_BASE_URL})
          </Text>
        </Pressable>

        <View style={[styles.tips, { borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.textFaint }]}>COMMON ADDRESSES</Text>
          <Text style={[styles.tip, { color: colors.textMuted }]}>
            Android emulator on the same machine: http://10.0.2.2:4000
          </Text>
          <Text style={[styles.tip, { color: colors.textMuted }]}>
            Phone on the same Wi-Fi: http://YOUR-LAPTOP-IP:4000
          </Text>
          <Text style={[styles.tip, { color: colors.textMuted }]}>
            Hosted backend: https://your-app.onrender.com
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(4),
    borderBottomWidth: 1,
  },
  back: {
    ...typography.body,
    width: 64,
  },
  topTitle: {
    ...typography.heading,
  },
  topSpacer: {
    width: 64,
  },
  content: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(6),
    paddingBottom: spacing(14),
    gap: spacing(5),
  },
  intro: {
    ...typography.body,
  },
  resetRow: {
    alignItems: 'center',
  },
  reset: {
    ...typography.caption,
  },
  tips: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(2),
  },
  tipsTitle: {
    ...typography.micro,
    marginBottom: spacing(1),
  },
  tip: {
    ...typography.caption,
  },
});
