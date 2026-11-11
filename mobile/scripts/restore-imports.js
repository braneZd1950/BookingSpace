const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = {
  'src/features/auth/LandingScreen.tsx': {
    react: `import { useEffect, useRef, useState } from 'react';`,
    rn: `import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';`,
  },
  'src/features/auth/LoginScreen.tsx': {
    react: `import { useEffect, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/auth/ForgotPasswordScreen.tsx': {
    react: `import { useEffect, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';`,
  },
  'src/features/auth/RegisterScreen.tsx': {
    react: `import { useEffect, useRef, useState, type ComponentProps } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/auth/SessionSuccessScreen.tsx': {
    react: `import { useEffect, useRef } from 'react';`,
    rn: `import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';`,
  },
  'src/features/auth/LegalDocumentScreen.tsx': {
    react: `import { useMemo } from 'react';`,
    rn: `import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioHomeScreen.tsx': {
    react: `import { useEffect, useRef, useState, type ComponentProps } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioBookingsScreen.tsx': {
    react: `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioCalendarScreen.tsx': {
    react: `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioAnalyticsScreen.tsx': {
    react: `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioServicesScreen.tsx': {
    react: `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioSettingsScreen.tsx': {
    react: `import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
  'src/features/studio/StudioMembersScreen.tsx': {
    react: `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`,
    rn: `import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';`,
    extras: `import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';`,
  },
};

for (const [rel, block] of Object.entries(files)) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes("from 'react-native'")) {
    console.log('skip (already has rn):', rel);
    continue;
  }
  const prefix = `${block.react}\n${block.rn}\n${block.extras}\n`;
  text = prefix + text;
  // tidy blank lines after stripped fontsLoaded gate
  text = text.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(file, text);
  console.log('restored', rel);
}
