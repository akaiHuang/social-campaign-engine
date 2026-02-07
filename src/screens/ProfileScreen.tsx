import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CreditBadge } from '../components/CreditBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { creditPacks } from '../constants/promptTemplates';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { instagramReady } from '../services/instagram';
import { colors, fonts, radii, spacing } from '../theme';
import { formatDate } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { credits, purchaseCredits } = useApp();

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>個人檔案</Text>
          <Text style={styles.subtitle}>管理帳號和點數。</Text>
        </View>
        <CreditBadge credits={credits} />
      </View>

      <SectionCard title="帳號">
        <View style={styles.row}>
          <Text style={styles.label}>電子郵件</Text>
          <Text style={styles.value}>{user?.email || 'demo@studio.app'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>加入日期</Text>
          <Text style={styles.value}>{formatDate(user?.createdAt || new Date().toISOString())}</Text>
        </View>
        <PrimaryButton label="登出" onPress={signOut} variant="ghost" />
      </SectionCard>

      <SectionCard title="點數" subtitle="購買更多以生成新影片">
        {creditPacks.map((pack) => (
          <View key={pack.id} style={styles.packRow}>
            <View>
              <Text style={styles.packTitle}>{pack.name}</Text>
              <Text style={styles.packSubtitle}>{pack.credits} 點</Text>
            </View>
            <PrimaryButton
              label={pack.priceLabel}
              onPress={() => {
                purchaseCredits(pack);
                Alert.alert('購買完成', `已新增 ${pack.credits} 點。`);
              }}
              variant="ghost"
            />
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Instagram" subtitle="連結以分享限時動態">
        <View style={styles.connectionRow}>
          <View>
            <Text style={styles.connectionTitle}>IG 商業帳號</Text>
            <Text style={styles.connectionSubtitle}>
              {instagramReady ? '已準備分享' : '尚未連結'}
            </Text>
          </View>
          <PrimaryButton
            label={instagramReady ? '管理' : '連結'}
            onPress={() =>
              Alert.alert(
                '連結',
                instagramReady
                  ? '已偵測到 Meta 憑證。可在下一步新增連結流程。'
                  : '請在 .env 中新增 Meta 金鑰以啟用 OAuth 流程。',
              )
            }
            variant="ghost"
          />
        </View>
      </SectionCard>

      <SectionCard title="🧵 Threads" subtitle="一鍵發文 + 驗證領獎">
        <View style={styles.connectionRow}>
          <View>
            <Text style={styles.connectionTitle}>Threads 分享測試</Text>
            <Text style={styles.connectionSubtitle}>測試活動分享功能</Text>
          </View>
          <PrimaryButton
            label="測試"
            onPress={() => navigation.navigate('ThreadsTest')}
            variant="ghost"
          />
        </View>
      </SectionCard>

      <SectionCard title="使用量">
        <View style={styles.row}>
          <Text style={styles.label}>預設費用</Text>
          <Text style={styles.value}>每部影片 20 點</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>高畫質費用</Text>
          <Text style={styles.value}>每部影片 30 點</Text>
        </View>
      </SectionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontSize: 26,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 14,
  },
  packRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  packTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 14,
  },
  packSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyStrong,
    fontSize: 14,
  },
  connectionSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
