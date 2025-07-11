//
//  ReactNativeBiometrics.m
//
//  Created by Brandon Hines on 4/3/18.
//

#import "ReactNativeBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <Security/Security.h>
#import <React/RCTConvert.h>
#import <os/log.h>

@implementation ReactNativeBiometrics

RCT_EXPORT_MODULE(ReactNativeBiometrics);

RCT_EXPORT_METHOD(isSensorAvailable: (NSDictionary *)params resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;
  BOOL allowDeviceCredentials = [RCTConvert BOOL:params[@"allowDeviceCredentials"]];
  LAPolicy laPolicy = LAPolicyDeviceOwnerAuthenticationWithBiometrics;

  if (allowDeviceCredentials == TRUE) {
    laPolicy = LAPolicyDeviceOwnerAuthentication;
  }

  BOOL canEvaluatePolicy = [context canEvaluatePolicy:laPolicy error:&la_error];

  if (canEvaluatePolicy) {
    NSString *biometryType = [self getBiometryType:context];
    NSDictionary *result = @{
      @"available": @(YES),
      @"biometryType": biometryType
    };

    resolve(result);
  } else {
    NSString *errorMessage = [NSString stringWithFormat:@"%@", la_error];
    NSDictionary *result = @{
      @"available": @(NO),
      @"error": errorMessage
    };

    resolve(result);
  }
}

RCT_EXPORT_METHOD(createKeys: (NSDictionary *)params resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @try {
      CFErrorRef error = NULL;
      BOOL allowDeviceCredentials = [RCTConvert BOOL:params[@"allowDeviceCredentials"]];

      SecAccessControlCreateFlags secCreateFlag = kSecAccessControlBiometryAny;

      if (allowDeviceCredentials == TRUE) {
        secCreateFlag = kSecAccessControlUserPresence;
      }

      SecAccessControlRef sacObject = SecAccessControlCreateWithFlags(kCFAllocatorDefault,
                                                                      kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
                                                                      secCreateFlag, &error);
      if (sacObject == NULL || error != NULL) {
        NSString *errorString = [NSString stringWithFormat:@"SecItemAdd can't create sacObject: %@", error];
        reject(@"storage_error", errorString, nil);
        return;
      }

      NSData *biometricKeyTag = [self getBiometricKeyTag];
      if (!biometricKeyTag) {
        reject(@"storage_error", @"Failed to create biometric key tag", nil);
        return;
      }

      NSDictionary *keyAttributes = @{
                                      (id)kSecClass: (id)kSecClassKey,
                                      (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
                                      (id)kSecAttrKeySizeInBits: @4096,
                                      (id)kSecPrivateKeyAttrs: @{
                                          (id)kSecAttrIsPermanent: @YES,
                                          (id)kSecUseAuthenticationUI: (id)kSecUseAuthenticationUIAllow,
                                          (id)kSecAttrApplicationTag: biometricKeyTag,
                                          (id)kSecAttrAccessControl: (__bridge_transfer id)sacObject
                                          }
                                      };

      [self deleteBiometricKey];
      NSError *gen_error = nil;
      id privateKey = CFBridgingRelease(SecKeyCreateRandomKey((__bridge CFDictionaryRef)keyAttributes, (void *)&gen_error));

      if(privateKey != nil) {
        id publicKey = CFBridgingRelease(SecKeyCopyPublicKey((SecKeyRef)privateKey));
        if (!publicKey) {
          reject(@"storage_error", @"Failed to get public key", nil);
          return;
        }
        
        CFDataRef publicKeyDataRef = SecKeyCopyExternalRepresentation((SecKeyRef)publicKey, nil);
        if (!publicKeyDataRef) {
          reject(@"storage_error", @"Failed to get public key data", nil);
          return;
        }
        
        NSData *publicKeyData = (__bridge NSData *)publicKeyDataRef;
        NSData *publicKeyDataWithHeader = [self addHeaderPublickey:publicKeyData];
        if (!publicKeyDataWithHeader) {
          reject(@"storage_error", @"Failed to add header to public key", nil);
          return;
        }
        
        NSString *publicKeyString = [publicKeyDataWithHeader base64EncodedStringWithOptions:0];

        NSDictionary *result = @{
          @"publicKey": publicKeyString,
        };
        resolve(result);
      } else {
        NSString *message = [NSString stringWithFormat:@"Key generation error: %@", gen_error];
        reject(@"storage_error", message, nil);
      }
    } @catch (NSException *exception) {
      reject(@"storage_error", [NSString stringWithFormat:@"Exception during key creation: %@", exception], nil);
    }
  });
}

