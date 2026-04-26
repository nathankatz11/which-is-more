import AVFoundation
import Foundation

/// Generates short synthesized tones for correct/wrong feedback. No audio
/// assets shipped — each buffer is computed once at init by summing sine
/// oscillators with exponential-decay envelopes, then scheduled on demand.
///
/// Matches the web sounds: warm bell chord for correct (C5 + G5 + C6),
/// single low A (220 Hz) for wrong.
@MainActor
final class SoundEngine {
    static let shared = SoundEngine()

    private let engine = AVAudioEngine()
    private let correctPlayer = AVAudioPlayerNode()
    private let wrongPlayer = AVAudioPlayerNode()
    private var correctBuffer: AVAudioPCMBuffer?
    private var wrongBuffer: AVAudioPCMBuffer?
    private var started = false
    var isMuted = false

    private init() {
        let sampleRate: Double = 44_100
        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else {
            return
        }

        engine.attach(correctPlayer)
        engine.attach(wrongPlayer)
        engine.connect(correctPlayer, to: engine.mainMixerNode, format: format)
        engine.connect(wrongPlayer, to: engine.mainMixerNode, format: format)

        correctBuffer = Self.makeBuffer(
            format: format,
            notes: [
                // (freq, duration, peak)
                (523.25, 0.90, 0.36),  // C5
                (783.99, 0.70, 0.20),  // G5 — perfect fifth
                (1046.5, 0.55, 0.14),  // C6 — octave
            ],
            masterGain: 0.18
        )
        wrongBuffer = Self.makeBuffer(
            format: format,
            notes: [(220.0, 0.45, 0.32)], // low A
            masterGain: 0.20
        )
    }

    func playCorrect() {
        guard !isMuted else { return }
        play(buffer: correctBuffer, via: correctPlayer)
    }

    func playWrong() {
        guard !isMuted else { return }
        play(buffer: wrongBuffer, via: wrongPlayer)
    }

    private func play(buffer: AVAudioPCMBuffer?, via player: AVAudioPlayerNode) {
        guard let buffer else { return }
        startIfNeeded()
        player.stop()
        player.scheduleBuffer(buffer, completionHandler: nil)
        player.play()
    }

    private func startIfNeeded() {
        guard !started else { return }
        do {
            // Ambient + mixWithOthers lets our sounds play over music the user
            // may already have going, and doesn't interrupt podcasts.
            try AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
            try engine.start()
            started = true
        } catch {
            // Sound is nice-to-have; swallow and keep the rest of the app working.
        }
    }

    private static func makeBuffer(
        format: AVAudioFormat,
        notes: [(freq: Double, duration: Double, gain: Double)],
        masterGain: Double
    ) -> AVAudioPCMBuffer? {
        let sampleRate = format.sampleRate
        let maxDuration = (notes.map(\.duration).max() ?? 0) + 0.1
        let frameCount = AVAudioFrameCount(maxDuration * sampleRate)
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount),
              let channel = buffer.floatChannelData?[0]
        else { return nil }
        buffer.frameLength = frameCount

        let attackTime = 0.012
        // Pre-compute decay constants so the envelope loop stays tight.
        let decayConstants = notes.map { note -> Double in
            -log(0.0008 / note.gain) / max(note.duration - attackTime, 0.001)
        }

        for i in 0..<Int(frameCount) {
            let t = Double(i) / sampleRate
            var sample = 0.0
            for (idx, note) in notes.enumerated() {
                if t > note.duration { continue }
                let envelope: Double
                if t < attackTime {
                    envelope = (t / attackTime) * note.gain
                } else {
                    envelope = note.gain * exp(-decayConstants[idx] * (t - attackTime))
                }
                sample += sin(2 * .pi * note.freq * t) * envelope
            }
            channel[i] = Float(sample * masterGain)
        }
        return buffer
    }
}
