import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { HomeSkeleton } from "../components/HomeSkeleton";
import { ArtworkFlight } from "../components/ArtworkFlight";
import { DailyRise } from "../components/DailyRise";
import { FeaturedStudy } from "../components/FeaturedStudy";
import { StudyBar } from "../components/StudyBar";
import { useDailyRise } from "../hooks/use-daily-rise";
import { useStudyScroll } from "../hooks/use-study-scroll";
import { useHomeView } from "../hooks/use-home-view";
import { useHomeDevMenu } from "../hooks/use-home-dev-menu";
import { useRiseIn } from "../hooks/use-rise-in";
import { reached, useWelcomeEntrance } from "../hooks/use-welcome-entrance";
import { StartHereHero } from "../components/StartHereHero";
import { HomeOnboarding } from "../components/HomeOnboarding";
import { HomeWordmark } from "../components/HomeWordmark";
import { VerseCard } from "../components/VerseCard";
import { Divider } from "@/ui/atoms/Divider";
import { controlHeight, motion, space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Arrive } from "@/ui/arrival/Arrive";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { useScrollToTopTarget } from "@/ui/organisms/status-bar/scroll-to-top";
import { useHideTabBar } from "@/ui/organisms/tab-bar/tab-bar-accessory";

/**
 * How far the wordmark runs off the screen's left edge, as if it came from
 * beyond the page: its brush's dry start is cut away, its S still clear of
 * the edge.
 */
const WORDMARK_BLEED = 12;

/** A header action's 44pt tap target — the masthead row keeps it. */
const HEADER_HEIGHT = controlHeight.hitTarget;

/**
 * Home, from the API plan cache, set as an editorial page on white: the
 * masthead, then the study under way (`FeaturedStudy`) — its 16:9 artwork,
 * where it stands, its title in Canela, today's study, and Continue — and the
 * verse of the day open beneath it. With no plan under way: Start here. With
 * no plans of their own yet: the welcome (`HomeOnboarding`). The tab bar's +
 * also starts a new plan.
 */
