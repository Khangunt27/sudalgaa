import { Platform } from 'react-native';

/**
 * Centralized API configuration
 * Determines the base URL based on the platform
 */
export const API_URL = Platform.select({
  ios: 'http://192.168.230.204:3000',
  android: 'http://192.168.230.204:3000',
  web: 'http://localhost:3000',
  default: 'http://192.168.230.204:3000',
});

// Note: 192.168.201.204 is your current LAN IP. If this changes, update this file.

/**
 * Helper function to check if an error is a network/connection error
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;

  // Axios network errors
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
    return true;
  }

  // Check error message
  const message = error.message?.toLowerCase() || '';
  if (message.includes('network error') ||
    message.includes('connection refused') ||
    message.includes('failed to fetch')) {
    return true;
  }

  return false;
};

/**
 * Get user-friendly error message from an error object
 * Note: For full i18n support, this should use LanguageContext, but for now we'll return English
 * as the error messages are typically technical and backend-generated
 */
export const getErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'Серверт холбогдох боломжгүй. Backend сервер 3000 порт дээр ажиллаж байгаа эсэхийг шалгана уу.';
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Алдаа гарлаа. Дахин оролдоно уу.';
};

