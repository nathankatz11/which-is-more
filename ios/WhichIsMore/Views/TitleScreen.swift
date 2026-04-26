import SwiftUI

struct TitleScreen: View {
    /// Called when Play is tapped. Always nil for now — category picking was
    /// stripped until the question pool is larger.
    var onPlay: (Question.Category?) -> Void

    @State private var bestStreak = 0

    var body: some View {
        ZStack {
            Color("WIMCream").ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                VStack(alignment: .center, spacing: -8) {
                    Text("WHICH IS")
                        .font(.system(size: 56, weight: .black, design: .rounded))
                        .tracking(-1)
                        .foregroundStyle(Color("WIMRed"))
                        .shadow(color: Color("WIMRedDeep").opacity(0.45), radius: 0, x: 3, y: 3)
                    Text("MORE?")
                        .font(.system(size: 96, weight: .black, design: .rounded))
                        .tracking(-2)
                        .foregroundStyle(Color("WIMRed"))
                        .shadow(color: Color("WIMRedDeep").opacity(0.45), radius: 0, x: 4, y: 4)
                }
                .padding(.horizontal, 24)

                Text("A game by Alan Katz")
                    .font(.system(.title3, design: .rounded, weight: .semibold))
                    .foregroundStyle(Color("WIMInk").opacity(0.55))
                    .tracking(0.3)

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

                Spacer()

                Button(action: { onPlay(nil) }) {
                    HStack(spacing: 10) {
                        Text("Play")
                        Image(systemName: "arrow.right")
                    }
                    .font(.system(.title, design: .rounded, weight: .black))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .background(Color("WIMRed"))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .shadow(color: Color("WIMRedDeep").opacity(0.5), radius: 0, x: 0, y: 5)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 48)
                .accessibilityHint("Start a round")
            }
        }
        .navigationBarHidden(true)
        .task {
            bestStreak = UserDefaults.standard.integer(forKey: "wim_best_streak")
        }
    }
}

#Preview {
    TitleScreen(onPlay: { _ in })
}
