import React from 'react';
import { Platform } from 'react-native';

type SfIconSpec = { default: string; selected: string };

type NativeTabBarProps = {
  tabs: Array<{
    name: string;
    label: string;
    sf: SfIconSpec;
  }>;
};

let NativeTabsModule: typeof import('expo-router/unstable-native-tabs') | null = null;
let GlassEffectModule: typeof import('expo-glass-effect') | null = null;
let SymbolsModule: typeof import('expo-symbols') | null = null;
let loadAttempted = false;
let modulesAvailable = false;

function loadModules(): void {
  if (loadAttempted) return;
  loadAttempted = true;
  if (Platform.OS === 'web') return;
  try {
    NativeTabsModule = require('expo-router/unstable-native-tabs');
    GlassEffectModule = require('expo-glass-effect');
    SymbolsModule = require('expo-symbols');
    modulesAvailable = Boolean(NativeTabsModule && GlassEffectModule && SymbolsModule);
  } catch {
    modulesAvailable = false;
  }
}

export function isLiquidGlassAvailable(): boolean {
  loadModules();
  if (!modulesAvailable || !GlassEffectModule) return false;
  return GlassEffectModule.isLiquidGlassAvailable();
}

export function NativeTabBar({ tabs }: NativeTabBarProps): React.ReactElement | null {
  loadModules();
  if (!modulesAvailable || !NativeTabsModule) return null;
  const { NativeTabs } = NativeTabsModule;
  return (
    <NativeTabs>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.sf} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

export function TabSymbol({ name, tintColor, size }: { name: string; tintColor: string; size: number }): React.ReactElement | null {
  loadModules();
  if (!modulesAvailable || !SymbolsModule) return null;
  const { SymbolView } = SymbolsModule;
  return <SymbolView name={name} tintColor={tintColor} size={size} />;
}
