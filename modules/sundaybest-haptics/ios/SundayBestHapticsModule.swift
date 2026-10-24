import ExpoModulesCore
import UIKit

/// A haptic tap at a set intensity. expo-haptics offers only fixed styles, and
/// even its lightest impact is firmer than a gentle, continuous tick wants to
/// be; UIKit's impact generator takes an intensity from 0 to 1.
public class SundayBestHapticsModule: Module {
  private lazy var generator = UIImpactFeedbackGenerator(style: .light)

  public func definition() -> ModuleDefinition {
    Name("SundayBestHaptics")

    /// A light impact at `intensity` (0–1), kept ready for the next one.
    AsyncFunction("tap") { (intensity: Double) in
      self.generator.impactOccurred(intensity: CGFloat(min(max(intensity, 0), 1)))
      self.generator.prepare()
    }.runOnQueue(.main)
  }
}
