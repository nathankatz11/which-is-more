import SwiftUI

/// Bottom-anchored fact card — does NOT cover the tiles. Red for correct,
/// muted coral for wrong. WRONG! tag up top on incorrect so the verdict
/// reads first, then the correction.
struct AnswerReveal: View {
    let question: Question
    let picked: Question.Answer
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
        AnswerReveal(question: .preview, picked: .a, onNext: {})
    }
}

#Preview("Wrong") {
    ZStack {
        Color("WIMCream").ignoresSafeArea()
        AnswerReveal(question: .preview, picked: .b, onNext: {})
    }
}
