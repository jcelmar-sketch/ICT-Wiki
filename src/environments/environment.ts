// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  supabase: {
    url: 'https://ldymwxewqimxqnzmvblo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeW13eGV3cWlteHFuem12YmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3Mjk3NzUsImV4cCI6MjA3ODMwNTc3NX0.Pm3i4WHWy7nj2Cum9KkljI7mA738QercLnbqgQxksGQ',
  },
  cacheExpiryDays: 7,
  searchResultLimit: 50,
  articlesPerPage: 20,
  partsPerPage: 20,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
