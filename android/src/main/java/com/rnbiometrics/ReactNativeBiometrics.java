package com.rnbiometrics;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.biometric.BiometricPrompt.AuthenticationCallback;
import androidx.biometric.BiometricPrompt.PromptInfo;
import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAKeyGenParameterSpec;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Created by brandon on 4/5/18.
 */

public class ReactNativeBiometrics extends ReactContextBaseJavaModule {

    private static final String TAG = "ReactNativeBiometrics";

    protected String biometricKeyAlias = "biometric_key";

    public ReactNativeBiometrics(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ReactNativeBiometrics";
    }

    @ReactMethod
    public void isSensorAvailable(final ReadableMap params, final Promise promise) {
        try {
            if (isCurrentSDKMarshmallowOrLater()) {
                boolean allowDeviceCredentials = params.getBoolean("allowDeviceCredentials");
                ReactApplicationContext reactApplicationContext = getReactApplicationContext();
                BiometricManager biometricManager = BiometricManager.from(reactApplicationContext);
                
                // Log available authenticators
                int authenticators = getAllowedAuthenticators(allowDeviceCredentials);
                Log.d(TAG, "Available authenticators: " + getAuthenticatorString(authenticators));
                
                int canAuthenticate = biometricManager.canAuthenticate(authenticators);
                Log.d(TAG, "Can authenticate result: " + getAuthenticationResultString(canAuthenticate));

                if (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS) {
                    WritableMap resultMap = new WritableNativeMap();
                    resultMap.putBoolean("available", true);
                    resultMap.putString("biometryType", "Biometrics");
                    Log.d(TAG, "Biometric sensor is available");
                    promise.resolve(resultMap);
                } else {
                    WritableMap resultMap = new WritableNativeMap();
                    resultMap.putBoolean("available", false);

                    String errorMessage = "";
                    switch (canAuthenticate) {
                        case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                            errorMessage = "BIOMETRIC_ERROR_NO_HARDWARE";
                            break;
                        case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                            errorMessage = "BIOMETRIC_ERROR_HW_UNAVAILABLE";
                            break;
                        case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                            errorMessage = "BIOMETRIC_ERROR_NONE_ENROLLED";
                            break;
                        case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                            errorMessage = "BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED";
                            break;
                    }
                    Log.d(TAG, "Biometric sensor error: " + errorMessage);
                    resultMap.putString("error", errorMessage);
                    promise.resolve(resultMap);
                }
            } else {
                Log.d(TAG, "Android version not supported for biometrics");
                WritableMap resultMap = new WritableNativeMap();
                resultMap.putBoolean("available", false);
                resultMap.putString("error", "Unsupported android version");
                promise.resolve(resultMap);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error detecting biometrics availability: " + e.getMessage());
            promise.reject("Error detecting biometrics availability: " + e.getMessage(), "Error detecting biometrics availability: " + e.getMessage());
        }
    }

    @ReactMethod
    public void createKeys(final ReadableMap params, Promise promise) {
        try {
            if (isCurrentSDKMarshmallowOrLater()) {
                deleteBiometricKey();
                KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore");
                
                // Configure key parameters based on Android version
                KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(biometricKeyAlias, KeyProperties.PURPOSE_SIGN)
                        .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
                        .setUserAuthenticationRequired(true)
                        .setUserAuthenticationValidityDurationSeconds(-1);

                // Add version-specific configurations
                if (isCurrentSDKPieOrLater()) {
                    // Android 9.0 (API 28) and above: Use strongest available options
                    builder.setDigests(KeyProperties.DIGEST_SHA512)
                           .setAlgorithmParameterSpec(new RSAKeyGenParameterSpec(4096, RSAKeyGenParameterSpec.F4))
                           .setUserPresenceRequired(true)
                           .setAttestationChallenge(null);
                } else if (isCurrentSDKOreoOrLater()) {
                    // Android 8.0-8.1 (API 26-27): Use SHA-512 but with 2048-bit RSA
                    builder.setDigests(KeyProperties.DIGEST_SHA512)
                           .setAlgorithmParameterSpec(new RSAKeyGenParameterSpec(2048, RSAKeyGenParameterSpec.F4));
                } else {
                    // Android 6.0-7.1 (API 23-25): Use SHA-256 with 2048-bit RSA
                    builder.setDigests(KeyProperties.DIGEST_SHA256)
                           .setAlgorithmParameterSpec(new RSAKeyGenParameterSpec(2048, RSAKeyGenParameterSpec.F4));
                }

                keyPairGenerator.initialize(builder.build());

                KeyPair keyPair = keyPairGenerator.generateKeyPair();
                PublicKey publicKey = keyPair.getPublic();
                byte[] encodedPublicKey = publicKey.getEncoded();
                String publicKeyString = Base64.encodeToString(encodedPublicKey, Base64.NO_WRAP);

                WritableMap resultMap = new WritableNativeMap();
                resultMap.putString("publicKey", publicKeyString);
                promise.resolve(resultMap);
            } else {
                promise.reject("Cannot generate keys on android versions below 6.0", "Cannot generate keys on android versions below 6.0");
            }
        } catch (Exception e) {
            promise.reject("Error generating public private keys: " + e.getMessage(), "Error generating public private keys");
        }
    }

    private boolean isCurrentSDKMarshmallowOrLater() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M;
    }

