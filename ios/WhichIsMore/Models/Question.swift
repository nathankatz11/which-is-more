import Foundation

struct Question: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let slug: String?
    let category: Category
    /// Shared word-aligned prefix lifted from both prompts (e.g.
    /// "The number of pounds of"). Rendered as the banner; each option's
    /// `text` is the remaining tail after the prefix is stripped.
    let prefix: String?
    let optionA: Option
    let optionB: Option
    let answer: Answer
    let answerLabel: String
    let explanation: String
    let authored: Bool?
    let needsReview: Bool?

    struct Option: Codable, Hashable, Sendable {
        let text: String
        let value: String
        let image: String?
        let emoji: String?

        /// Resolves a relative `image` path (e.g. `/images/foo.jpg`) against the
        /// API base URL. Absolute URLs pass through unchanged.
        func resolvedImageURL(base: URL) -> URL? {
            guard let image, !image.isEmpty else { return nil }
            if image.hasPrefix("http://") || image.hasPrefix("https://") {
                return URL(string: image)
            }
            return URL(string: image, relativeTo: base)?.absoluteURL
        }
    }

    enum Answer: String, Codable, Hashable, Sendable {
        case a = "A"
        case b = "B"
    }

    // Nested to avoid colliding with CoreFoundation's `Category` typealias
    // (aka OpaquePointer) that leaks into the global namespace on iOS.
    enum Category: String, Codable, Hashable, Sendable, CaseIterable {
        case science
        case worldRecords = "world_records"
        case famousPeople = "famous_people"
        case sports
        case familyLife = "family_life"
        case food
        case environment
        case other

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            self = Category(rawValue: raw) ?? .other
        }

        var displayName: String {
            switch self {
            case .science: return "Science"
            case .worldRecords: return "World Records"
            case .famousPeople: return "Famous People"
            case .sports: return "Sports"
            case .familyLife: return "Family Life"
            case .food: return "Food"
            case .environment: return "Environment"
            case .other: return "Other"
            }
        }
    }
}
