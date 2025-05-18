/**
 * Type alias for possible biometry types
 */
export declare type BiometryType = 'TouchID' | 'FaceID' | 'Biometrics';
interface RNBiometricsOptions {
    allowDeviceCredentials?: boolean;
}
interface IsSensorAvailableResult {
    available: boolean;
    biometryType?: BiometryType;
    error?: string;
}
interface CreateKeysResult {
    publicKey: string;
}
interface BiometricKeysExistResult {
    keysExist: boolean;
}
interface DeleteKeysResult {
    keysDeleted: boolean;
}
interface CreateSignatureOptions {
    promptMessage: string;
    payload: string;
    cancelButtonText?: string;
}
interface CreateSignatureResult {
    success: boolean;
    signature?: string;
    error?: string;
}
interface SimplePromptOptions {
    promptMessage: string;
    fallbackPromptMessage?: string;
    cancelButtonText?: string;
}
interface SimplePromptResult {
    success: boolean;
    error?: string;
}
/**
 * Enum for biometric sensor types
 */
export declare const BiometryTypes: {
    readonly TouchID: "TouchID";
    readonly FaceID: "FaceID";
    readonly Biometrics: "Biometrics";
};
export declare type BiometryTypeValue = typeof BiometryTypes[keyof typeof BiometryTypes];
export declare class ReactNativeBiometrics {
    private readonly allowDeviceCredentials;
    /**
     * @param options Configuration options for biometric authentication
     * @param options.allowDeviceCredentials Whether to allow device credentials as fallback
     */
    constructor(options?: RNBiometricsOptions);
    /**
     * Checks if biometric sensor is available on the device
     * @returns Promise resolving to sensor availability details
     */
    isSensorAvailable(): Promise<IsSensorAvailableResult>;
    /**
     * Creates a new public/private key pair for biometric authentication
     * @returns Promise resolving to the generated public key
     */
    createKeys(): Promise<CreateKeysResult>;
    /**
     * Checks if biometric keys exist on the device
     * @returns Promise resolving to key existence status
     */
    biometricKeysExist(): Promise<BiometricKeysExistResult>;
    /**
     * Deletes existing biometric keys from the device
     * @returns Promise resolving to deletion status
     */
    deleteKeys(): Promise<DeleteKeysResult>;
    /**
     * Creates a cryptographic signature using biometric authentication
     * @param options Signature creation options
     * @returns Promise resolving to signature details
     */
    createSignature(options: CreateSignatureOptions): Promise<CreateSignatureResult>;
    /**
     * Prompts user for biometric authentication
     * @param options Prompt options
     * @returns Promise resolving to authentication result
     */
    simplePrompt(options: SimplePromptOptions): Promise<SimplePromptResult>;
}
export declare const ReactNativeBiometricsLegacy: {
    isSensorAvailable: () => Promise<IsSensorAvailableResult>;
    createKeys: () => Promise<CreateKeysResult>;
    biometricKeysExist: () => Promise<BiometricKeysExistResult>;
    deleteKeys: () => Promise<DeleteKeysResult>;
    createSignature: (options: CreateSignatureOptions) => Promise<CreateSignatureResult>;
    simplePrompt: (options: SimplePromptOptions) => Promise<SimplePromptResult>;
};
export default ReactNativeBiometrics;
