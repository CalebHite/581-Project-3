// swift-tools-version: 5.9
// Apple PhotogrammetrySession — macOS only (Object Capture reconstruction).
import PackageDescription

let package = Package(
    name: "StyleViewScan",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "scan-reconstruct",
            path: "Sources"
        ),
    ]
)