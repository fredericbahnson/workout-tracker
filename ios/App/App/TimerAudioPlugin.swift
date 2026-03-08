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
    private var beepData: Data?
    private var chordData: Data?
    private var silentData: Data?

    override public func load() {
        let sampleRate: Double = 44100

        // Generate beep: 880Hz, 150ms, exponential decay
        beepData = generateBeepWav(frequency: 880, duration: 0.15, sampleRate: sampleRate)

        // Generate completion chord: C5+E5+G5 staggered
        chordData = generateChordWav(
            frequencies: [523.25, 659.25, 783.99],
            stagger: 0.15,
            noteDuration: 0.3,
            sampleRate: sampleRate
        )

        // Generate 1 second of near-silent tone for keep-alive looping
        silentData = generateKeepAliveWav(duration: 1.0, sampleRate: sampleRate)

        // Listen for audio session interruptions (e.g. phone calls)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
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
                    // Restart keep-alive if it was running
                    if silentPlayer != nil {
                        silentPlayer?.stop()
                        silentPlayer = nil
                        startSilentKeepAlive()
                    }
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
        do {
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("TimerAudioPlugin: failed to activate audio session: \(error)")
        }
    }

    private func playBeep(volume: Float) {
        guard let data = beepData else { return }
        ensureAudioSessionActive()
        do {
            beepPlayer = try AVAudioPlayer(data: data)
            beepPlayer?.volume = volume
            beepPlayer?.play()
        } catch {
            print("TimerAudioPlugin: beep playback failed: \(error)")
        }
    }

    private func playChord(volume: Float) {
        guard let data = chordData else { return }
        ensureAudioSessionActive()
        do {
            chordPlayer = try AVAudioPlayer(data: data)
            chordPlayer?.volume = volume
            chordPlayer?.play()
        } catch {
            print("TimerAudioPlugin: chord playback failed: \(error)")
        }
    }

    private func startSilentKeepAlive() {
        guard silentPlayer == nil || silentPlayer?.isPlaying == false else { return }
        guard let data = silentData else { return }
        do {
            silentPlayer = try AVAudioPlayer(data: data)
            silentPlayer?.volume = 0.01
            silentPlayer?.numberOfLoops = -1 // Loop indefinitely
            silentPlayer?.play()
        } catch {
            print("TimerAudioPlugin: silent keep-alive failed: \(error)")
        }
    }

    private func stopSilentKeepAlive() {
        silentPlayer?.stop()
        silentPlayer = nil
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
