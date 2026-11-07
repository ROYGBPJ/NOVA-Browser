import AVFoundation
import MediaPlayer
import ExpoModulesCore

public final class NovaMediaModule: Module {
  private var observers: [NSObjectProtocol] = []
  private var commandsInstalled = false
  private var currentInfo: [String: Any] = [:]

  public func definition() -> ModuleDefinition {
    Name("NovaMedia")
    Events("onRemoteCommand", "onInterruption", "onRouteChange")

    AsyncFunction("configureSession") { (mixWithOthers: Bool) throws in
      let session = AVAudioSession.sharedInstance()
      var options: AVAudioSession.CategoryOptions = []
      if mixWithOthers { options.insert(.mixWithOthers) }
      try session.setCategory(.playback, mode: .default, options: options)
      try session.setActive(true)
      self.installObservers()
      self.installRemoteCommands()
    }

    AsyncFunction("deactivateSession") {
      try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
      MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    AsyncFunction("setNowPlaying") { (values: [String: Any]) in
      self.currentInfo = values
      var info: [String: Any] = [:]
      if let title = values["title"] as? String, !title.isEmpty {
        info[MPMediaItemPropertyTitle] = title
      }
      if let artist = values["artist"] as? String, !artist.isEmpty {
        info[MPMediaItemPropertyArtist] = artist
      }
      if let album = values["album"] as? String, !album.isEmpty {
        info[MPMediaItemPropertyAlbumTitle] = album
      }
      if let duration = values["duration"] as? NSNumber, duration.doubleValue.isFinite, duration.doubleValue > 0 {
        info[MPMediaItemPropertyPlaybackDuration] = duration
      }
      if let position = values["position"] as? NSNumber, position.doubleValue.isFinite {
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = position
      }
      info[MPNowPlayingInfoPropertyPlaybackRate] = (values["state"] as? String) == "playing" ? 1.0 : 0.0
      info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue
      MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    AsyncFunction("clearNowPlaying") {
      self.currentInfo = [:]
      MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    AsyncFunction("setSupportedCommands") { (caps: [String: Bool]) in
      let center = MPRemoteCommandCenter.shared()
      center.playCommand.isEnabled = caps["play"] ?? true
      center.pauseCommand.isEnabled = caps["pause"] ?? true
      center.togglePlayPauseCommand.isEnabled = caps["toggle"] ?? true
      center.changePlaybackPositionCommand.isEnabled = caps["seek"] ?? false
      center.skipForwardCommand.isEnabled = caps["skipForward"] ?? false
      center.skipBackwardCommand.isEnabled = caps["skipBackward"] ?? false
    }
  }

  private func installRemoteCommands() {
    guard !commandsInstalled else { return }
    commandsInstalled = true
    let center = MPRemoteCommandCenter.shared()

    center.playCommand.addTarget { [weak self] _ in
      self?.sendEvent("onRemoteCommand", ["command": "play"])
      return .success
    }
    center.pauseCommand.addTarget { [weak self] _ in
      self?.sendEvent("onRemoteCommand", ["command": "pause"])
      return .success
    }
    center.togglePlayPauseCommand.addTarget { [weak self] _ in
      self?.sendEvent("onRemoteCommand", ["command": "toggle"])
      return .success
    }
    center.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let positionEvent = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
      self?.sendEvent("onRemoteCommand", ["command": "seek", "position": positionEvent.positionTime])
      return .success
    }
    center.skipForwardCommand.preferredIntervals = [15]
    center.skipBackwardCommand.preferredIntervals = [15]
    center.skipForwardCommand.addTarget { [weak self] event in
      let interval = (event as? MPSkipIntervalCommandEvent)?.interval ?? 15
      self?.sendEvent("onRemoteCommand", ["command": "skipForward", "interval": interval])
      return .success
    }
    center.skipBackwardCommand.addTarget { [weak self] event in
      let interval = (event as? MPSkipIntervalCommandEvent)?.interval ?? 15
      self?.sendEvent("onRemoteCommand", ["command": "skipBackward", "interval": interval])
      return .success
    }
  }

  private func installObservers() {
    guard observers.isEmpty else { return }
    let center = NotificationCenter.default
    observers.append(center.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main
    ) { [weak self] notification in
      guard let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
      if type == .began {
        self?.sendEvent("onInterruption", ["phase": "began"])
      } else {
        let optionsRaw = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsRaw)
        self?.sendEvent("onInterruption", ["phase": "ended", "shouldResume": options.contains(.shouldResume)])
      }
    })
    observers.append(center.addObserver(
      forName: AVAudioSession.routeChangeNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main
    ) { [weak self] notification in
      let raw = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt
      let reason = raw.flatMap(AVAudioSession.RouteChangeReason.init(rawValue:))
      if reason == .oldDeviceUnavailable {
        self?.sendEvent("onRouteChange", ["reason": "deviceDisconnected"])
      } else {
        self?.sendEvent("onRouteChange", ["reason": "other"])
      }
    })
  }

  deinit {
    observers.forEach(NotificationCenter.default.removeObserver)
  }
}
