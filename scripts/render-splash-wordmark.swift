// Renders the launch screen wordmark: SUNDAYBEST in the masthead face
// (Bodoni Moda Medium), brand black, transparent background.
// Usage: swift scripts/render-splash-wordmark.swift assets/fonts/BodoniModa_9pt-Medium.ttf assets/splash-wordmark.png
import AppKit
import CoreText

let args = CommandLine.arguments
let fontURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
var error: Unmanaged<CFError>?
CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, &error)
let descriptors = CTFontManagerCreateFontDescriptorsFromURL(fontURL as CFURL) as! [CTFontDescriptor]
let font = CTFontCreateWithFontDescriptor(descriptors[0], 144, nil)
// The brand black, #08090A.
let ink = NSColor(srgbRed: 8/255, green: 9/255, blue: 10/255, alpha: 1)
let text = NSAttributedString(string: "SUNDAYBEST", attributes: [.font: font, .foregroundColor: ink])
let line = CTLineCreateWithAttributedString(text)
let bounds = CTLineGetImageBounds(line, nil)
let pad: CGFloat = 8
let width = Int(ceil(bounds.width + pad * 2)), height = Int(ceil(bounds.height + pad * 2))
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4,
  hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let context = NSGraphicsContext(bitmapImageRep: rep)!
NSGraphicsContext.current = context
let cg = context.cgContext
cg.clear(CGRect(x: 0, y: 0, width: width, height: height))
cg.textPosition = CGPoint(x: pad - bounds.minX, y: pad - bounds.minY)
CTLineDraw(line, cg)
context.flushGraphics()
try! rep.representation(using: .png, properties: [:])!.write(to: outURL)
print(width, height)
