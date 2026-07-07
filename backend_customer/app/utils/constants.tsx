// app/utils/constants.ts

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
    },
    USERS: {
      LIST: '/users',
      CREATE: '/users',
      UPDATE: (id: string) => `/users/${id}`,
      DELETE: (id: string) => `/users/${id}`,
      GET: (id: string) => `/users/${id}`,
    },
    PRODUCTS: {
      LIST: '/products',
      CREATE: '/products',
      UPDATE: (id: string) => `/products/${id}`,
      DELETE: (id: string) => `/products/${id}`,
      GET: (id: string) => `/products/${id}`,
    },
    ORDERS: {
      LIST: '/orders',
      CREATE: '/orders',
      UPDATE: (id: string) => `/orders/${id}`,
      DELETE: (id: string) => `/orders/${id}`,
      GET: (id: string) => `/orders/${id}`,
    },
    DASHBOARD: {
      STATS: '/dashboard/stats',
      ACTIVITIES: '/dashboard/activities',
    },
  } as const;
  
  // Application Settings
  export const APP_CONFIG = {
    NAME: 'Reach 10 App',
    VERSION: '1.0.0',
    DESCRIPTION: 'Client Operations Management System',
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 20,
      PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    },
    DEBOUNCE_DELAY: 300,
    NOTIFICATION_DURATION: 5000,
  } as const;
  
  // User Roles and Permissions
  export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
  } as const;
  
  export const PERMISSIONS = {
    USERS: {
      VIEW: 'users:view',
      CREATE: 'users:create',
      UPDATE: 'users:update',
      DELETE: 'users:delete',
    },
    PRODUCTS: {
      VIEW: 'products:view',
      CREATE: 'products:create',
      UPDATE: 'products:update',
      DELETE: 'products:delete',
    },
    ORDERS: {
      VIEW: 'orders:view',
      CREATE: 'orders:create',
      UPDATE: 'orders:update',
      DELETE: 'orders:delete',
    },
    DASHBOARD: {
      VIEW: 'dashboard:view',
    },
  } as const;
  
  // Role Permissions Mapping
  export const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: [
      ...Object.values(PERMISSIONS.USERS),
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.ORDERS),
      ...Object.values(PERMISSIONS.DASHBOARD),
    ],
    [USER_ROLES.MANAGER]: [
      PERMISSIONS.USERS.VIEW,
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.ORDERS),
      ...Object.values(PERMISSIONS.DASHBOARD),
    ],
    [USER_ROLES.USER]: [
      PERMISSIONS.USERS.VIEW,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.CREATE,
      PERMISSIONS.DASHBOARD.VIEW,
    ],
  } as const;
  
  // Status Options
  export const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'shipped', label: 'Shipped', color: 'purple' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ] as const;
  
  export const USER_STATUSES = [
    { value: true, label: 'Active', color: 'green' },
    { value: false, label: 'Inactive', color: 'red' },
  ] as const;
  
  // Form Validation Rules
  export const VALIDATION_RULES = {
    EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    PASSWORD: {
      MIN_LENGTH: 8,
      PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },
    PHONE: /^\+?[\d\s-()]+$/,
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
    },
    PRICE: {
      MIN: 0,
      MAX: 999999.99,
    },
  } as const;
  
  // Error Messages
  export const ERROR_MESSAGES = {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PASSWORD: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
    INVALID_PHONE: 'Please enter a valid phone number',
    MIN_LENGTH: (min: number) => `Must be at least ${min} characters long`,
    MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
    MIN_VALUE: (min: number) => `Must be at least ${min}`,
    MAX_VALUE: (max: number) => `Must not exceed ${max}`,
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'The requested resource was not found',
  } as const;
  
  // Success Messages
  export const SUCCESS_MESSAGES = {
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    SAVED: 'Saved successfully',
    LOGIN: 'Logged in successfully',
    LOGOUT: 'Logged out successfully',
  } as const;
  
  // Date Formats
  export const DATE_FORMATS = {
    DISPLAY: 'MMM dd, yyyy',
    INPUT: 'yyyy-MM-dd',
    DATETIME: 'MMM dd, yyyy HH:mm',
    TIME: 'HH:mm',
  } as const;
  
  // Theme Colors
  export const THEME_COLORS = {
    PRIMARY: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    GRAY: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      600: '#4b5563',
      900: '#111827',
    },
    SUCCESS: {
      50: '#f0fdf4',
      500: '#10b981',
      600: '#059669',
    },
    ERROR: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
    WARNING: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
  } as const;
  
  // Storage Keys
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'softkit_auth_token',
    USER_DATA: 'softkit_user_data',
    PREFERENCES: 'softkit_preferences',
    THEME: 'softkit_theme',
  } as const;
  
  // Export types for better TypeScript support
  export type OrderStatus = typeof ORDER_STATUSES[number]['value'];
  export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
  export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];