RCT_EXPORT_METHOD(deleteKeys: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    BOOL biometricKeyExists = [self doesBiometricKeyExist];

    if (biometricKeyExists) {
      OSStatus status = [self deleteBiometricKey];

      if (status == noErr) {
        NSDictionary *result = @{
          @"keysDeleted": @(YES),
        };
        resolve(result);
      } else {
        NSString *message = [NSString stringWithFormat:@"Key not found: %@",[self keychainErrorToString:status]];
        reject(@"deletion_error", message, nil);
      }
    } else {
        NSDictionary *result = @{
          @"keysDeleted": @(NO),
        };
        resolve(result);
    }
  });
}

RCT_EXPORT_METHOD(createSignature: (NSDictionary *)params resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSString *promptMessage = [RCTConvert NSString:params[@"promptMessage"]];
    NSString *payload = [RCTConvert NSString:params[@"payload"]];

    if (!promptMessage || !payload) {
      reject(@"invalid_params", @"Missing required parameters", nil);
      return;
    }

    NSData *biometricKeyTag = [self getBiometricKeyTag];
    NSDictionary *query = @{
                            (id)kSecClass: (id)kSecClassKey,
                            (id)kSecAttrApplicationTag: biometricKeyTag,
                            (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
                            (id)kSecReturnRef: @YES,
                            (id)kSecUseOperationPrompt: promptMessage
                            };
    SecKeyRef privateKey;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, (CFTypeRef *)&privateKey);

    if (status == errSecSuccess) {
      NSError *error;
      NSData *dataToSign = [payload dataUsingEncoding:NSUTF8StringEncoding];
      NSData *signature = CFBridgingRelease(SecKeyCreateSignature(privateKey, kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA512, (CFDataRef)dataToSign, (void *)&error));

      if (signature != nil) {
        NSString *signatureString = [signature base64EncodedStringWithOptions:0];
        NSDictionary *result = @{
          @"success": @(YES),
          @"signature": signatureString
        };
        resolve(result);
      } else if (error.code == errSecUserCanceled) {
        NSDictionary *result = @{
          @"success": @(NO),
          @"error": @"User cancellation"
        };
        resolve(result);
      } else {
        NSString *message = [NSString stringWithFormat:@"Signature error: %@", error];
        reject(@"signature_error", message, nil);
      }
    } else {
      NSString *message = [NSString stringWithFormat:@"Key not found: %@",[self keychainErrorToString:status]];
      reject(@"storage_error", message, nil);
    }
  });
}

RCT_EXPORT_METHOD(simplePrompt: (NSDictionary *)params resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *promptMessage = [RCTConvert NSString:params[@"promptMessage"]];
    NSString *fallbackPromptMessage = [RCTConvert NSString:params[@"fallbackPromptMessage"]];
    BOOL allowDeviceCredentials = [RCTConvert BOOL:params[@"allowDeviceCredentials"]];

    if (!promptMessage) {
      reject(@"invalid_params", @"Missing prompt message", nil);
      return;
    }

    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;
    
    // First try biometric authentication
    if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
      context.localizedFallbackTitle = allowDeviceCredentials ? (fallbackPromptMessage ?: @"Use Passcode") : @"";
      
      [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics 
              localizedReason:promptMessage 
                        reply:^(BOOL success, NSError *biometricError) {
        if (success) {
          NSDictionary *result = @{
            @"success": @(YES)
          };
          resolve(result);
        } else if (biometricError.code == LAErrorUserCancel) {
          NSDictionary *result = @{
            @"success": @(NO),
            @"error": @"User cancellation"
          };
          resolve(result);
        } else if (biometricError.code == LAErrorSystemCancel) {
          NSDictionary *result = @{
            @"success": @(NO),
            @"error": @"System cancelled"
          };
          resolve(result);
        } else if (biometricError.code == LAErrorAppCancel) {
          NSDictionary *result = @{
            @"success": @(NO),
            @"error": @"App cancelled"
          };
          resolve(result);
        } else if (allowDeviceCredentials) {
          // If biometric fails and device credentials are allowed, try device authentication
          [self tryDeviceAuthentication:context 
                         promptMessage:promptMessage 
                  fallbackPromptMessage:fallbackPromptMessage 
                              resolver:resolve 
                              rejecter:reject];
        } else {
          NSString *message = [NSString stringWithFormat:@"%@", biometricError];
          reject(@"biometric_error", message, nil);
        }
      }];
    } else if (allowDeviceCredentials) {
      // If biometric is not available and device credentials are allowed, try device authentication
      [self tryDeviceAuthentication:context 
                     promptMessage:promptMessage 
              fallbackPromptMessage:fallbackPromptMessage 
                          resolver:resolve 
                          rejecter:reject];
    } else {
      NSString *message = [NSString stringWithFormat:@"Biometric authentication not available: %@", error];
      reject(@"biometric_error", message, nil);
    }
  });
}

