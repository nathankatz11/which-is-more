import Foundation

enum AppConfig {
    /// Base URL for the backend API. Read from Info.plist so we can flip dev/prod
    /// without rebuilding the binary, and fall back to localhost for fresh checkouts.
    static let apiBaseURL: URL = {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
           let url = URL(string: raw), !raw.isEmpty {
            return url
        }
        return URL(string: "http://localhost:3000")!
    }()
}
