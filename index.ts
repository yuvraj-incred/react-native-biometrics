import { NativeModules, Platform } from 'react-native'

const { ReactNativeBiometrics: bridge } = NativeModules

/**
 * Type alias for possible biometry types
 */
export type BiometryType = 'TouchID' | 'FaceID' | 'Biometrics'

interface RNBiometricsOptions {
  allowDeviceCredentials?: boolean
}

interface IsSensorAvailableResult {
  available: boolean
  biometryType?: BiometryType
  error?: string
}

interface CreateKeysResult {
  publicKey: string
}

interface BiometricKeysExistResult {
  keysExist: boolean
}

interface DeleteKeysResult {
  keysDeleted: boolean
}

interface CreateSignatureOptions {
  promptMessage: string
  payload: string
  cancelButtonText?: string
}

interface CreateSignatureResult {
  success: boolean
  signature?: string
  error?: string
}

interface SimplePromptOptions {
  promptMessage: string
  fallbackPromptMessage?: string
  cancelButtonText?: string
}

interface SimplePromptResult {
  success: boolean
  error?: string
}

/**
 * Enum for biometric sensor types
 */
export const BiometryTypes = {
  TouchID: 'TouchID',
  FaceID: 'FaceID',
  Biometrics: 'Biometrics'
} as const

export type BiometryTypeValue = typeof BiometryTypes[keyof typeof BiometryTypes]

export class ReactNativeBiometrics {
  private readonly allowDeviceCredentials: boolean

  /**
   * @param options Configuration options for biometric authentication
   * @param options.allowDeviceCredentials Whether to allow device credentials as fallback
   */
  constructor(options?: RNBiometricsOptions) {
    this.allowDeviceCredentials = options?.allowDeviceCredentials ?? false
  }

  /**
   * Checks if biometric sensor is available on the device
   * @returns Promise resolving to sensor availability details
   */
  async isSensorAvailable(): Promise<IsSensorAvailableResult> {
    try {
      console.log('Using forked version of react-native-biometrics - isSensorAvailable called');
      return await bridge.isSensorAvailable({
        allowDeviceCredentials: this.allowDeviceCredentials
      })
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Creates a new public/private key pair for biometric authentication
   * @returns Promise resolving to the generated public key
   */
  async createKeys(): Promise<CreateKeysResult> {
    try {
      return await bridge.createKeys({
        allowDeviceCredentials: this.allowDeviceCredentials
      })
    } catch (error) {
      throw new Error(`Failed to create keys: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Checks if biometric keys exist on the device
   * @returns Promise resolving to key existence status
   */
  async biometricKeysExist(): Promise<BiometricKeysExistResult> {
    try {
      return await bridge.biometricKeysExist()
    } catch (error) {
      return { keysExist: false }
    }
  }

  /**
   * Deletes existing biometric keys from the device
   * @returns Promise resolving to deletion status
   */
  async deleteKeys(): Promise<DeleteKeysResult> {
    try {
      return await bridge.deleteKeys()
    } catch (error) {
      return { keysDeleted: false }
    }
  }

  /**
   * Creates a cryptographic signature using biometric authentication
   * @param options Signature creation options
   * @returns Promise resolving to signature details
   */
  async createSignature(options: CreateSignatureOptions): Promise<CreateSignatureResult> {
    try {
      const signatureOptions = {
        allowDeviceCredentials: this.allowDeviceCredentials,
        cancelButtonText: options.cancelButtonText ?? 'Cancel',
        ...options
      }

      return await bridge.createSignature(signatureOptions)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create signature'
      }
    }
  }

  /**
   * Prompts user for biometric authentication
   * @param options Prompt options
   * @returns Promise resolving to authentication result
   */
  async simplePrompt(options: SimplePromptOptions): Promise<SimplePromptResult> {
    try {
      const promptOptions = {
        allowDeviceCredentials: this.allowDeviceCredentials,
        cancelButtonText: options.cancelButtonText ?? 'Cancel',
        fallbackPromptMessage: options.fallbackPromptMessage ?? 'Use Passcode',
        ...options
      }

      return await bridge.simplePrompt(promptOptions)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }
}

// For backward compatibility
export const ReactNativeBiometricsLegacy = {
  isSensorAvailable: () => new ReactNativeBiometrics().isSensorAvailable(),
  createKeys: () => new ReactNativeBiometrics().createKeys(),
  biometricKeysExist: () => new ReactNativeBiometrics().biometricKeysExist(),
  deleteKeys: () => new ReactNativeBiometrics().deleteKeys(),
  createSignature: (options: CreateSignatureOptions) => new ReactNativeBiometrics().createSignature(options),
  simplePrompt: (options: SimplePromptOptions) => new ReactNativeBiometrics().simplePrompt(options)
}

export default ReactNativeBiometrics
