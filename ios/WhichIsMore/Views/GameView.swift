import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct GameView: View {
    enum Phase: Equatable {
        case loading
        case question(Question)
        case revealed(Question, picked: Question.Answer)
        case exhausted(total: Int)
        case error(String)
    }

    let service: any QuestionServicing
    let category: Question.Category?

    @State private var phase: Phase = .loading
    @State private var streak = 0
    @State private var bestStreak = 0
    @State private var newBest = false
    @State private var correct = 0
    @State private var total = 0
    @State private var seen: [String]
    @State private var pressedOption: Question.Answer?
    @State private var photoMode: Bool = UserDefaults.standard.bool(forKey: "wim_photo_mode")
    @State private var muted: Bool = UserDefaults.standard.bool(forKey: "wim_muted")
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private static let seenKey = "wim_seen_slugs"
    private static let bestStreakKey = "wim_best_streak"

    init(service: any QuestionServicing, category: Question.Category? = nil) {
        self.service = service
        self.category = category
        let key = Self.seenKey + "_" + (category?.rawValue ?? "all")
        _seen = State(initialValue: UserDefaults.standard.stringArray(forKey: key) ?? [])
    }

    private var seenStorageKey: String {
        Self.seenKey + "_" + (category?.rawValue ?? "all")
    }

    var body: some View {
        ZStack {
            Color("WIMCream").ignoresSafeArea()
            content
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let category {
                ToolbarItem(placement: .principal) {
                    CategoryBadge(name: category.displayName)
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 4) {
                    Button { togglePhotoMode() } label: {
                        Image(systemName: photoMode ? "photo.fill" : "face.smiling.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color("WIMInk").opacity(0.6))
                    }
                    .accessibilityLabel(photoMode ? "Switch to emoji mode" : "Switch to photo mode")
                    Button { toggleMute() } label: {
                        Image(systemName: muted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color("WIMInk").opacity(0.6))
                    }
                    .accessibilityLabel(muted ? "Unmute" : "Mute")
                    StreakChip(streak: streak, celebrate: newBest)
                }
            }
        }
        .task {
            bestStreak = UserDefaults.standard.integer(forKey: Self.bestStreakKey)
            SoundEngine.shared.isMuted = muted
            await loadNext()
        }
    }

    @ViewBuilder
    private var content: some View {
        switch phase {
        case .loading:
            ProgressView().tint(Color("WIMRed"))
        case .question(let q):
            questionContainer(q, picked: nil)
        case .revealed(let q, let picked):
            ZStack(alignment: .bottom) {
                questionContainer(q, picked: picked)
                AnswerReveal(question: q, picked: picked, onNext: {
                    #if canImport(UIKit)
                    UISelectionFeedbackGenerator().selectionChanged()
                    #endif
                    Task { await loadNext() }
                })
                .padding(.bottom, 4)
            }
        case .exhausted:
            exhaustedView
        case .error(let message):
            VStack(spacing: 16) {
                Text("Something went wrong")
                    .font(.system(.title2, design: .rounded, weight: .bold))
                    .foregroundStyle(Color("WIMInk"))
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                Button("Retry") { Task { await loadNext() } }
                    .buttonStyle(.borderedProminent)
                    .tint(Color("WIMRed"))
            }
        }
    }

    private func questionContainer(_ q: Question, picked: Question.Answer?) -> some View {
        VStack(spacing: 0) {
            QuestionBanner(prefix: q.prefix)
            VStack(spacing: 0) {
                tileButton(q: q, answer: .a, label: "A", picked: picked)
                ORDivider()
                    .frame(height: 32)
                    .background(Color("WIMCream"))
                    .zIndex(1)
                    .opacity(picked == nil ? 1 : 0)
                tileButton(q: q, answer: .b, label: "B", picked: picked)
            }
        }
        .id(q.slug ?? q.id) // remount on new question so entrance animations replay
    }

    private func tileButton(q: Question, answer: Question.Answer, label: String, picked: Question.Answer?) -> some View {
        let isCorrect = q.answer == answer
        let revealed = picked != nil
        let wasPicked = picked == answer
        let opt = answer == .a ? q.optionA : q.optionB
        let imageURL = photoMode ? opt.resolvedImageURL(base: AppConfig.apiBaseURL) : nil
        return OptionCard(
            option: opt,
            label: label,
            revealed: revealed,
            isCorrect: isCorrect,
            dimmed: revealed && !isCorrect,
            isPressed: pressedOption == answer,
            imageURL: imageURL
        )
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 0, maximumDistance: 12) {
            // No tap handler here — we pick on release below.
        } onPressingChanged: { pressing in
            if picked != nil { return }
            #if canImport(UIKit)
            if pressing { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
            #endif
            withAnimation(
                reduceMotion ? .linear(duration: 0.12) : .spring(response: 0.2, dampingFraction: 0.7)
            ) {
                pressedOption = pressing ? answer : nil
            }
            if !pressing, pressedOption == answer {
                pick(answer, for: q)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Option \(label): \(q.prefix ?? "") \(opt.text)")
        .accessibilityHint(revealed ? "" : "Tap to choose this option")
        .accessibilityAddTraits(.isButton)
        .accessibilityValue(revealed ? (wasPicked ? "You picked this." : "") : "")
    }

    private var exhaustedView: some View {
        VStack(spacing: 20) {
            Text("🎉")
                .font(.system(size: 88))
            Text("You got\n\(correct) out of \(total)!")
                .font(.system(size: 44, weight: .black, design: .rounded))
                .foregroundStyle(Color("WIMRed"))
                .multilineTextAlignment(.center)
                .shadow(color: .black.opacity(0.12), radius: 0, x: 2, y: 2)
            Text(scoreSubtitle)
                .font(.system(.title3, design: .rounded, weight: .semibold))
                .foregroundStyle(Color("WIMInk").opacity(0.65))
            if bestStreak > 0 {
                HStack(spacing: 6) {
                    Text("🔥")
                    Text("Best streak: \(bestStreak)")
                        .font(.system(.subheadline, design: .rounded, weight: .bold))
                        .foregroundStyle(Color("WIMRed"))
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(Capsule().fill(Color("WIMRed").opacity(0.1)))
            }
            Button(action: restart) {
                Text("Play again")
                    .font(.system(.title3, design: .rounded, weight: .black))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color("WIMRed"))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .shadow(color: Color("WIMRedDeep").opacity(0.4), radius: 0, x: 0, y: 3)
            }
            .padding(.horizontal, 48)
            .padding(.top, 8)
        }
        .padding(.horizontal, 24)
    }

    private func pick(_ answer: Question.Answer, for question: Question) {
        guard case .question = phase else { return }
        let correct = answer == question.answer
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(correct ? .success : .warning)
        #endif
        total += 1
        if correct {
            self.correct += 1
            SoundEngine.shared.playCorrect()
            streak += 1
            if streak > bestStreak {
                bestStreak = streak
                newBest = true
                UserDefaults.standard.set(bestStreak, forKey: Self.bestStreakKey)
                Task {
                    try? await Task.sleep(for: .milliseconds(1800))
                    await MainActor.run { newBest = false }
                }
            }
        } else {
            SoundEngine.shared.playWrong()
            streak = 0
        }
        if !seen.contains(question.slug ?? question.id) {
            seen.append(question.slug ?? question.id)
            UserDefaults.standard.set(seen, forKey: seenStorageKey)
        }
        withAnimation(
            reduceMotion ? .linear(duration: 0.2) : .spring(response: 0.45, dampingFraction: 0.8)
        ) {
            phase = .revealed(question, picked: answer)
        }
    }

    private func restart() {
        seen = []
        UserDefaults.standard.set(seen, forKey: seenStorageKey)
        streak = 0
        correct = 0
        total = 0
        Task { await loadNext() }
    }

    /// Kid-friendly verdict subtitle based on accuracy.
    private var scoreSubtitle: String {
        guard total > 0 else { return "" }
        let pct = Double(correct) / Double(total)
        if pct >= 0.9 { return "Fact machine!" }
        if pct >= 0.7 { return "Nice work!" }
        if pct >= 0.5 { return "Not bad!" }
        return "Ouch — try again?"
    }

    private func togglePhotoMode() {
        photoMode.toggle()
        UserDefaults.standard.set(photoMode, forKey: "wim_photo_mode")
    }

    private func toggleMute() {
        muted.toggle()
        UserDefaults.standard.set(muted, forKey: "wim_muted")
        SoundEngine.shared.isMuted = muted
    }

    private func loadNext() async {
        withAnimation(.easeInOut(duration: 0.2)) { phase = .loading }
        do {
            let result = try await service.random(excluding: seen, category: category)
            switch result {
            case .question(let q):
                withAnimation(
                    reduceMotion ? .linear(duration: 0.2) : .spring(response: 0.45, dampingFraction: 0.85)
                ) {
                    phase = .question(q)
                }
            case .exhausted(let total):
                withAnimation(.easeInOut(duration: 0.25)) { phase = .exhausted(total: total) }
            }
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            withAnimation(.easeInOut(duration: 0.2)) { phase = .error(message) }
        }
    }
}

/// Top banner: "Which is more?" eyebrow + the extracted prefix as the
/// dominant question framing.
private struct QuestionBanner: View {
    let prefix: String?

    var body: some View {
        VStack(spacing: 6) {
            Text("WHICH IS MORE?")
                .font(.system(.caption, design: .rounded, weight: .black))
                .tracking(4)
                .foregroundStyle(Color("WIMRed"))
                .shadow(color: Color("WIMRedDeep").opacity(0.3), radius: 0, x: 1, y: 1)

            if let prefix {
                Text("\(prefix)…")
                    .font(.system(.title2, design: .rounded, weight: .black))
                    .foregroundStyle(Color("WIMInk"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.top, 16)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity)
        .background(Color("WIMRed").opacity(0.08))
        .overlay(
            Rectangle()
                .frame(height: 1.5)
                .foregroundStyle(Color("WIMRed").opacity(0.2)),
            alignment: .bottom
        )
    }
}

/// Top-right streak indicator — flame + number. 0 renders as a quiet placeholder.
/// Animates on new-best.
private struct StreakChip: View {
    let streak: Int
    let celebrate: Bool

    var body: some View {
        HStack(spacing: 4) {
            Text("🔥")
                .font(.system(size: 18))
                .opacity(streak > 0 ? 1 : 0.3)
                .scaleEffect(celebrate ? 1.2 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.5), value: celebrate)
            Text("\(streak)")
                .font(.system(.callout, design: .rounded, weight: .black))
                .foregroundStyle(Color("WIMRed"))
                .contentTransition(.numericText(value: Double(streak)))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(Capsule().fill(Color("WIMRed").opacity(0.1)))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Current streak: \(streak)")
    }
}

/// Small pill shown in the nav title when a category filter is active.
private struct CategoryBadge: View {
    let name: String
    var body: some View {
        Text(name.uppercased())
            .font(.system(.caption2, design: .rounded, weight: .black))
            .tracking(2)
            .foregroundStyle(Color("WIMRed"))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Capsule().fill(Color("WIMRed").opacity(0.1)))
    }
}

/// The centered "OR" band between the two tiles — hand-placed editorial feel.
private struct ORDivider: View {
    var body: some View {
        ZStack {
            Rectangle()
                .fill(Color("WIMInk").opacity(0.08))
                .frame(height: 1)
            Text("OR")
                .font(.system(.caption, design: .rounded, weight: .black))
                .tracking(4)
                .foregroundStyle(Color("WIMInk").opacity(0.45))
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(Color("WIMCream"))
                .overlay(
                    Capsule()
                        .stroke(Color("WIMInk").opacity(0.12), lineWidth: 1)
                )
                .clipShape(Capsule())
        }
    }
}

#Preview("Question") {
    NavigationStack {
        GameView(service: MockQuestionService())
    }
}
