/**
 * ==================================================================
 * KOVELI DEVICE AUTHENTICATION CONFIGURATION
 * ==================================================================
 * This file contains the master password for device authorization.
 * The HTML page loads this file to validate the one-time password.
 * 
 * SECURITY RECOMMENDATIONS:
 * 1. Change the default password to a strong, unique value
 * 2. Use a combination of uppercase, lowercase, numbers, and symbols
 * 3. Store this file securely on your server
 * 4. Consider additional server-side validation for production
 * ==================================================================
 */

window.AUTH_CONFIG = {
    /**
     * Device Master Password
     * Required for device authorization - one-time entry enforced
     * 
     * CHANGE THIS PASSWORD BEFORE DEPLOYMENT!
     * Default: MA2026SECURE
     */
    deviceMasterPassword: "MACL2026SECURE",
    
    /**
     * Optional configuration settings
     * You can extend this object with additional settings as needed
     */
    
    // Session timeout in milliseconds (optional, e.g., 8 hours = 28800000)
    // sessionTimeout: 28800000,
    
    // Maximum number of failed attempts before lockout (optional)
    // maxFailedAttempts: 5,
    
    // Redirect URL after successful authorization (optional, defaults to dashboard.html)
    // redirectUrl: "dashboard.html",
    
    // Enable console logging for debugging (set to false in production)
    debugMode: false
};

// Optional: Freeze the configuration to prevent accidental modifications
if (Object.freeze) {
    Object.freeze(window.AUTH_CONFIG);
}

// Optional: Log confirmation that config loaded (only in debug mode)
if (window.AUTH_CONFIG.debugMode) {
    console.log("[Koveli] deviceauth.js loaded successfully");
    console.log("[Koveli] Master password configured (length: " + window.AUTH_CONFIG.deviceMasterPassword.length + " chars)");
}