export function HomeScreen() {
  const view = useHomeView();
  // Today's game, under the study: playing itself while it's on screen.
  const dailyGame = useDailyRise(!view.onboarding && !view.loading);
  // The featured study answering the scroll: parallax, fading words, the bar coming in.
  const { artworkRef, wordsRef, continueRef, mastheadRef, ...studyScroll } = useStudyScroll();
  // Before a first plan: a blank beat, then the masthead, the note and the button in turn.
  const welcome = useWelcomeEntrance(view.onboarding);
  // Development builds: Home's states and the welcome's replay, in the developer menu.
  useHomeDevMenu(welcome.replay);
  const mastheadShown = !view.onboarding || reached(welcome.phase, "masthead");
  const wordmarkRise = useRiseIn(mastheadShown);
  const dateRise = useRiseIn(mastheadShown, motion.welcome.staggerMs);
  // Before a plan of their own, the page is the whole screen: the tab bar steps away.
  useHideTabBar(view.onboarding);
  const scroll = useRef<Animated.ScrollView>(null);
  // A tap on the status bar scrolls Home up, as iOS's does.
  useScrollToTopTarget(() => scroll.current?.scrollTo({ y: 0, animated: true }));

  if (view.error) {
    return (
      <View style={styles.root}>
        <ScreenLoadError testID="home-load-error" title="Couldn't load Home" onRetry={view.retry} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Screen testID="home-tab-screen" padded="vertical">
        {/* After the launch, the header comes down into place and the hero rises in. */}
        <Arrive from="above" order={0}>
          <Animated.View
            pointerEvents={studyScroll.barTouchable ? "none" : "auto"}
            style={studyScroll.mastheadStyle}
          >
            <View
              ref={mastheadRef}
              collapsable={false}
              onLayout={studyScroll.onMastheadLayout}
              testID="home-tab-header"
              style={styles.header}
            >
              {/* Before a first plan, the wordmark then the date rise in after a blank beat. */}
              <Animated.View style={[styles.wordmark, wordmarkRise]}>
                <HomeWordmark onPress={view.devActions} />
              </Animated.View>
              <Animated.View style={[styles.dateSlot, dateRise]}>
                <MonoLabel
                  variant="headerDate"
                  tone="textSupporting"
                  testID="home-tab-date"
                  numberOfLines={1}
                  style={styles.date}
                >
                  {view.date}
                </MonoLabel>
              </Animated.View>
            </View>
          </Animated.View>
        </Arrive>

        {view.onboarding ? (
          // Drawn once the phone's said whether the welcome's been seen, so it plays — or doesn't — whole.
          welcome.ready && (
            <Arrive from="below" order={1} style={styles.onboarding}>
              <HomeOnboarding
                key={welcome.run}
                testID="home-onboarding"
                onAddSermon={view.addSermon}
                phase={welcome.phase}
                onTyped={welcome.typed}
                samples={view.samples}
                onOpenSample={view.openSample}
              />
            </Arrive>
          )
        ) : (
          <Animated.ScrollView
            ref={scroll}
            testID="home-tab-scroll"
            onScroll={studyScroll.onScroll}
            scrollEventThrottle={16}
            snapToOffsets={studyScroll.snapOffsets}
            snapToStart={false}
            snapToEnd={false}
            onContentSizeChange={studyScroll.onContentSizeChange}
            onLayout={(event) => studyScroll.onScrollLayout(event.nativeEvent.layout.height)}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Arrive from="below" order={1}>
              <SkeletonHandoff
                testID="home-handoff"
                pending={view.loading}
                skeleton={<HomeSkeleton testID="home-content-pending" />}
                style={styles.home}
              >
                {view.active ? (
                  <FeaturedStudy
                    study={view.active.study}
                    href={view.active.href}
                    onContinue={view.continueToday}
                    artworkRef={artworkRef}
                    onArtworkLayout={studyScroll.onArtworkLayout}
                    artworkStyle={studyScroll.artworkStyle}
                    wordsRef={wordsRef}
                    onWordsLayout={studyScroll.onWordsLayout}
                    wordsStyle={studyScroll.wordsStyle}
                    continueRef={continueRef}
                    onContinueLayout={studyScroll.onContinueLayout}
                    continueStyle={studyScroll.continueStyle}
                  />
                ) : (
                  <StartHereHero onAddSermon={view.addSermon} />
                )}
                <Divider testID="home-game-rule" />
                <DailyRise {...dailyGame} />
                {/* A rule between the two sections, as a page sets apart its next story. */}
                {view.verse && <Divider testID="home-section-rule" />}
                {view.verse && (
                  <VerseCard
                    testID="home-verse"
                    verse={view.verse.verse}
                    reference={view.verse.reference}
                    passage={view.verse.passage}
                    caption={view.verse.caption}
                    day={view.verse.day}
                    liked={view.verse.liked}
                    onLike={view.verse.toggleLike}
                    onShare={view.verse.share}
                  />
                )}
              </SkeletonHandoff>
            </Arrive>
          </Animated.ScrollView>
        )}
      </Screen>

      {!view.loading && view.active && (
        <>
          <StudyBar
            study={view.active.study}
            topInset={studyScroll.insetTop}
            style={studyScroll.barStyle}
            thumbStyle={studyScroll.barThumbStyle}
            touchable={studyScroll.barTouchable}
            href={view.active.href}
            onContinue={view.continueToday}
          />
          <ArtworkFlight
            thumbnailUrl={view.active.study.thumbnailUrl}
            style={studyScroll.flightStyle}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    minHeight: HEADER_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PAGE_INSET,
    gap: space[12],
  },

  // The wordmark comes in from beyond the screen's left edge: the header's inset is the date's alone.
  wordmark: { marginLeft: -(PAGE_INSET + WORDMARK_BLEED) },

  // When the row is tight, the date gives way; the wordmark never does.
  dateSlot: { flexShrink: 1 },
  date: { flexShrink: 1, paddingBottom: space[2] },

  scroll: {
    flex: 1,
    overflow: "visible",
  },

  content: {
    paddingHorizontal: PAGE_INSET,
    paddingTop: space[20],
    paddingBottom: FLOATING_NAV_BAR_CLEARANCE,
  },

  // The study, the rule and the verse: two sections of a page, with generous room between.
  home: {
    gap: space[40],
  },

  onboarding: { flex: 1 },
});
