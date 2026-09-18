import { Platform } from 'react-native';

type SfIconSpec = { default: string; selected: string };

type NativeTabsModule = typeof import('expo-router/unstable-native-tabs');
type GlassEffectModule = typeof import('expo-glass-effect');
type SymbolsModule = typeof import('expo-symbols');

let _nativeTabs: NativeTabsModule | null = null;
let _glassEffect: GlassEffectModule | null = null;
let _symbols: SymbolsModule | null = null;
let _loaded = false;
let _available = false;

function loadNativeModules(): void {
  if (_loaded) return;
  _loaded = true;
  if (Platform.OS === 'web') return;
  try {
    _nativeTabs = require('expo-router/unstable-native-tabs');
    _glassEffect = require('expo-glass-effect');
    _symbols = require('expo-symbols');
    _available = Boolean(_nativeTabs && _glassEffect && _symbols);
  } catch {
    _available = false;
  }
}

export function isLiquidGlassAvailable(): boolean {
  loadNativeModules();
  if (!_available || !_glassEffect) return false;
  return _glassEffect.isLiquidGlassAvailable();
}

export function NativeTabs(): React.ComponentType | null {
  loadNativeModules();
  return _nativeTabs?.NativeTabs ?? null;
}

export function SymbolView(props: { name: string; tintColor: string; size: number }): React.ReactElement | null {
  loadNativeModules();
  if (!_symbols) return null;
  const { SymbolView: RealSymbolView } = _symbols;
  return <RealSymbolView name={props.name} tintColor={props.tintColor} size={props.size} />;
}

export type { SfIconSpec };
