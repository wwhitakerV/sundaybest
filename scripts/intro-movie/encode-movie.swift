// Encodes the captured launch-intro frames into one HEVC movie, with macOS's own
// encoder (AVFoundation): nothing to install.
// Usage: swift scripts/intro-movie/encode-movie.swift <frames dir> <out.mp4> <fps> <megabits a second>
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let args = CommandLine.arguments
guard args.count == 5, let fps = Int32(args[3]), let megabits = Double(args[4]) else {
  print("Usage: swift encode-movie.swift <frames dir> <out.mp4> <fps> <megabits a second>")
  exit(1)
}
let dir = URL(fileURLWithPath: args[1])
let out = URL(fileURLWithPath: args[2])
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path)
  .filter { $0.hasSuffix(".png") && $0.first?.isNumber == true }
  .sorted()

func load(_ name: String) -> CGImage {
  let source = CGImageSourceCreateWithURL(dir.appendingPathComponent(name) as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(source, 0, nil)!
}

let first = load(files[0])
let width = first.width
let height = first.height
try? FileManager.default.removeItem(at: out)
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
// A set bitrate: the hardware encoder ignores a quality setting and picks its own,
// too low for the water's soft gradients, which then band and block.
let compression: [String: Any] = [
  AVVideoAverageBitRateKey: megabits * 1_000_000,
  AVVideoExpectedSourceFrameRateKey: fps,
  // A key frame every second, so seeking (and pausing in the hold) lands quickly.
  AVVideoMaxKeyFrameIntervalKey: fps,
]
let input = AVAssetWriterInput(
  mediaType: .video,
  outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.hevc,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    // sRGB's primaries are Rec. 709's: the frames' colours carry over as they are.
    AVVideoColorPropertiesKey: [
      AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
      AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
      AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: compression,
  ])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: input,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
  ])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
for (i, name) in files.enumerated() {
  while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
  var made: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &made)
  let buffer = made!
  CVPixelBufferLockBaseAddress(buffer, [])
  let context = CGContext(
    data: CVPixelBufferGetBaseAddress(buffer), width: width, height: height, bitsPerComponent: 8,
    bytesPerRow: CVPixelBufferGetBytesPerRow(buffer), space: sRGB,
    bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  context.draw(load(name), in: CGRect(x: 0, y: 0, width: width, height: height))
  CVPixelBufferUnlockBaseAddress(buffer, [])
  adaptor.append(buffer, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
  if i % 120 == 0 { print("encoded \(i + 1)/\(files.count)") }
}
input.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()
guard writer.status == .completed else {
  print("Encoding failed: \(String(describing: writer.error))")
  exit(1)
}
print("Wrote \(out.path)")
