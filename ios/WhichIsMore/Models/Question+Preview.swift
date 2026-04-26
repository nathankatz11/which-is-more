import Foundation

extension Question {
    static let preview = Question(
        id: "gum-vs-skin",
        slug: "gum-vs-skin",
        category: .science,
        prefix: "The number of pounds of",
        optionA: Option(
            text: "gum the average American chews in a year",
            value: "1.8 pounds",
            image: nil,
            emoji: "🍬"
        ),
        optionB: Option(
            text: "skin the average human sheds in a year",
            value: "1.5 pounds",
            image: nil,
            emoji: "🧍"
        ),
        answer: .a,
        answerLabel: "GUM",
        explanation: "According to the U.S. Census Bureau, the average American chews 1.8 pounds of gum annually. Reference.com tells us that humans shed about 600,000 particles of skin every hour, which is about 1.5 pounds a year. (By age 70, you'll have shed over 105 pounds of skin!) Step away, please…I don't want you shedding all over me!",
        authored: true,
        needsReview: false
    )

    static let previewList: [Question] = [.preview]
}