- (void)tryDeviceAuthentication:(LAContext *)context 
                  promptMessage:(NSString *)promptMessage 
           fallbackPromptMessage:(NSString *)fallbackPromptMessage 
                       resolver:(RCTPromiseResolveBlock)resolve 
                       rejecter:(RCTPromiseRejectBlock)reject {
  context.localizedFallbackTitle = fallbackPromptMessage ?: @"Use Passcode";
  
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication 
          localizedReason:promptMessage 
                    reply:^(BOOL success, NSError *deviceError) {
    if (success) {
      NSDictionary *result = @{
        @"success": @(YES)
      };
      resolve(result);
    } else if (deviceError.code == LAErrorUserCancel) {
      NSDictionary *result = @{
        @"success": @(NO),
        @"error": @"User cancellation"
      };
      resolve(result);
    } else {
      NSString *message = [NSString stringWithFormat:@"%@", deviceError];
      reject(@"biometric_error", message, nil);
    }
  }];
}

RCT_EXPORT_METHOD(biometricKeysExist: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    BOOL biometricKeyExists = [self doesBiometricKeyExist];

    if (biometricKeyExists) {
      NSDictionary *result = @{
        @"keysExist": @(YES)
      };
      resolve(result);
    } else {
      NSDictionary *result = @{
        @"keysExist": @(NO)
      };
      resolve(result);
    }
  });
}

- (NSData *) getBiometricKeyTag {
  NSString *biometricKeyAlias = @"com.rnbiometrics.biometricKey";
  NSData *biometricKeyTag = [biometricKeyAlias dataUsingEncoding:NSUTF8StringEncoding];
  return biometricKeyTag;
}

- (BOOL) doesBiometricKeyExist {
  NSData *biometricKeyTag = [self getBiometricKeyTag];
  NSDictionary *searchQuery = @{
                                (id)kSecClass: (id)kSecClassKey,
                                (id)kSecAttrApplicationTag: biometricKeyTag,
                                (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
                                (id)kSecUseAuthenticationUI: (id)kSecUseAuthenticationUIFail
                                };

  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)searchQuery, nil);
  return status == errSecSuccess || status == errSecInteractionNotAllowed;
}

-(OSStatus) deleteBiometricKey {
  NSData *biometricKeyTag = [self getBiometricKeyTag];
  NSDictionary *deleteQuery = @{
                                (id)kSecClass: (id)kSecClassKey,
                                (id)kSecAttrApplicationTag: biometricKeyTag,
                                (id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA
                                };

  return SecItemDelete((__bridge CFDictionaryRef)deleteQuery);
}

- (NSString *) getBiometryType:(LAContext *)context {
  if (@available(iOS 11, *)) {
    if (context.biometryType == LABiometryTypeFaceID) {
      return @"FaceID";
    } else if (context.biometryType == LABiometryTypeTouchID) {
      return @"TouchID";
    }
  }
  return @"Biometrics";
}

- (NSData *) addHeaderPublickey:(NSData *)publicKeyData {
  if (!publicKeyData || publicKeyData.length == 0) {
    return nil;
  }

  unsigned char builder[15];
  unsigned long bitstringEncLength;
  if (publicKeyData.length + 1 < 128)
    bitstringEncLength = 1;
  else
    bitstringEncLength = ((publicKeyData.length + 1) / 256) + 2;
  
  builder[0] = 0x30;
  size_t i = sizeof(builder) - 1;
  
  // Ensure we don't write beyond array bounds
  size_t bytesToCopy = MIN(publicKeyData.length, i);
  
  builder[i--] = 0x00;
  const unsigned char *bytes = (const unsigned char *)publicKeyData.bytes;
  for (size_t j = 0; j < bytesToCopy; j++) {
    builder[i--] = bytes[j];
  }
  
  // Fill remaining space with zeros if needed
  while (i > 0) {
    builder[i--] = 0x00;
  }
  
  builder[i] = bitstringEncLength;
  builder[0] = 0x30;
  
  NSMutableData *encKey = [[NSMutableData alloc] init];
  [encKey appendBytes:builder length:sizeof(builder)];
  [encKey appendData:publicKeyData];
  return encKey;
}

- (NSString *) keychainErrorToString:(OSStatus)error {
  NSString *message = [NSString stringWithFormat:@"%ld", (long)error];
  
  switch (error) {
    case errSecSuccess:
      message = @"success";
      break;
    case errSecDuplicateItem:
      message = @"error item already exists";
      break;
    case errSecItemNotFound:
      message = @"error item not found";
      break;
    case errSecAuthFailed:
      message = @"error item auth failed";
      break;
    default:
      message = [NSString stringWithFormat:@"error unknown OSStatus: %ld", (long)error];
  }
  
  return message;
}

@end
