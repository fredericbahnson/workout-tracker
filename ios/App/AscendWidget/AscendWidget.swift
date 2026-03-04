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

struct AscendWidgetEntryView: View {
    var entry: SimpleEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                Image("WidgetIcon")
                    .resizable()
                    .scaledToFit()
                    .clipShape(Circle())
                    .padding(4)
            }
            .widgetURL(URL(string: "ascend://today"))

        case .accessoryRectangular:
            HStack(spacing: 8) {
                Image("WidgetIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 26, height: 26)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                Text("Ascend")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .widgetURL(URL(string: "ascend://today"))

        default:
            Image("WidgetIcon")
                .resizable()
                .scaledToFit()
                .widgetURL(URL(string: "ascend://today"))
        }
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

