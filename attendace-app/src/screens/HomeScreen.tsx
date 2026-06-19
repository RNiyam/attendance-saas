import React, { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Polyline,
} from 'react-native-svg';
import { fonts } from '../theme';

interface HomeScreenProps {
  route: {
    params?: {
      accessToken?: string;
      user?: {
        id: number;
        email: string;
        organizationId: number;
        profileImageUrl?: string | null;
      };
      organization?: {
        id: number;
        name: string;
        slug: string;
      };
      role?: string;
      permissions?: string[];
      displayName?: string;
      employeeId?: number;
    };
  };
  navigation: any;
}

export default function HomeScreen({ route, navigation }: HomeScreenProps) {
  // Extract parameters from route
  const {
    displayName = 'User',
    role = 'EMPLOYEE',
    permissions = [],
    organization = { name: 'WorkforceOS', slug: '' },
    accessToken,
    employeeId,
  } = route.params || {};

  // Custom states
  const [activeTab, setActiveTab] = useState<'home' | 'modules' | 'analytics' | 'profile'>('home');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);

  // Check permissions: Only Owners, Admins, or HR can register faces (CREATE_EMPLOYEE / UPDATE_EMPLOYEE)
  const hasRegisterPermission =
    permissions.includes('CREATE_EMPLOYEE') ||
    permissions.includes('UPDATE_EMPLOYEE') ||
    role === 'OWNER' ||
    role === 'ADMIN' ||
    role === 'HR';

  // Format date precisely matching Image 1: "Today 25 Nov."
  const todayFormatted = useMemo(() => {
    const date = new Date();
    const day = date.getDate();
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const monthShort = months[date.getMonth()];
    return `Today ${day} ${monthShort}`;
  }, []);

  // Resolve dynamic API Base URL
  const API_BASE_URL = useMemo(() => {
    return process.env.EXPO_PUBLIC_API_URL || (Platform.select({
      android: 'http://10.0.2.2:5003',
      ios: 'http://127.0.0.1:5003',
      default: 'http://127.0.0.1:5003',
    }) as string);
  }, []);

  // Check if profileImageUrl exists and dynamically resolve it
  const profileImageUri = useMemo(() => {
    const rawUrl = route.params?.user?.profileImageUrl;
    if (!rawUrl) {
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    // Handle relative path (relative to Node backend)
    return `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }, [route.params?.user?.profileImageUrl, API_BASE_URL]);

  // Comprehensive list of web-matched workspace modules
  const modulesList = [
    {
      title: 'Organization Setup',
      description: 'Finish business defaults, shifts, leave policies, and onboarding details.',
      permissions: ['MANAGE_SHIFTS', 'MANAGE_LEAVE_TYPES', 'INVITE_EMPLOYEE'],
      accent: '#3B82F6',
      bg: '#EFF6FF',
    },
    {
      title: 'Employees',
      description: 'Manage employee records, dynamic invites, and track team onboarding.',
      permissions: ['VIEW_EMPLOYEE'],
      accent: '#10B981',
      bg: '#ECFDF5',
    },
    {
      title: 'Attendance',
      description: 'Track check-ins, attendance status, adjustments, and shift coverage.',
      permissions: ['VIEW_ATTENDANCE'],
      accent: '#6366F1',
      bg: '#EEF2FF',
    },
    {
      title: 'Leave',
      description: 'Request leave, review approvals, and maintain leave policy rules.',
      permissions: ['REQUEST_LEAVE', 'APPROVE_LEAVE'],
      accent: '#8B5CF6',
      bg: '#F5F3FF',
    },
    {
      title: 'Payroll',
      description: 'Run payroll cycles, calculate salaries, and review structures.',
      permissions: ['RUN_PAYROLL'],
      accent: '#F59E0B',
      bg: '#FEF3C7',
    },
    {
      title: 'Settings',
      description: 'Manage branches, departments, roles, and administrative keys.',
      permissions: ['MANAGE_BRANCHES', 'MANAGE_DEPARTMENTS', 'MANAGE_DESIGNATIONS', 'MANAGE_INTEGRATIONS'],
      accent: '#64748B',
      bg: '#F1F5F9',
    },
  ];

  // Map permissions to Set for high-speed matches
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  // Dynamically filter active modules matching web's visibility pipeline
  const visibleModules = useMemo(() => {
    return modulesList.filter((module) =>
      module.permissions.some((p) => permissionSet.has(p))
    );
  }, [permissionSet]);

  // Handle bell icon click
  const handleBellPress = () => {
    setHasNotification(false);
    setShowNotificationPopup(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Decorative ambient background */}
      <View style={styles.ambientOverlay}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#EEF2FF" stopOpacity={0.8} />
              <Stop offset="100%" stopColor="#F5F3FF" stopOpacity={0.8} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>

      {/* ─── Premium Header Layout (Aligned precisely with Image 1) ─── */}
      <View style={styles.premiumHeader}>
        <View style={styles.headerAvatarContainer}>
          <Image
            source={{ uri: profileImageUri }}
            style={styles.headerAvatar}
          />
        </View>
        <View style={styles.headerGreeting}>
          <Text style={styles.greetingText}>Hello, {displayName}</Text>
          <Text style={styles.dateText}>{todayFormatted}</Text>
        </View>
        <Pressable
          onPress={handleBellPress}
          style={({ pressed }) => [styles.bellIconContainer, pressed && { opacity: 0.7 }]}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </Svg>
          {hasNotification && <View style={styles.bellActiveBadge} />}
        </Pressable>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Render Tab 1: HOME SCREEN ─── */}
        {activeTab === 'home' && (
          <View>
            {/* Dynamic 3-Column Stats Grid (Matching Web Console) */}
            <View style={styles.webConsoleCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>WORKSPACE SYNC</Text>
                <View style={styles.statusPulseContainer}>
                  <View style={styles.statusPulse} />
                  <Text style={styles.statusText}>Cloud Secured</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Workspace Console</Text>
              <Text style={styles.cardSubtitle}>
                Realtime database terminal for roles, privileges, and features.
              </Text>

              <View style={styles.statsConsoleContainer}>
                {/* Column 1: Role */}
                <View style={styles.statConsoleBox}>
                  <Text style={styles.statConsoleValue}>{role || 'Pending'}</Text>
                  <Text style={styles.statConsoleLabel}>Role</Text>
                </View>

                <View style={styles.statConsoleDivider} />

                {/* Column 2: Permissions (Pressable Inspector) */}
                <Pressable
                  onPress={() => setShowPermissionsModal(true)}
                  style={({ pressed }) => [styles.statConsoleBox, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.statConsoleValue, { color: '#7C3AED' }]}>
                    {permissions.length}
                  </Text>
                  <Text style={[styles.statConsoleLabel, { color: '#906BFF', fontFamily: fonts.bold }]}>
                    Privileges 🔍
                  </Text>
                </Pressable>

                <View style={styles.statConsoleDivider} />

                {/* Column 3: Active Modules */}
                <View style={styles.statConsoleBox}>
                  <Text style={styles.statConsoleValue}>{visibleModules.length}</Text>
                  <Text style={styles.statConsoleLabel}>Modules</Text>
                </View>
              </View>
            </View>

            {/* Quick Biometric Actions */}
            <Text style={styles.sectionTitle}>Biometric Quick Actions</Text>

            <View style={styles.actionsContainer}>
              {hasRegisterPermission ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionCard,
                    styles.actionRegister,
                    pressed && styles.actionPressed,
                  ]}
                  onPress={() => navigation.navigate('Register', { accessToken, employeeId })}
                >
                  <View style={styles.actionIconContainer}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <Circle cx="9" cy="7" r="4" />
                      <Path d="M19 8v6" />
                      <Path d="M22 11h-6" />
                    </Svg>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Register Employee Face</Text>
                    <Text style={styles.actionDesc}>
                      Onboard a new colleague's face biometrics
                    </Text>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                      <Path d="M9 5l7 7-7 7" />
                    </Svg>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.infoCard}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F7FFF" strokeWidth="2">
                    <Circle cx="12" cy="12" r="10" />
                    <Path d="M12 16v-4" />
                    <Path d="M12 8h.01" />
                  </Svg>
                  <Text style={styles.infoText}>
                    Face registration actions are locked to admin roles. Contact your HR administrator to re-enroll biometrics.
                  </Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  styles.actionAttendance,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => navigation.navigate('Attendance', { accessToken, employeeId })}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <Circle cx="12" cy="13" r="4" />
                  </Svg>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionTitle, { color: '#1E1B4B' }]}>Mark Attendance</Text>
                  <Text style={styles.actionDesc}>
                    Clock-in or Clock-out using live face recognition
                  </Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                    <Path d="M9 5l7 7-7 7" />
                  </Svg>
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Render Tab 2: MODULES SCREEN ─── */}
        {activeTab === 'modules' && (
          <View>
            <Text style={styles.sectionTitle}>Your Workspace Modules</Text>
            {visibleModules.length === 0 ? (
              <View style={[styles.infoCard, { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', marginBottom: 28 }]}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 16v-4" />
                  <Path d="M12 8h.01" />
                </Svg>
                <Text style={[styles.infoText, { color: '#4B5563' }]}>
                  No active administrative modules for your profile. All roles are fully synchronized.
                </Text>
              </View>
            ) : (
              <View style={styles.modulesContainer}>
                {visibleModules.map((module, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedModule(module)}
                    style={({ pressed }) => [
                      styles.moduleCard,
                      pressed && styles.actionPressed,
                      { borderLeftColor: module.accent },
                    ]}
                  >
                    <View style={[styles.moduleIconBadge, { backgroundColor: module.bg }]}>
                      {module.title === 'Organization Setup' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={module.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <Circle cx="9" cy="7" r="4" />
                          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </Svg>
                      )}
                      {module.title === 'Employees' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={module.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <Circle cx="9" cy="7" r="4" />
                          <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </Svg>
                      )}
                      {module.title === 'Attendance' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={module.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Circle cx="12" cy="12" r="10" />
                          <Polyline points="12 6 12 12 16 14" />
                        </Svg>
                      )}
                      {module.title === 'Leave' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={module.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <Polyline points="14 2 14 8 20 8" />
                          <Line x1="16" y1="13" x2="8" y2="13" />
                          <Line x1="16" y1="17" x2="8" y2="17" />
                          <Polyline points="10 9 9 9 8 9" />
                        </Svg>
                      )}
                      {module.title === 'Payroll' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={module.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Line x1="12" y1="1" x2="12" y2="23" />
                          <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </Svg>
                      )}
                      {module.title === 'Settings' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={module.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Circle cx="12" cy="12" r="3" />
                          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </Svg>
                      )}
                    </View>

                    <View style={styles.moduleTextContainer}>
                      <View style={styles.moduleTitleRow}>
                        <Text style={styles.moduleTitle}>{module.title}</Text>
                        <View style={styles.syncIndicatorBadge}>
                          <Text style={styles.syncIndicatorText}>SYNCED</Text>
                        </View>
                      </View>
                      <Text style={styles.moduleDesc}>{module.description}</Text>
                    </View>

                    <View style={styles.chevronContainer}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                        <Path d="M9 5l7 7-7 7" />
                      </Svg>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── Render Tab 3: BIOMETRIC TERMINAL ANALYTICS SCREEN ─── */}
        {activeTab === 'analytics' && (
          <View>
            <Text style={styles.sectionTitle}>Terminal Analytics</Text>

            {/* Glassmorphic Analytics Stats Card */}
            <View style={styles.analyticsStatsCard}>
              <View style={styles.analyticsUptimeBox}>
                <View style={styles.analyticsUptimeHeader}>
                  <Text style={styles.uptimeTitle}>TERMINAL STATUS</Text>
                  <View style={styles.uptimeActiveBadge}>
                    <View style={styles.uptimeDot} />
                    <Text style={styles.uptimeActiveText}>ONLINE</Text>
                  </View>
                </View>
                <Text style={styles.uptimePercentage}>99.98%</Text>
                <Text style={styles.uptimeDesc}>Average Biometric Server Uptime (28 Days)</Text>
              </View>

              <View style={styles.analyticsDividerLine} />

              <View style={styles.analyticsSpeedRow}>
                <View style={styles.analyticsSpeedBox}>
                  <Text style={styles.speedValue}>0.42s</Text>
                  <Text style={styles.speedLabel}>Recognition Time</Text>
                </View>
                <View style={styles.analyticsSpeedBox}>
                  <Text style={styles.speedValue}>100%</Text>
                  <Text style={styles.speedLabel}>Secure Lockout</Text>
                </View>
              </View>
            </View>

            {/* Recent Biometric check-in logs list */}
            <Text style={styles.sectionTitle}>Realtime Audit Log</Text>
            <View style={styles.auditLogContainer}>
              <View style={styles.auditRow}>
                <View style={[styles.auditIcon, { backgroundColor: '#DEF7EC' }]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#03543F" strokeWidth="2.5">
                    <Polyline points="20 6 9 17 4 12" />
                  </Svg>
                </View>
                <View style={styles.auditInfo}>
                  <Text style={styles.auditTitle}>Face Scan Authorized</Text>
                  <Text style={styles.auditMeta}>Cosine Similarity: 0.88 · 10:42 AM</Text>
                </View>
              </View>

              <View style={styles.auditRow}>
                <View style={[styles.auditIcon, { backgroundColor: '#DEF7EC' }]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#03543F" strokeWidth="2.5">
                    <Polyline points="20 6 9 17 4 12" />
                  </Svg>
                </View>
                <View style={styles.auditInfo}>
                  <Text style={styles.auditTitle}>Session Profile Resolved</Text>
                  <Text style={styles.auditMeta}>Token authorized · 10:41 AM</Text>
                </View>
              </View>

              <View style={styles.auditRow}>
                <View style={[styles.auditIcon, { backgroundColor: '#FDE8E8' }]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="2.5">
                    <Line x1="18" y1="6" x2="6" y2="18" />
                    <Line x1="6" y1="6" x2="18" y2="18" />
                  </Svg>
                </View>
                <View style={styles.auditInfo}>
                  <Text style={styles.auditTitle}>Credentials verification failed</Text>
                  <Text style={styles.auditMeta}>User mismatch · 10:39 AM</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── Render Tab 4: DETAILED PROFILE SCREEN ─── */}
        {activeTab === 'profile' && (
          <View style={styles.profileTabContainer}>
            <Text style={styles.sectionTitle}>Employee Directory</Text>

            {/* Profile Overview Card */}
            <View style={styles.profileOverviewCard}>
              <Image
                source={{ uri: profileImageUri }}
                style={styles.profileCardAvatar}
              />
              <Text style={styles.profileCardName}>{displayName}</Text>
              <Text style={styles.profileCardEmail}>{route.params?.user?.email || 'employee@workforce.com'}</Text>
              
              <View style={[styles.profileCardBadge, role === 'OWNER' || role === 'ADMIN' ? styles.badgeAdmin : styles.badgeEmployee]}>
                <Text style={[styles.badgeText, role === 'OWNER' || role === 'ADMIN' ? styles.badgeTextAdmin : styles.badgeTextEmployee]}>
                  {role}
                </Text>
              </View>
            </View>

            {/* Permissions list inspector directly inside profile page */}
            <Text style={styles.sectionTitle}>Dynamic Privileges</Text>
            <View style={styles.profilePrivilegesCard}>
              {permissions.length === 0 ? (
                <Text style={styles.noPermissionsText}>No active privileges resolved.</Text>
              ) : (
                <View style={styles.permissionsChipsGridProfile}>
                  {permissions.map((perm, i) => (
                    <View key={i} style={styles.permissionChipProfile}>
                      <View style={styles.permissionChipDotProfile} />
                      <Text style={styles.permissionChipTextProfile}>{perm}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sign Out Button inside Profile Screen */}
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutPressed,
              ]}
              onPress={() => navigation.replace('Login')}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ─── Premium Custom Floating Navigation Bottom Pill (Aligned with Image 2) ─── */}
      <View style={styles.tabBarWrapper} pointerEvents="box-none">
        <View style={styles.floatingTabBar}>
          {/* Tab 1: Home Overview */}
          <Pressable
            onPress={() => setActiveTab('home')}
            style={styles.tabItem}
          >
            {activeTab === 'home' ? (
              <View style={styles.activeIconContainer}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F0F1A" strokeWidth="2.5">
                  <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <Polyline points="9 22 9 12 15 12 15 22" />
                </Svg>
              </View>
            ) : (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6">
                <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <Polyline points="9 22 9 12 15 12 15 22" />
              </Svg>
            )}
          </Pressable>

          {/* Tab 2: Modules Grid */}
          <Pressable
            onPress={() => setActiveTab('modules')}
            style={styles.tabItem}
          >
            {activeTab === 'modules' ? (
              <View style={styles.activeIconContainer}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F0F1A" strokeWidth="2.5">
                  <Rect x="3" y="3" width="7" height="7" rx="1" />
                  <Rect x="14" y="3" width="7" height="7" rx="1" />
                  <Rect x="14" y="14" width="7" height="7" rx="1" />
                  <Rect x="3" y="14" width="7" height="7" rx="1" />
                </Svg>
              </View>
            ) : (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6">
                <Rect x="3" y="3" width="7" height="7" rx="1" />
                <Rect x="14" y="3" width="7" height="7" rx="1" />
                <Rect x="14" y="14" width="7" height="7" rx="1" />
                <Rect x="3" y="14" width="7" height="7" rx="1" />
              </Svg>
            )}
          </Pressable>

          {/* Tab 3: Analytics Terminal */}
          <Pressable
            onPress={() => setActiveTab('analytics')}
            style={styles.tabItem}
          >
            {activeTab === 'analytics' ? (
              <View style={styles.activeIconContainer}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F0F1A" strokeWidth="2.5">
                  <Line x1="18" y1="20" x2="18" y2="10" />
                  <Line x1="12" y1="20" x2="12" y2="4" />
                  <Line x1="6" y1="20" x2="6" y2="14" />
                </Svg>
              </View>
            ) : (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6">
                <Line x1="18" y1="20" x2="18" y2="10" />
                <Line x1="12" y1="20" x2="12" y2="4" />
                <Line x1="6" y1="20" x2="6" y2="14" />
              </Svg>
            )}
          </Pressable>

          {/* Tab 4: User Profile settings */}
          <Pressable
            onPress={() => setActiveTab('profile')}
            style={styles.tabItem}
          >
            {activeTab === 'profile' ? (
              <View style={styles.activeIconContainer}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F0F1A" strokeWidth="2.5">
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <Circle cx="12" cy="7" r="4" />
                </Svg>
              </View>
            ) : (
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Modal 0: Active Notification Alerts ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showNotificationPopup}
        onRequestClose={() => setShowNotificationPopup(false)}
      >
        <View style={styles.moduleInfoBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNotificationPopup(false)} />

          <View style={styles.moduleInfoCard}>
            <View style={[styles.moduleInfoIconWrapper, { backgroundColor: '#EEF2FF' }]}>
              <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
            </View>

            <Text style={styles.moduleInfoTitle}>Security Alerts</Text>
            
            <View style={styles.moduleInfoBadgeRow}>
              <View style={[styles.moduleInfoStatusBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <View style={styles.moduleInfoStatusDot} />
                <Text style={styles.moduleInfoStatusText}>All Services Nominal</Text>
              </View>
            </View>

            <View style={[styles.auditLogContainer, { borderWidth: 0, width: '100%', paddingHorizontal: 0, marginBottom: 16 }]}>
              <View style={styles.auditRow}>
                <View style={[styles.auditIcon, { backgroundColor: '#DEF7EC' }]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#03543F" strokeWidth="2.5">
                    <Polyline points="20 6 9 17 4 12" />
                  </Svg>
                </View>
                <View style={styles.auditInfo}>
                  <Text style={styles.auditTitle}>Terminal Status: Secured</Text>
                  <Text style={styles.auditMeta}>Biometric server online & running (99.98% uptime)</Text>
                </View>
              </View>

              <View style={styles.auditRow}>
                <View style={[styles.auditIcon, { backgroundColor: '#DEF7EC' }]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#03543F" strokeWidth="2.5">
                    <Polyline points="20 6 9 17 4 12" />
                  </Svg>
                </View>
                <View style={styles.auditInfo}>
                  <Text style={styles.auditTitle}>Sync Pipeline: Active</Text>
                  <Text style={styles.auditMeta}>Fully synced with main database container</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setShowNotificationPopup(false)}
              style={styles.moduleInfoCloseButton}
            >
              <Text style={styles.moduleInfoCloseButtonText}>Acknowledge Alerts</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal 1: Permissions Detail Inspector (Matching Web Layout) ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPermissionsModal}
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPermissionsModal(false)} />
          
          <View style={styles.modalSheet}>
            {/* Slide guide */}
            <View style={styles.modalSheetKnob} />

            <View style={styles.modalSheetHeader}>
              <View style={styles.modalSheetHeaderBadge}>
                <Text style={styles.modalSheetHeaderBadgeText}>{role}</Text>
              </View>
              <Text style={styles.modalSheetTitle}>Active Privileges</Text>
              <Text style={styles.modalSheetSubtitle}>
                Granular security codes resolved dynamically for your session.
              </Text>
            </View>

            <ScrollView style={styles.modalSheetScroll} contentContainerStyle={styles.modalSheetScrollContent}>
              {permissions.length === 0 ? (
                <Text style={styles.noPermissionsText}>No active permission policies resolved.</Text>
              ) : (
                <View style={styles.permissionsChipsGrid}>
                  {permissions.map((perm, i) => (
                    <View key={i} style={styles.permissionChip}>
                      <View style={styles.permissionChipDot} />
                      <Text style={styles.permissionChipText}>{perm}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <Pressable
              onPress={() => setShowPermissionsModal(false)}
              style={styles.modalSheetCloseButton}
            >
              <Text style={styles.modalSheetCloseButtonText}>Close Inspector</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal 2: Dynamic Module Sync Info Inspector ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedModule !== null}
        onRequestClose={() => setSelectedModule(null)}
      >
        <View style={styles.moduleInfoBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedModule(null)} />

          <View style={styles.moduleInfoCard}>
            <View style={[styles.moduleInfoIconWrapper, selectedModule && { backgroundColor: selectedModule.bg }]}>
              {selectedModule?.title === 'Organization Setup' && (
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={selectedModule.accent} strokeWidth="2">
                  <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <Circle cx="9" cy="7" r="4" />
                </Svg>
              )}
              {selectedModule?.title === 'Employees' && (
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={selectedModule.accent} strokeWidth="2">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <Circle cx="9" cy="7" r="4" />
                </Svg>
              )}
              {selectedModule?.title === 'Attendance' && (
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={selectedModule.accent} strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Polyline points="12 6 12 12 16 14" />
                </Svg>
              )}
              {selectedModule?.title === 'Leave' && (
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={selectedModule.accent} strokeWidth="2">
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </Svg>
              )}
              {selectedModule?.title === 'Payroll' && (
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={selectedModule.accent} strokeWidth="2">
                  <Line x1="12" y1="1" x2="12" y2="23" />
                  <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </Svg>
              )}
              {selectedModule?.title === 'Settings' && (
                <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={selectedModule.accent} strokeWidth="2">
                  <Circle cx="12" cy="12" r="3" />
                  <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82" />
                </Svg>
              )}
            </View>

            <Text style={styles.moduleInfoTitle}>{selectedModule?.title}</Text>
            
            <View style={styles.moduleInfoBadgeRow}>
              <View style={styles.moduleInfoStatusBadge}>
                <View style={styles.moduleInfoStatusDot} />
                <Text style={styles.moduleInfoStatusText}>Cloud Synced</Text>
              </View>
            </View>

            <Text style={styles.moduleInfoDesc}>
              {selectedModule?.description}
            </Text>

            <View style={styles.moduleInfoSyncNoticeBox}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" style={{ marginTop: 2 }}>
                <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <Polyline points="22 4 12 14.01 9 11.01" />
              </Svg>
              <Text style={styles.moduleInfoSyncNoticeText}>
                This administrative console is fully synchronized with WorkforceOS. You can configure and manage organization-wide records using the web platform dashboard.
              </Text>
            </View>

            <Pressable
              onPress={() => setSelectedModule(null)}
              style={styles.moduleInfoCloseButton}
            >
              <Text style={styles.moduleInfoCloseButtonText}>Acknowledge</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  ambientOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexGrow: 1,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAdmin: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#C7B8FF',
  },
  badgeEmployee: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  badgeTextAdmin: {
    color: '#7C3AED',
  },
  badgeTextEmployee: {
    color: '#4F7FFF',
  },
  webConsoleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E8E5F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardDate: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#9CA3AF',
  },
  statusPulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#10B981',
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B6B80',
    marginTop: 6,
    lineHeight: 18,
  },
  statsConsoleContainer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  statConsoleBox: {
    flex: 1,
    alignItems: 'center',
  },
  statConsoleValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
    textAlign: 'center',
  },
  statConsoleLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statConsoleDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#8B8B9E',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 14,
    marginTop: 4,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E5F0',
  },
  actionRegister: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  actionAttendance: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F7FFF',
  },
  actionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  actionDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
    fontFamily: fonts.medium,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 11.5,
    color: '#1D4ED8',
    fontFamily: fonts.medium,
    lineHeight: 16,
  },
  logoutButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FCA5A580',
    backgroundColor: '#FFF5F5',
    marginTop: 12,
    marginBottom: 24,
  },
  logoutPressed: {
    backgroundColor: '#FEE2E2',
    opacity: 0.9,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },

  // ── Workspace Modules Styles ──
  modulesContainer: {
    gap: 14,
    marginBottom: 32,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E5F0',
    borderLeftWidth: 4,
  },
  moduleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleTitle: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  syncIndicatorBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  syncIndicatorText: {
    fontSize: 8.5,
    fontFamily: fonts.bold,
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  moduleDesc: {
    fontSize: 11,
    color: '#6B6B80',
    marginTop: 3,
    lineHeight: 15,
    fontFamily: fonts.medium,
  },

  // ── Permissions Modal Inspector Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#070615B3',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '75%',
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  modalSheetKnob: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalSheetHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  modalSheetHeaderBadge: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C7B8FF',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  modalSheetHeaderBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  modalSheetTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  modalSheetSubtitle: {
    fontSize: 12,
    color: '#6B6B80',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    fontFamily: fonts.medium,
  },
  modalSheetScroll: {
    marginVertical: 14,
  },
  modalSheetScrollContent: {
    paddingBottom: 16,
  },
  noPermissionsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    marginVertical: 24,
    fontFamily: fonts.semiBold,
  },
  permissionsChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  permissionChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  permissionChipText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  modalSheetCloseButton: {
    backgroundColor: '#7C3AED',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSheetCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  // ── Sync Module Modal Card Styles ──
  moduleInfoBackdrop: {
    flex: 1,
    backgroundColor: '#070615CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfoCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
  },
  moduleInfoIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  moduleInfoTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  moduleInfoBadgeRow: {
    marginTop: 6,
    marginBottom: 14,
  },
  moduleInfoStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 6,
  },
  moduleInfoStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  moduleInfoStatusText: {
    fontSize: 9.5,
    fontFamily: fonts.bold,
    color: '#047857',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  moduleInfoDesc: {
    fontSize: 12.5,
    color: '#6B6B80',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: fonts.medium,
  },
  moduleInfoSyncNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 24,
  },
  moduleInfoSyncNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#1D4ED8',
    lineHeight: 16,
    fontFamily: fonts.semiBold,
  },
  moduleInfoCloseButton: {
    backgroundColor: '#0F0F1A',
    height: 48,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfoCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: fonts.bold,
  },

  // ── Premium Header Styles (Aligned with Image 1) ──
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    backgroundColor: '#FAF9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F2F7',
  },
  headerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerGreeting: {
    flex: 1,
    marginLeft: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 12.5,
    fontFamily: fonts.semiBold,
    color: '#8C8AA2',
    marginTop: 2,
    textAlign: 'center',
  },
  bellIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#E8E5F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellActiveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5A5A',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // ── Floating bottom pill tab styles (Aligned with Image 2) ──
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabBar: {
    width: '90%',
    height: 70,
    borderRadius: 35,
    backgroundColor: '#070615',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Terminal Analytics styles ──
  analyticsStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5F0',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 28,
  },
  analyticsUptimeBox: {
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsUptimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uptimeTitle: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#8B8B9E',
    letterSpacing: 0.8,
  },
  uptimeActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  uptimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  uptimeActiveText: {
    fontSize: 8.5,
    fontFamily: fonts.bold,
    color: '#047857',
  },
  uptimePercentage: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
    marginTop: 6,
  },
  uptimeDesc: {
    fontSize: 11,
    color: '#6B6B80',
    fontFamily: fonts.semiBold,
    marginTop: 4,
  },
  analyticsDividerLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  analyticsSpeedRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsSpeedBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 10,
  },
  speedValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  speedLabel: {
    fontSize: 9.5,
    color: '#9CA3AF',
    fontFamily: fonts.semiBold,
    marginTop: 2,
  },
  auditLogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E8E5F0',
    gap: 12,
    marginBottom: 16,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auditIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditInfo: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  auditMeta: {
    fontSize: 10.5,
    color: '#8C8AA2',
    fontFamily: fonts.medium,
    marginTop: 2,
  },

  // ── Profile screen styles ──
  profileTabContainer: {
    paddingBottom: 16,
  },
  profileOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E5F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 28,
  },
  profileCardAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileCardName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F0F1A',
  },
  profileCardEmail: {
    fontSize: 12,
    color: '#6B6B80',
    fontFamily: fonts.semiBold,
    marginTop: 4,
  },
  profileCardBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profilePrivilegesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E8E5F0',
    marginBottom: 28,
  },
  permissionsChipsGridProfile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  permissionChipProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
  },
  permissionChipDotProfile: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#7C3AED',
  },
  permissionChipTextProfile: {
    fontSize: 10,
    color: '#475569',
    fontFamily: fonts.bold,
  },
});
