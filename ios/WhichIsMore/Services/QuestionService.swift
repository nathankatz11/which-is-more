import Foundation

struct VoteStats: Sendable {
    let votesA: Int
    let votesB: Int

    var total: Int { votesA + votesB }

    func pct(for answer: Question.Answer) -> Int {
        guard total > 0 else { return 50 }
        let count = answer == .a ? votesA : votesB
        let a = Int((Double(count) / Double(total) * 100).rounded())
        // Ensure A+B always sums to 100 after rounding
        return answer == .a ? a : 100 - Int((Double(votesA) / Double(total) * 100).rounded())
    }
}

protocol QuestionServicing: Sendable {
    func random(excluding: [String], category: Question.Category?) async throws -> RandomResult
    func list(category: Question.Category?) async throws -> [Question]
    func get(slug: String) async throws -> Question
    func vote(slug: String, option: Question.Answer) async throws -> VoteStats
}

extension QuestionServicing {
    func random() async throws -> RandomResult {
        try await random(excluding: [], category: nil)
    }
    func random(excluding seen: [String]) async throws -> RandomResult {
        try await random(excluding: seen, category: nil)
    }
}

/// Result envelope for the `/api/questions/random` endpoint — either a
/// question or an `exhausted` flag telling the client that every question
/// has been seen.
enum RandomResult: Sendable {
    case question(Question)
    case exhausted(total: Int)
}

enum WIMError: Error, LocalizedError {
    case badURL
    case transport(Error)
    case badResponse(Int)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .badURL: return "Invalid URL."
        case .transport(let e): return "Network error: \(e.localizedDescription)"
        case .badResponse(let code): return "Server returned \(code)."
        case .decoding(let e): return "Couldn't read response: \(e.localizedDescription)"
        }
    }
}

final class QuestionService: QuestionServicing {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
    }

    func random(excluding seen: [String], category: Question.Category?) async throws -> RandomResult {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("/api/questions/random"),
            resolvingAgainstBaseURL: false
        )
        var items: [URLQueryItem] = []
        if !seen.isEmpty {
            items.append(URLQueryItem(name: "exclude", value: seen.joined(separator: ",")))
        }
        if let category {
            items.append(URLQueryItem(name: "category", value: category.rawValue))
        }
        if !items.isEmpty {
            components?.queryItems = items
        }
        guard let url = components?.url else { throw WIMError.badURL }
        let wrapper: RandomWrapper = try await fetch(url: url)
        if let q = wrapper.question { return .question(q) }
        return .exhausted(total: wrapper.total ?? 0)
    }

    func list(category: Question.Category? = nil) async throws -> [Question] {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("/api/questions"),
            resolvingAgainstBaseURL: false
        )
        if let category {
            components?.queryItems = [URLQueryItem(name: "category", value: category.rawValue)]
        }
        guard let url = components?.url else { throw WIMError.badURL }
        let wrapper: ListWrapper = try await fetch(url: url)
        return wrapper.questions
    }

    func get(slug: String) async throws -> Question {
        let url = baseURL.appendingPathComponent("/api/questions/\(slug)")
        let wrapper: SingleWrapper = try await fetch(url: url)
        return wrapper.question
    }

    func vote(slug: String, option: Question.Answer) async throws -> VoteStats {
        let url = baseURL.appendingPathComponent("/api/questions/\(slug)/vote")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["option": option.rawValue])
        let wrapper: VoteResponse = try await fetchRequest(request)
        return VoteStats(votesA: wrapper.votesA, votesB: wrapper.votesB)
    }

    private func fetch<T: Decodable>(url: URL) async throws -> T {
        try await fetchRequest(URLRequest(url: url))
    }

    private func fetchRequest<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw WIMError.transport(error)
        }
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            throw WIMError.badResponse(http.statusCode)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw WIMError.decoding(error)
        }
    }

    // Random endpoint returns `{ question: Question }` OR `{ question: null, exhausted: true, total: N }`.
    private struct RandomWrapper: Decodable {
        let question: Question?
        let exhausted: Bool?
        let total: Int?
    }
    private struct SingleWrapper: Decodable { let question: Question }
    private struct ListWrapper: Decodable { let questions: [Question] }
    private struct VoteResponse: Decodable { let votesA: Int; let votesB: Int }
}

/// Deterministic preview service — never hits the network.
final class MockQuestionService: QuestionServicing {
    private let sample: Question
    init(sample: Question = .preview) { self.sample = sample }
    func random(excluding: [String], category: Question.Category?) async throws -> RandomResult {
        .question(sample)
    }
    func list(category: Question.Category?) async throws -> [Question] { [sample] }
    func get(slug: String) async throws -> Question { sample }
    func vote(slug: String, option: Question.Answer) async throws -> VoteStats {
        VoteStats(votesA: 68, votesB: 32)
    }
}
