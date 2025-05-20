package com.rnbiometrics;

import android.util.Log;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricPrompt;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

public class SimplePromptCallback extends BiometricPrompt.AuthenticationCallback {
    private static final String TAG = "SimplePromptCallback";
    private Promise promise;

    public SimplePromptCallback(Promise promise) {
        super();
        this.promise = promise;
    }

    @Override
    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
        super.onAuthenticationError(errorCode, errString);
        Log.d(TAG, "Authentication error: " + errorCode + " - " + errString);
        
        if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON || errorCode == BiometricPrompt.ERROR_USER_CANCELED) {
            Log.d(TAG, "User cancelled authentication");
            WritableMap resultMap = new WritableNativeMap();
            resultMap.putBoolean("success", false);
            resultMap.putString("error", "User cancellation");
            this.promise.resolve(resultMap);
        } else {
            Log.e(TAG, "Authentication failed: " + errString);
            this.promise.reject(errString.toString(), errString.toString());
        }
    }

    @Override
    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
        super.onAuthenticationSucceeded(result);
        Log.d(TAG, "Authentication succeeded");
        
        // Log the type of authentication used
        int authType = result.getAuthenticationType();
        String authTypeStr = authType == BiometricPrompt.AUTHENTICATION_RESULT_TYPE_BIOMETRIC ? 
            "BIOMETRIC" : "DEVICE_CREDENTIAL";
        Log.d(TAG, "Authentication type: " + authTypeStr);

        WritableMap resultMap = new WritableNativeMap();
        resultMap.putBoolean("success", true);
        this.promise.resolve(resultMap);
    }
}
