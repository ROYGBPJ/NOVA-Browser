import { requireNativeModule, EventEmitter } from 'expo-modules-core';

export type RemoteCommand =
  | 'play' | 'pause' | 'toggle' | 'next' | 'previous' | 'skipForward' | 'skipBackward' | 'seek';

interface NovaMediaNative {
  configureSession(mixWithOthers: boolean): Promise<void>;
  deactivateSession(): Promise<void>;
  setNowPlaying(info: Record<string, unknown>): Promise<void>;
  clearNowPlaying(): Promise<void>;
  setSupportedCommands(caps: Record<string, boolean>): Promise<void>;
}
type NativeSubscription = { remove(): void };

const native = requireNativeModule<NovaMediaNative>('NovaMedia');
// Expo SDK 52's EventEmitter event map is not inferred from a dynamically loaded native module.
const emitter = new EventEmitter(native as never) as unknown as {
  addListener(eventName: string, listener: (event: any) => void): NativeSubscription;
};

export const NovaMedia = {
  ...native,
  onRemoteCommand(cb: (e: { command: RemoteCommand; position?: number; interval?: number }) => void): NativeSubscription {
    return emitter.addListener('onRemoteCommand', cb);
  },
  onInterruption(cb: (e: { phase: 'began' | 'ended'; shouldResume?: boolean }) => void): NativeSubscription {
    return emitter.addListener('onInterruption', cb);
  },
  onRouteChange(cb: (e: { reason: 'deviceDisconnected' | 'other' }) => void): NativeSubscription {
    return emitter.addListener('onRouteChange', cb);
  },
};
