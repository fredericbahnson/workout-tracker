import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        completion(SimpleEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
        let timeline = Timeline(entries: [SimpleEntry(date: Date())], policy: .never)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

struct MountainShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height

        // Single triangle peak
        let peak  = CGPoint(x: w * 0.50, y: h * 0.18)
        let left  = CGPoint(x: w * 0.08, y: h * 0.78)
        let right = CGPoint(x: w * 0.92, y: h * 0.78)

        path.move(to: peak)
        path.addLine(to: left)
        path.addLine(to: right)
        path.closeSubpath()

        // Base line
        path.move(to:    CGPoint(x: w * 0.08, y: h * 0.84))
        path.addLine(to: CGPoint(x: w * 0.92, y: h * 0.84))

        return path
    }
}

struct AscendWidgetEntryView: View {
    var entry: SimpleEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            MountainShape()
                .stroke(.primary, lineWidth: 0)  // zero stroke, fill only
            MountainShape()
                .fill(.primary)
                .padding(6)
        }
        .widgetURL(URL(string: "ascend://today"))
    }
}

struct AscendWidget: Widget {
    let kind: String = "AscendWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            AscendWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Ascend")
        .description("Open Ascend directly from your lock screen.")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
        ])
    }
}

