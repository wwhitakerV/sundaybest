Pod::Spec.new do |s|
  s.name           = 'SundayBestHaptics'
  s.version        = '1.0.0'
  s.summary        = 'A haptic tap at an intensity SundayBest sets.'
  s.description    = 'iOS impact haptics with impactOccurred(intensity:), which expo-haptics does not expose.'
  s.author         = 'SundayBest'
  s.homepage       = 'https://sundaybest.com'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
end
