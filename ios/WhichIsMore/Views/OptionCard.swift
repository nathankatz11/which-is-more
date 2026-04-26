import SwiftUI

/// A single half of the split question view. Big emoji (or full-bleed photo
/// in photo mode) + capitalized tail text + value on reveal. Losing tile
/// launches off-screen in its natural direction.
struct OptionCard: View {
    let option: Question.Option
    let label: String
    let revealed: Bool
    let isCorrect: Bool
    let dimmed: Bool
    let isPressed: Bool
    let imageURL: URL?

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// A flies up through the top, B flies down through the bottom.
    private var losing: Bool { dimmed && revealed }
    private var launchDirection: CGFloat { label == "A" ? -1 : 1 }
    private var useImage: Bool { imageURL != nil }

    private var displayText: String {
        guard let first = option.text.first else { return option.text }
        return first.uppercased() + option.text.dropFirst()
    }

    var body: some View {
        ZStack {
            if useImage, let url = imageURL {
                // Full-bleed async photo + dark gradient for legibility.
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        Color.black
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()
                LinearGradient(
                    colors: [
                        Color.black.opacity(0.55),
                        Color.black.opacity(0.70),
                        Color.black.opacity(0.85),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            } else {
                Color("WIMCream")
            }

            content
        }
        .background(
            revealed && isCorrect && !useImage
                ? Color("WIMRed").opacity(0.08)
                : Color.clear
        )
        .overlay(
            Rectangle()
                .stroke(
                    revealed && isCorrect ? Color("WIMRed") : Color.clear,
                    lineWidth: 3
                )
        )
        .scaleEffect(isPressed ? 0.97 : 1.0)
        .rotationEffect(.degrees(losing ? launchDirection * 22 : 0))
        .offset(y: losing ? launchDirection * 900 : 0)
        .scaleEffect(losing ? 0.25 : 1.0)
        .opacity(losing ? 0 : 1.0)
        .animation(
            reduceMotion ? .linear(duration: 0.2) : .spring(response: 0.55, dampingFraction: 0.65),
            value: losing
        )
        .animation(
            reduceMotion ? .linear(duration: 0.15) : .spring(response: 0.35, dampingFraction: 0.55),
            value: revealed
        )
        .animation(
            reduceMotion ? .linear(duration: 0.15) : .spring(response: 0.2, dampingFraction: 0.7),
            value: isPressed
        )
    }

    @ViewBuilder
    private var content: some View {
        VStack(spacing: 16) {
            if !useImage, let emoji = option.emoji {
                Text(emoji)
                    .font(.system(size: 112))
                    .scaleEffect(revealed && isCorrect ? 1.10 : 1.0)
                    .shadow(color: .black.opacity(0.08), radius: 10, y: 6)
                    .accessibilityHidden(true)
            }

            // In photo mode, wrap text in a frosted + darkened card so it stays
            // rock-solid legible over any image. In emoji mode, render it plain.
            textStack
                .padding(useImage ? 20 : 0)
                .background(
                    useImage
                        ? AnyShapeStyle(Color.black.opacity(0.55))
                        : AnyShapeStyle(Color.clear)
                )
                .background(
                    useImage
                        ? AnyShapeStyle(.ultraThinMaterial)
                        : AnyShapeStyle(Color.clear)
                )
                .clipShape(
                    useImage
                        ? AnyShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        : AnyShape(Rectangle())
                )

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 22)
        .padding(.top, 24)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    @ViewBuilder
    private var textStack: some View {
        VStack(spacing: 10) {
            Text(displayText)
                .font(
                    useImage
                        ? .system(.title, design: .rounded, weight: .black)
                        : .system(.title2, design: .rounded, weight: .bold)
                )
                .foregroundStyle(useImage ? Color.white : Color("WIMInk"))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .shadow(color: useImage ? .black.opacity(0.85) : .clear, radius: 8, y: 2)

            if revealed {
                Text(option.value)
                    .font(
                        useImage
                            ? .system(.largeTitle, design: .rounded, weight: .black)
                            : .system(.title2, design: .rounded, weight: .black)
                    )
                    .foregroundStyle(revealedValueColor)
                    .shadow(color: useImage ? .black.opacity(0.85) : .clear, radius: 8, y: 2)
                    .transition(.opacity)
            }
        }
    }

    private var revealedValueColor: Color {
        if useImage {
            return isCorrect ? .white : Color.white.opacity(0.7)
        }
        return isCorrect ? Color("WIMRed") : Color("WIMInk").opacity(0.4)
    }
}

#Preview("Idle (emoji)") {
    OptionCard(
        option: Question.preview.optionA,
        label: "A",
        revealed: false,
        isCorrect: false,
        dimmed: false,
        isPressed: false,
        imageURL: nil
    )
    .frame(height: 380)
}

#Preview("Correct (emoji)") {
    OptionCard(
        option: Question.preview.optionA,
        label: "A",
        revealed: true,
        isCorrect: true,
        dimmed: false,
        isPressed: false,
        imageURL: nil
    )
    .frame(height: 380)
}