    @ReactMethod
    public void deleteKeys(Promise promise) {
        if (doesBiometricKeyExist()) {
            boolean deletionSuccessful = deleteBiometricKey();

            if (deletionSuccessful) {
                WritableMap resultMap = new WritableNativeMap();
                resultMap.putBoolean("keysDeleted", true);
                promise.resolve(resultMap);
            } else {
                promise.reject("Error deleting biometric key from keystore", "Error deleting biometric key from keystore");
            }
        } else {
            WritableMap resultMap = new WritableNativeMap();
            resultMap.putBoolean("keysDeleted", false);
            promise.resolve(resultMap);
        }
    }

    @ReactMethod
    public void createSignature(final ReadableMap params, final Promise promise) {
        if (isCurrentSDKMarshmallowOrLater()) {
            UiThreadUtil.runOnUiThread(
                    new Runnable() {
                        @Override
                        public void run() {
                            try {
                                String promptMessage = params.getString("promptMessage");
                                String payload = params.getString("payload");
                                String cancelButtonText = params.getString("cancelButtonText");
                                boolean allowDeviceCredentials = params.getBoolean("allowDeviceCredentials");

                                // Choose signature algorithm based on Android version
                                String signatureAlgorithm;
                                if (isCurrentSDKPieOrLater()) {
                                    signatureAlgorithm = "SHA512withRSA";
                                } else if (isCurrentSDKOreoOrLater()) {
                                    signatureAlgorithm = "SHA512withRSA";
                                } else {
                                    signatureAlgorithm = "SHA256withRSA";
                                }

                                Signature signature = Signature.getInstance(signatureAlgorithm);
                                KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
                                keyStore.load(null);

                                PrivateKey privateKey = (PrivateKey) keyStore.getKey(biometricKeyAlias, null);
                                signature.initSign(privateKey);

                                BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(signature);

                                AuthenticationCallback authCallback = new CreateSignatureCallback(promise, payload);
                                FragmentActivity fragmentActivity = (FragmentActivity) getCurrentActivity();
                                Executor executor = Executors.newSingleThreadExecutor();
                                BiometricPrompt biometricPrompt = new BiometricPrompt(fragmentActivity, executor, authCallback);

                                biometricPrompt.authenticate(getPromptInfo(promptMessage, cancelButtonText, allowDeviceCredentials), cryptoObject);
                            } catch (Exception e) {
                                promise.reject("Error signing payload: " + e.getMessage(), "Error generating signature: " + e.getMessage());
                            }
                        }
                    });
        } else {
            promise.reject("Cannot generate keys on android versions below 6.0", "Cannot generate keys on android versions below 6.0");
        }
    }

    private PromptInfo getPromptInfo(String promptMessage, String cancelButtonText, boolean allowDeviceCredentials) {
        PromptInfo.Builder builder = new PromptInfo.Builder().setTitle(promptMessage);

        builder.setAllowedAuthenticators(getAllowedAuthenticators(allowDeviceCredentials));

        if (allowDeviceCredentials == false || isCurrentSDK29OrEarlier()) {
            builder.setNegativeButtonText(cancelButtonText);
        }

        return builder.build();
    }

