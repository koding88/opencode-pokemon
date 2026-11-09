// Cuts the people out of a photo with Apple's Vision person segmentation (macOS 12+).
// usage: swift personmask.swift input.jpg output.png
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3, let input = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else {
    print("usage: swift personmask.swift input.jpg output.png")
    exit(1)
}

let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
try VNImageRequestHandler(ciImage: input).perform([request])
guard let maskBuffer = request.results?.first?.pixelBuffer else {
    print("no person found")
    exit(2)
}

var mask = CIImage(cvPixelBuffer: maskBuffer)
mask = mask.transformed(by: CGAffineTransform(
    scaleX: input.extent.width / mask.extent.width,
    y: input.extent.height / mask.extent.height))

let clear = CIImage(color: .clear).cropped(to: input.extent)
let cut = input.applyingFilter("CIBlendWithMask", parameters: [
    kCIInputBackgroundImageKey: clear,
    kCIInputMaskImageKey: mask,
])

let context = CIContext()
guard let cg = context.createCGImage(cut, from: input.extent) else { exit(3) }
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("ok")
