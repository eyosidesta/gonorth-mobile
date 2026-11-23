import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerifyScreen from '../screens/auth/EmailVerifyScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Onboarding screens
import OnboardingProvinceScreen from '../screens/auth/OnboardingProvinceScreen';
import OnboardingPhoneScreen from '../screens/auth/OnboardingPhoneScreen';
import OnboardingPhoneVerifyScreen from '../screens/auth/OnboardingPhoneVerifyScreen';
import OnboardingDobScreen from '../screens/auth/OnboardingDobScreen';
import OnboardingGenderScreen from '../screens/auth/OnboardingGenderScreen';
import OnboardingLanguageScreen from '../screens/auth/OnboardingLanguageScreen';
import OnboardingPhotoScreen from '../screens/auth/OnboardingPhotoScreen';
import OnboardingBioScreen from '../screens/auth/OnboardingBioScreen';
import OnboardingNotificationsScreen from '../screens/auth/OnboardingNotificationsScreen';
import OnboardingCompleteScreen from '../screens/auth/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen as any} />
      <Stack.Screen name="EmailVerify" component={EmailVerifyScreen as any} />
      <Stack.Screen name="Login" component={LoginScreen as any} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen as any} />

      {/* Onboarding */}
      <Stack.Screen name="OnboardingProvince" component={OnboardingProvinceScreen as any} />
      <Stack.Screen name="OnboardingPhone" component={OnboardingPhoneScreen as any} />
      <Stack.Screen name="OnboardingPhoneVerify" component={OnboardingPhoneVerifyScreen as any} />
      <Stack.Screen name="OnboardingDob" component={OnboardingDobScreen as any} />
      <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen as any} />
      <Stack.Screen name="OnboardingLanguage" component={OnboardingLanguageScreen as any} />
      <Stack.Screen name="OnboardingPhoto" component={OnboardingPhotoScreen as any} />
      <Stack.Screen name="OnboardingBio" component={OnboardingBioScreen as any} />
      <Stack.Screen name="OnboardingNotifications" component={OnboardingNotificationsScreen as any} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen as any} />
    </Stack.Navigator>
  );
}
