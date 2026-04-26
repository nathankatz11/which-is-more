# Which is More? — iOS

Mobile clone of Alan Katz's "Which is More?" trivia game. SwiftUI, iOS 17, Swift 6.

## Prerequisites

- Xcode 16.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`

## Setup

```bash
cd ios
xcodegen
open WhichIsMore.xcodeproj
```

Recommended simulator: **iPhone 17 Pro** (or any iPhone sim, iOS 17+).

## Backend

The app reads `API_BASE_URL` from `Info.plist`. The checked-in default points at
`http://localhost:3000` for local dev against the Next.js backend in `../backend`.

To point at production, edit the `API_BASE_URL` entry in
`WhichIsMore/Info.plist` before archiving.

## Project layout

```
ios/
  project.yml              XcodeGen spec
  WhichIsMore/
    App/                   App entry + config
    Models/                Codable types
    Services/              Networking
    Views/                 SwiftUI screens
    Info.plist
    Assets.xcassets/       App icon, colors
    WhichIsMore.entitlements
```
