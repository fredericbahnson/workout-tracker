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

        // Preload AVAudioPlayer instances once and reuse them. Reallocating fresh
        // players per beep/chord/keep-alive cycle was causing the audio queue to
        // cold-start on each subsequent timer — work items fired on schedule but
        // the audio for them came out late or got dropped, producing the
        // "set 1 ok, set 2 mistimed, set 3 missing" pattern. Reusing the same
        // instance with currentTime=0 + play() keeps the hardware buffer
        // acquired and the queue warm.
        do {
            beepPlayer = try AVAudioPlayer(data: beepData)
            beepPlayer?.prepareToPlay()

            chordPlayer = try AVAudioPlayer(data: chordData)
            chordPlayer?.prepareToPlay()

            silentPlayer = try AVAudioPlayer(data: silentData)
            silentPlayer?.numberOfLoops = -1
            silentPlayer?.volume = 0.01
            silentPlayer?.prepareToPlay()
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

        // Cancel any existing schedule
        cancelAllWorkItems()

        // Start silent keep-alive loop
        startSilentKeepAlive()

        let now = DispatchTime.now()

        // Schedule beeps at T-3, T-2, T-1
        for s in 1...3 {
            let delay = secondsRemaining - Double(s)
            if delay < 0 { continue }

            let workItem = DispatchWorkItem { [weak self] in
                self?.playBeep(volume: gain)
            }
            scheduledWorkItems.append(workItem)
            DispatchQueue.main.asyncAfter(deadline: now + delay, execute: workItem)
        }

        // Schedule completion chord at T-0
        let completionItem = DispatchWorkItem { [weak self] in
            self?.playChord(volume: gain)
        }
        scheduledWorkItems.append(completionItem)
        DispatchQueue.main.asyncAfter(deadline: now + secondsRemaining, execute: completionItem)

        // Schedule keep-alive stop ~1s after completion
        let stopItem = DispatchWorkItem { [weak self] in
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
            print("TimerAudioPlugin: failed to activate audio session: \(error)")
        }
    }

    private func playBeep(volume: Float) {
        guard let player = beepPlayer else { return }
        ensureAudioSessionActive()
        player.volume = volume
        player.currentTime = 0
        player.play()
    }

    private func playChord(volume: Float) {
        guard let player = chordPlayer else { return }
        ensureAudioSessionActive()
        player.volume = volume
        player.currentTime = 0
        player.play()
    }

    private func startSilentKeepAlive() {
        guard let player = silentPlayer else { return }
        if player.isPlaying { return }
        ensureAudioSessionActive()
        player.currentTime = 0
        player.play()
    }

    private func stopSilentKeepAlive() {
        // Pause rather than stop+nil — keeps the audio queue bound to this
        // player so the next play() resumes hot instead of cold-starting.
        silentPlayer?.pause()
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
