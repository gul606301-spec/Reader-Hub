import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import AuthScreen from '@/components/AuthScreen';
import { isLiquidGlassAvailable, NativeTabBar, TabSymbol } from '@/components/NativeTabBar';

const nativeTabs = [
  { name: 'index', label: 'Ana Sayfa', sf: { default: 'house', selected: 'house.fill' } },
  { name: 'library', label: 'Kitaplığım', sf: { default: 'books.vertical', selected: 'books.vertical.fill' } },
  { name: 'search', label: 'Kitap Ara', sf: { default: 'magnifyingglass', selected: 'magnifyingglass' } },
  { name: 'profile', label: 'Profil', sf: { default: 'person', selected: 'person.fill' } },
];

function NativeTabLayout() {
  return <NativeTabBar tabs={nativeTabs} />;
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: Platform.OS === 'web' ? 84 : 72,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarIcon: ({ color, size }) => Platform.OS === 'ios' ? <TabSymbol name="house" tintColor={color} size={size} /> : <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Kitaplığım', tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Kitap Ara', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { profile, isReady } = useReader();
  if (!isReady) return <View style={{ flex: 1 }} />;
  if (!profile) return <AuthScreen />;
  return isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
}
