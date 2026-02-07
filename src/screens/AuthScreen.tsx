import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors, fonts, gradients, radii, spacing } from '../theme';

export const AuthScreen = () => {
  const { signIn, signUp, isLoading } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('資訊不完整', '請輸入電子郵件和密碼以繼續。');
      return;
    }

    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (error) {
      Alert.alert('驗證失敗', '請檢查您的帳號密碼後重試。');
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.title}>Sara2 工作室</Text>
            <Text style={styles.subtitle}>
              創作短片電影故事，分享到 Instagram 限時動態。
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'signIn' ? '歡迎回來' : '建立您的工作室'}
            </Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>電子郵件</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>密碼</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <PrimaryButton
              label={
                isLoading
                  ? '連線中...'
                  : mode === 'signIn'
                    ? '登入'
                    : '建立帳號'
              }
              onPress={submit}
              disabled={isLoading}
            />
            <PrimaryButton
              label={mode === 'signIn' ? '新用戶？註冊帳號' : '已有帳號？登入'}
              onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
              variant="ghost"
            />
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>繼續即表示您同意應用程式使用條款。</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 32,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
