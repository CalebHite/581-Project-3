import Foundation
import RealityKit

@available(macOS 13.0, *)
func run(input: URL, output: URL) async throws {
    var configuration = PhotogrammetrySession.Configuration()
    configuration.sampleOrdering = .unordered

    let session = try PhotogrammetrySession(input: input, configuration: configuration)
    let request = PhotogrammetrySession.Request.modelFile(url: output, detail: .medium)

    try session.process(requests: [request])

    for try await event in session.outputs {
        switch event {
        case .processingComplete:
            return
        case .requestError(_, let error):
            throw error
        case .requestComplete(_, _):
            return
        default:
            continue
        }
    }
}

if #available(macOS 13.0, *) {
    let args = CommandLine.arguments
    guard args.count >= 3 else {
        fputs("Usage: scan-reconstruct <imageFolder> <output.usdz>\n", stderr)
        exit(1)
    }
    let input = URL(fileURLWithPath: args[1], isDirectory: true)
    let output = URL(fileURLWithPath: args[2])
    let sema = DispatchSemaphore(value: 0)
    var runError: Error?
    Task {
        do {
            try await run(input: input, output: output)
        } catch {
            runError = error
        }
        sema.signal()
    }
    sema.wait()
    if let runError {
        fputs("\(runError)\n", stderr)
        exit(2)
    }
    print(output.path)
} else {
    fputs("Requires macOS 13+\n", stderr)
    exit(3)
}