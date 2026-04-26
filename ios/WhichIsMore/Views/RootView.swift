import SwiftUI

struct RootView: View {
    @State private var isPlaying = false
    @State private var selectedCategory: Question.Category?
    private let service: any QuestionServicing = QuestionService()

    var body: some View {
        NavigationStack {
            TitleScreen(onPlay: { category in
                selectedCategory = category
                isPlaying = true
            })
            .navigationDestination(isPresented: $isPlaying) {
                GameView(service: service, category: selectedCategory)
            }
        }
        .tint(Color("WIMRed"))
    }
}

#Preview {
    RootView()
}
