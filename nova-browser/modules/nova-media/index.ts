import { requireNativeModule, EventEmitter, type Subscription } from 'expo-modules-core';

export type RemoteCommand =
  | 'play' | 'pause' | 'toggle' | 'next' | 'previous' | 'skipForward' | 'skipBackward' | 'seek';

interface NovaMediaNative {
  configureSession(mixWithOthers: boolean): Promise<void>;
  deactivateSession(): Promise<void>;
  setNowPlaying(info: Record<string, unknown>): Promise<void>;
  clearNowPlaying(): Promise<void>;
  setSupportedCommands(caps: Record<string, boolean>): Promise<void>;
}

const native = requireNativeModule<NovaMediaNative>('NovaMedia');
const emitter = new EventEmitter(native as never);

export const NovaMedia = {
  ...native,
  onRemoteCommand(cb: (e: { command: RemoteCommand; position?: number; interval?: number }) => void): Subscription {
    return emitter.addListener('onRemoteCommand', cb);
  },
  onInterruption(cb: (e: { phase: 'began' | 'ended'; shouldResume?: boolean }) => void): Subscription {
    return emitter.addListener('onInterruption', cb);
  },
  onRouteChange(cb: (e: { reason: 'deviceDisconnected' | 'other' }) => void): Subscription {
    return emitter.addListener('onRouteChange', cb);
  },
};