    private int getAllowedAuthenticators(boolean allowDeviceCredentials) {
        if (allowDeviceCredentials && !isCurrentSDK29OrEarlier()) {
            return BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        }
        return BiometricManager.Authenticators.BIOMETRIC_STRONG;
    }

    private boolean isCurrentSDK29OrEarlier() {
        return Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q;
    }

    @ReactMethod
    public void simplePrompt(final ReadableMap params, final Promise promise) {
        if (isCurrentSDKMarshmallowOrLater()) {
            UiThreadUtil.runOnUiThread(
                    new Runnable() {
                        @Override
                        public void run() {
                            try {
                                String promptMessage = params.getString("promptMessage");
                                String cancelButtonText = params.getString("cancelButtonText");
                                boolean allowDeviceCredentials = params.getBoolean("allowDeviceCredentials");

                                Log.d(TAG, "Starting biometric prompt with allowDeviceCredentials: " + allowDeviceCredentials);
                                
                                AuthenticationCallback authCallback = new SimplePromptCallback(promise);
                                FragmentActivity fragmentActivity = (FragmentActivity) getCurrentActivity();
                                Executor executor = Executors.newSingleThreadExecutor();
                                BiometricPrompt biometricPrompt = new BiometricPrompt(fragmentActivity, executor, authCallback);

                                PromptInfo promptInfo = getPromptInfo(promptMessage, cancelButtonText, allowDeviceCredentials);
                                Log.d(TAG, "Prompt info created with authenticators: " + getAuthenticatorString(promptInfo.getAllowedAuthenticators()));
                                
                                biometricPrompt.authenticate(promptInfo);
                            } catch (Exception e) {
                                Log.e(TAG, "Error displaying local biometric prompt: " + e.getMessage());
                                promise.reject("Error displaying local biometric prompt: " + e.getMessage(), "Error displaying local biometric prompt: " + e.getMessage());
                            }
                        }
                    });
        } else {
            Log.d(TAG, "Cannot display biometric prompt on android versions below 6.0");
            promise.reject("Cannot display biometric prompt on android versions below 6.0", "Cannot display biometric prompt on android versions below 6.0");
        }
    }

    @ReactMethod
    public void biometricKeysExist(Promise promise) {
        try {
            boolean doesBiometricKeyExist = doesBiometricKeyExist();
            WritableMap resultMap = new WritableNativeMap();
            resultMap.putBoolean("keysExist", doesBiometricKeyExist);
            promise.resolve(resultMap);
        } catch (Exception e) {
            promise.reject("Error checking if biometric key exists: " + e.getMessage(), "Error checking if biometric key exists: " + e.getMessage());
        }
    }

    protected boolean doesBiometricKeyExist() {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            return keyStore.containsAlias(biometricKeyAlias);
        } catch (Exception e) {
            return false;
        }
    }

    protected boolean deleteBiometricKey() {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            keyStore.deleteEntry(biometricKeyAlias);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isCurrentSDKPieOrLater() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P;
    }

    private boolean isCurrentSDKOreoOrLater() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    }

    private String getAuthenticatorString(int authenticators) {
        StringBuilder sb = new StringBuilder();
        if ((authenticators & BiometricManager.Authenticators.BIOMETRIC_STRONG) != 0) {
            sb.append("BIOMETRIC_STRONG ");
        }
        if ((authenticators & BiometricManager.Authenticators.BIOMETRIC_WEAK) != 0) {
            sb.append("BIOMETRIC_WEAK ");
        }
        if ((authenticators & BiometricManager.Authenticators.DEVICE_CREDENTIAL) != 0) {
            sb.append("DEVICE_CREDENTIAL ");
        }
        return sb.toString().trim();
    }

    private String getAuthenticationResultString(int result) {
        switch (result) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                return "BIOMETRIC_SUCCESS";
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                return "BIOMETRIC_ERROR_NO_HARDWARE";
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return "BIOMETRIC_ERROR_HW_UNAVAILABLE";
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return "BIOMETRIC_ERROR_NONE_ENROLLED";
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                return "BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED";
            default:
                return "UNKNOWN_ERROR";
        }
    }
}
