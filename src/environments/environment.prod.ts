export const environment = {
  production: true,
  supabase: {
    url: 'https://ldymwxewqimxqnzmvblo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeW13eGV3cWlteHFuem12YmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Mjk3NzUsImV4cCI6MjA3ODMwNTc3NX0.Pm3i4WHWy7nj2Cum9KkljI7mA738QercLnbqgQxksGQ',
  },
  cacheExpiryDays: 7,
  searchResultLimit: 50,
  articlesPerPage: 20,
  partsPerPage: 20,
  // Admin dashboard configuration
  admin: {
    sessionTimeoutMinutes: 30,
    maxFailedLoginAttempts: 5,
    accountLockoutMinutes: 15,
    maxImageSizeMB: 5,
    trashRetentionDays: 30,
    activityLogRetentionDays: 90,
    metricsCacheTTLMinutes: 5,
    activityFeedRefreshSeconds: 30,
  },
};
