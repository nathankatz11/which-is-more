import SwiftUI

/// Bottom-anchored fact card — does NOT cover the tiles. Red for correct,
/// muted coral for wrong. WRONG! tag up top on incorrect so the verdict
/// reads first, then the correction.
struct AnswerReveal: View {
    let question: Question
    let picked: Question.Answer
    let voteStats: VoteStats?
    let onNext: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var isCorrect: Bool { picked == question.answer }
    private var tint: Color { isCorrect ? Color("WIMRed") : Color("WIMCoral") }
    private var onTintBody: Color { isCorrect ? .white : Color("WIMInk") }
    private var headline: String { isCorrect ? "CORRECT!" : "ACTUALLY…" }

    var body: some View {
        VStack {
            Spacer()
            VStack(alignment: .leading, spacing: 10) {
                if !isCorrect {
                    Text("WRONG!")
                        .font(.system(.caption, design: .rounded, weight: .black))
                        .tracking(3)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color("WIMRedDeep"))
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                }

                Text(headline)
                    .font(.system(size: 40, weight: .black, design: .rounded))
                    .foregroundStyle(onTintBody)
                    .tracking(-0.5)
                    .shadow(color: .black.opacity(isCorrect ? 0.18 : 0), radius: 0, x: 2, y: 2)
                    .accessibilityAddTraits(.isHeader)

                VoteBarsView(question: question, stats: voteStats, isCorrect: isCorrect)

                Text(question.explanation)
                    .font(.system(.callout, design: .rounded, weight: .semibold))
                    .foregroundStyle(onTintBody.opacity(0.95))
                    .fixedSize(horizontal: false, vertical: true)

                Button(action: onNext) {
                    HStack(spacing: 6) {
                        Text("Next question")
                        Image(systemName: "arrow.right")
                    }
                    .font(.system(.headline, design: .rounded, weight: .black))
                    .foregroundStyle(tint)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color("WIMCream"))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .padding(.top, 4)
                .accessibilityHint("Load the next question")
            }
            .padding(22)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(tint)
            )
            .padding(.horizontal, 12)
            .padding(.bottom, 16)
            .transition(
                reduceMotion
                    ? .opacity
                    : .move(edge: .bottom).combined(with: .opacity)
            )
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview("Correct") {
    ZStack {
        Color("WIMCream").ignoresSafeArea()
        AnswerReveal(question: .preview, picked: .a, voteStats: VoteStats(votesA: 68, votesB: 32), onNext: {})
    }
}

#Preview("Wrong") {
    ZStack {
        Color("WIMCream").ignoresSafeArea()
        AnswerReveal(question: .preview, picked: .b, voteStats: VoteStats(votesA: 68, votesB: 32), onNext: {})
    }
}

private struct VoteBarsView: View {
    let question: Question
    let stats: VoteStats?
    let isCorrect: Bool

    var body: some View {
        let pctA = stats.map { s in
            s.total == 0 ? 50 : Int((Double(s.votesA) / Double(s.total) * 100).rounded())
        }
        let pctB = pctA.map { 100 - $0 }
        let labelOpacity: Double = isCorrect ? 0.9 : 0.7
        let dimOpacity: Double = isCorrect ? 0.55 : 0.45
        let trackColor = isCorrect ? Color.white.opacity(0.2) : Color.black.opacity(0.1)
        let fillColor = isCorrect ? Color.white.opacity(0.75) : Color.black.opacity(0.3)

        let baseColor: Color = isCorrect ? .white : Color("WIMInk")
        VStack(spacing: 5) {
            VoteRow(label: "A", pct: pctA, isAnswer: question.answer == .a,
                    labelOpacity: question.answer == .a ? labelOpacity : dimOpacity,
                    trackColor: trackColor, fillColor: fillColor)
            VoteRow(label: "B", pct: pctB, isAnswer: question.answer == .b,
                    labelOpacity: question.answer == .b ? labelOpacity : dimOpacity,
                    trackColor: trackColor, fillColor: fillColor)
            if let s = stats, s.total > 0 {
                Text("\(s.total) \(s.total == 1 ? "player" : "players")")
                    .font(.system(.caption2, design: .rounded))
                    .opacity(0.4)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
        .foregroundStyle(baseColor)
        .padding(.vertical, 2)
    }
}

private struct VoteRow: View {
    let label: String
    let pct: Int?
    let isAnswer: Bool
    let labelOpacity: Double
    let trackColor: Color
    let fillColor: Color

    var body: some View {
        HStack(spacing: 8) {
            Text(label)
                .font(.system(.caption2, design: .rounded, weight: .black))
                .frame(width: 12, alignment: .center)
                .opacity(labelOpacity)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(trackColor).frame(height: 6)
                    if let pct {
                        Capsule()
                            .fill(fillColor)
                            .frame(width: geo.size.width * CGFloat(pct) / 100, height: 6)
                            .animation(.easeOut(duration: 0.7), value: pct)
                    }
                }
            }
            .frame(height: 6)
            Text(pct != nil ? "\(pct!)%" : "…")
                .font(.system(.caption2, design: .rounded, weight: .bold))
                .frame(width: 28, alignment: .trailing)
                .opacity(labelOpacity)
        }
    }
}
