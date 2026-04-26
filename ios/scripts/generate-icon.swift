#!/usr/bin/env swift
// Renders a 1024×1024 app icon PNG (red square, big white "?") using Core Graphics.
// Run once; output replaces Assets.xcassets/AppIcon.appiconset/icon-1024.png.
// Usage (from ios/): swift scripts/generate-icon.swift

import AppKit
import CoreGraphics

let size: CGFloat = 1024
let wimRed = NSColor(red: 0xE8 / 255.0, green: 0x3D / 255.0, blue: 0x2F / 255.0, alpha: 1)

let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(size),
    pixelsHigh: Int(size),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 32
)!

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

// Red background (no rounded corners — iOS applies the rounded mask itself)
wimRed.setFill()
NSRect(x: 0, y: 0, width: size, height: size).fill()

// Giant white "?" centered
let glyph: NSString = "?"
let font = NSFont.systemFont(ofSize: size * 0.72, weight: .black)
let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center
let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: NSColor.white,
    .paragraphStyle: paragraph,
]
let glyphSize = glyph.size(withAttributes: attrs)
let rect = NSRect(
    x: 0,
    y: (size - glyphSize.height) / 2 - size * 0.02, // nudge up off the baseline
    width: size,
    height: glyphSize.height
)
glyph.draw(in: rect, withAttributes: attrs)

NSGraphicsContext.restoreGraphicsState()

let outPath = "WhichIsMore/Assets.xcassets/AppIcon.appiconset/icon-1024.png"
guard let data = bitmap.representation(using: .png, properties: [:]) else {
    FileHandle.standardError.write("Failed to encode PNG\n".data(using: .utf8)!)
    exit(1)
}
try data.write(to: URL(fileURLWithPath: outPath))
print("Wrote \(outPath) (\(data.count) bytes)")
