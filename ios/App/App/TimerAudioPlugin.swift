import Foundation
import Capacitor
import AVFoundation

@objc(TimerAudioPlugin)
public class TimerAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TimerAudioPlugin"
    public let jsName = "TimerAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scheduleCountdown", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelScheduledSounds", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopKeepAlive", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playTestSound", returnType: CAPPluginReturnPromise),
    ]

    private var scheduledWorkItems: [DispatchWorkItem] = []
    private var beepPlayer: AVAudioPlayer?
    private var chordPlayer: AVAudioPlayer?
    private var silentPlayer: AVAudioPlayer?
    private var timerSequence: Int = 0
    private var sessionStartTime: TimeInterval = Date().timeIntervalSince1970

    // Diagnostic logging — prefix "TA>" so we can grep clean output from the
    // Xcode console or Console.app.
    private func ta(_ message: String) {
        let elapsed = Date().timeIntervalSince1970 - sessionStartTime
        NSLog("TA> [%.3f] %@", elapsed, message)
    }

    private func sessionDescription() -> String {
        let s = AVAudioSession.sharedInstance()
        return "category=\(s.category.rawValue) opts=\(s.categoryOptions.rawValue) otherAudio=\(s.isOtherAudioPlaying) outVol=\(s.outputVolume)"
    }

    private func playerDescription(_ p: AVAudioPlayer?) -> String {
        guard let p = p else { return "nil" }
        return "isPlaying=\(p.isPlaying) currentTime=\(String(format: "%.2f", p.currentTime)) dur=\(String(format: "%.2f", p.duration)) vol=\(p.volume)"
    }

    override public func load() {
        let sampleRate: Double = 44100
        let beepData = generateBeepWav(frequency: 880, duration: 0.15, sampleRate: sampleRate)
        let chordData = generateChordWav(
            frequencies: [523.25, 659.25, 783.99],
            stagger: 0.15,
            noteDuration: 0.3,
            sampleRate: sampleRate
        )
        let silentData = generateKeepAliveWav(duration: 1.0, sampleRate: sampleRate)

        configureAudioSession()
        ta("LOAD: plugin loading, session=\(sessionDescription())")

        // Write the generated WAV bytes to the Caches directory and construct
        // AVAudioPlayer instances from file URLs rather than from Data. Recent
        // iOS versions tightened how AVAudioPlayer(data:) interacts with the
        // audio queue when the queue is cold, which manifested as Set 2/3 beeps
        // being dropped or mistimed. File-based init takes a different
        // CoreAudio code path that's less affected by those changes.
        do {
            if let beepURL = writeWavToCachesIfNeeded(name: "timer_beep.wav", data: beepData) {
                beepPlayer = try AVAudioPlayer(contentsOf: beepURL)
                beepPlayer?.prepareToPlay()
            }

            if let chordURL = writeWavToCachesIfNeeded(name: "timer_chord.wav", data: chordData) {
                chordPlayer = try AVAudioPlayer(contentsOf: chordURL)
                chordPlayer?.prepareToPlay()
            }

            if let silentURL = writeWavToCachesIfNeeded(name: "timer_silent.wav", data: silentData) {
                silentPlayer = try AVAudioPlayer(contentsOf: silentURL)
                silentPlayer?.numberOfLoops = -1
                silentPlayer?.volume = 0.01
                silentPlayer?.prepareToPlay()
            }
        } catch {
            print("TimerAudioPlugin: failed to preload players: \(error)")
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
    }

    private func writeWavToCachesIfNeeded(name: String, data: Data) -> URL? {
        guard let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else {
            return nil
        }
        let url = dir.appendingPathComponent(name)
        // Always rewrite so a future change to the generator (e.g. new frequency)
        // doesn't get masked by a stale cached file.
        do {
            try data.write(to: url, options: .atomic)
            return url
        } catch {
            print("TimerAudioPlugin: failed to write \(name) to caches: \(error)")
            return nil
        }
    }

    private func configureAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                options: [.mixWithOthers, .duckOthers]
            )
        } catch {
            print("TimerAudioPlugin: failed to set audio session category: \(error)")
        }
    }

    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }

        if type == .ended {
            if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                if options.contains(.shouldResume) {
                    ensureAudioSessionActive()
                    // Re-prepare and resume keep-alive if it was playing before.
                    silentPlayer?.prepareToPlay()
                    silentPlayer?.play()
                }
            }
        }
    }

    @objc func scheduleCountdown(_ call: CAPPluginCall) {
        let secondsRemaining = call.getDouble("secondsRemaining") ?? 5.0
        let volume = call.getDouble("volume") ?? 40.0
        let gain = Float(min(1.0, max(0.0, volume / 100.0)))

        timerSequence += 1
        let timerN = timerSequence
        ta("=== scheduleCountdown TIMER #\(timerN) secondsRemaining=\(secondsRemaining) volume=\(volume) ===")
        ta("TIMER #\(timerN) session: \(sessionDescription())")
        ta("TIMER #\(timerN) silentPlayer-pre: \(playerDescription(silentPlayer))")
        ta("TIMER #\(timerN) beepPlayer-pre: \(playerDescription(beepPlayer))")
        ta("TIMER #\(timerN) chordPlayer-pre: \(playerDescription(chordPlayer))")

        cancelAllWorkItems()
        startSilentKeepAlive(timerN: timerN)

        let now = DispatchTime.now()

        for s in 1...3 {
            let delay = secondsRemaining - Double(s)
            if delay < 0 { continue }
            let beepIndex = s
            let workItem = DispatchWorkItem { [weak self] in
                self?.ta("TIMER #\(timerN) BEEP \(beepIndex) work item firing (expected delay \(delay)s)")
                self?.playBeep(volume: gain, timerN: timerN, beepIndex: beepIndex)
            }
            scheduledWorkItems.append(workItem)
            DispatchQueue.main.asyncAfter(deadline: now + delay, execute: workItem)
        }

        let completionItem = DispatchWorkItem { [weak self] in
            self?.ta("TIMER #\(timerN) CHORD work item firing (expected delay \(secondsRemaining)s)")
            self?.playChord(volume: gain, timerN: timerN)
        }
        scheduledWorkItems.append(completionItem)
        DispatchQueue.main.asyncAfter(deadline: now + secondsRemaining, execute: completionItem)

        let stopItem = DispatchWorkItem { [weak self] in
            self?.ta("TIMER #\(timerN) STOP work item firing (keep-alive stop)")
            self?.stopSilentKeepAlive()
        }
        scheduledWorkItems.append(stopItem)
        DispatchQueue.main.asyncAfter(deadline: now + secondsRemaining + 1.0, execute: stopItem)

        call.resolve()
    }

    @objc func cancelScheduledSounds(_ call: CAPPluginCall) {
        cancelAllWorkItems()
        // Do NOT stop currently-playing sounds — let them finish
        call.resolve()
    }

    @objc func stopKeepAlive(_ call: CAPPluginCall) {
        stopSilentKeepAlive()
        call.resolve()
    }

    @objc func playTestSound(_ call: CAPPluginCall) {
        let volume = call.getDouble("volume") ?? 40.0
        let gain = Float(min(1.0, max(0.0, volume / 100.0)))

        playBeep(volume: gain)

        let chordItem = DispatchWorkItem { [weak self] in
            self?.playChord(volume: gain)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3, execute: chordItem)

        call.resolve()
    }

    // MARK: - Private helpers

    private func cancelAllWorkItems() {
        for item in scheduledWorkItems {
            item.cancel()
        }
        scheduledWorkItems.removeAll()
    }

    private func ensureAudioSessionActive() {
        // Only reactivate. Don't re-apply category here — calling setCategory while
        // the keep-alive is currently playing can disrupt the audio pipeline and
        // cause subsequent scheduled beeps to no-op. Category is set in load() and
        // AppDelegate; that's sufficient.
        do {
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            ta("ensureAudioSessionActive: setActive(true) FAILED \(error)")
        }
    }

    private func playBeep(volume: Float, timerN: Int = -1, beepIndex: Int = -1) {
        guard let player = beepPlayer else {
            ta("TIMER #\(timerN) BEEP \(beepIndex): NO PLAYER (nil)")
            return
        }
        ensureAudioSessionActive()
        player.volume = volume
        player.currentTime = 0
        let didPlay = player.play()
        ta("TIMER #\(timerN) BEEP \(beepIndex): play()=\(didPlay) state=\(playerDescription(player)) session=\(sessionDescription())")
    }

    private func playChord(volume: Float, timerN: Int = -1) {
        guard let player = chordPlayer else {
            ta("TIMER #\(timerN) CHORD: NO PLAYER (nil)")
            return
        }
        ensureAudioSessionActive()
        player.volume = volume
        player.currentTime = 0
        let didPlay = player.play()
        ta("TIMER #\(timerN) CHORD: play()=\(didPlay) state=\(playerDescription(player)) session=\(sessionDescription())")
    }

    private func startSilentKeepAlive(timerN: Int = -1) {
        guard let player = silentPlayer else {
            ta("TIMER #\(timerN) KEEP-ALIVE: NO PLAYER (nil)")
            return
        }
        if player.isPlaying {
            ta("TIMER #\(timerN) KEEP-ALIVE: already playing, skipping start")
            return
        }
        ensureAudioSessionActive()
        player.currentTime = 0
        let didPlay = player.play()
        ta("TIMER #\(timerN) KEEP-ALIVE: play()=\(didPlay) state=\(playerDescription(player)) session=\(sessionDescription())")
    }

    private func stopSilentKeepAlive() {
        let wasPlaying = silentPlayer?.isPlaying ?? false
        silentPlayer?.pause()
        ta("KEEP-ALIVE: pause() called, wasPlaying=\(wasPlaying), now=\(playerDescription(silentPlayer))")
    }

    // MARK: - WAV generation

    private func generateWavData(samples: [Float], sampleRate: Double) -> Data {
        let numSamples = samples.count
        let bitsPerSample: Int = 16
        let numChannels: Int = 1
        let byteRate = Int(sampleRate) * numChannels * bitsPerSample / 8
        let blockAlign = numChannels * bitsPerSample / 8
        let dataSize = numSamples * blockAlign
        let fileSize = 36 + dataSize

        var data = Data()

        // RIFF header
        data.append(contentsOf: [0x52, 0x49, 0x46, 0x46]) // "RIFF"
        data.append(contentsOf: withUnsafeBytes(of: UInt32(fileSize).littleEndian) { Array($0) })
        data.append(contentsOf: [0x57, 0x41, 0x56, 0x45]) // "WAVE"

        // fmt chunk
        data.append(contentsOf: [0x66, 0x6D, 0x74, 0x20]) // "fmt "
        data.append(contentsOf: withUnsafeBytes(of: UInt32(16).littleEndian) { Array($0) }) // chunk size
        data.append(contentsOf: withUnsafeBytes(of: UInt16(1).littleEndian) { Array($0) }) // PCM
        data.append(contentsOf: withUnsafeBytes(of: UInt16(numChannels).littleEndian) { Array($0) })
        data.append(contentsOf: withUnsafeBytes(of: UInt32(Int(sampleRate)).littleEndian) { Array($0) })
        data.append(contentsOf: withUnsafeBytes(of: UInt32(byteRate).littleEndian) { Array($0) })
        data.append(contentsOf: withUnsafeBytes(of: UInt16(blockAlign).littleEndian) { Array($0) })
        data.append(contentsOf: withUnsafeBytes(of: UInt16(bitsPerSample).littleEndian) { Array($0) })

        // data chunk
        data.append(contentsOf: [0x64, 0x61, 0x74, 0x61]) // "data"
        data.append(contentsOf: withUnsafeBytes(of: UInt32(dataSize).littleEndian) { Array($0) })

        for sample in samples {
            let clamped = max(-1.0, min(1.0, sample))
            let intSample = Int16(clamped * 32767.0)
            data.append(contentsOf: withUnsafeBytes(of: intSample.littleEndian) { Array($0) })
        }

        return data
    }

    private func generateBeepWav(frequency: Double, duration: Double, sampleRate: Double) -> Data {
        let numSamples = Int(sampleRate * duration)
        var samples = [Float](repeating: 0, count: numSamples)

        for i in 0..<numSamples {
            let t = Double(i) / sampleRate
            let envelope = Float(exp(-t * 10.0)) // exponential decay
            samples[i] = envelope * Float(sin(2.0 * .pi * frequency * t))
        }

        return generateWavData(samples: samples, sampleRate: sampleRate)
    }

    private func generateChordWav(
        frequencies: [Double],
        stagger: Double,
        noteDuration: Double,
        sampleRate: Double
    ) -> Data {
        let totalDuration = stagger * Double(frequencies.count - 1) + noteDuration
        let numSamples = Int(sampleRate * totalDuration)
        var samples = [Float](repeating: 0, count: numSamples)

        for (index, freq) in frequencies.enumerated() {
            let startSample = Int(Double(index) * stagger * sampleRate)
            let noteSamples = Int(noteDuration * sampleRate)

            for i in 0..<noteSamples {
                let sampleIndex = startSample + i
                if sampleIndex >= numSamples { break }
                let t = Double(i) / sampleRate
                let envelope = Float(exp(-t * 5.0))
                samples[sampleIndex] += envelope * Float(sin(2.0 * .pi * freq * t)) / Float(frequencies.count)
            }
        }

        return generateWavData(samples: samples, sampleRate: sampleRate)
    }

    private func generateKeepAliveWav(duration: Double, sampleRate: Double) -> Data {
        let numSamples = Int(sampleRate * duration)
        var samples = [Float](repeating: 0, count: numSamples)
        for i in 0..<numSamples {
            let t = Double(i) / sampleRate
            // 20Hz sub-bass at very low amplitude — inaudible but keeps iOS audio pipeline active
            samples[i] = 0.002 * Float(sin(2.0 * .pi * 20.0 * t))
        }
        return generateWavData(samples: samples, sampleRate: sampleRate)
    }
}
