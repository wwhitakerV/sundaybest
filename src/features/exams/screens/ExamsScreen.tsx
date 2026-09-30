import { useContext } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react-native";

import { getFloatingNavBarClearance } from "@/ui/floatingNavBar";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { IconSquareButton } from "@/ui/IconSquareButton";
import { PAGE_INSET, Screen } from "@/ui/Screen";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { useTheme } from "@/theme";
import { ExamFolio } from "../components/ExamFolio";
import { SUBJECTS } from "../data/catalog";
import { useContinueAttempt } from "../hooks/use-continue-attempt";
import { useSubjectCarousel } from "../hooks/use-subject-carousel";
import { formatCatalogCount, formatSubjectPosition } from "../logic/catalog";
import { examSessionHref, examSubjectHref, examSubjectsHref } from "../logic/routes";

/** Room above the books, and below them for their shadow. */
const BOOK_ROOM = { top: 8, bottom: 22 } as const;
const CONTINUE_HEIGHT = 48;
const CONTINUE_ICON = 18;
const CONTINUE_DOT = 7;
/** How small the page's title may set itself to stay on one line. */
const MIN_TITLE_SCALE = 0.7;

/**
 * Theology Exams, from Fun: its subjects as a shelf of books, on a page
 * that never scrolls up and down. Its name, how many subjects and exams it
 * holds, a way straight back into an exam left under way, which subject is
 * in view with All subjects (a sheet of every one)
 * beside it, then the books themselves filling the rest, down to the tab
 * bar — a book a subject (`ExamFolio`), each made in full, the next peeking
 * in beside the one in view. Swiped across, they slide; the one in view,
 * pressed, opens its subject's exams, and one beside it is brought into
 * view. Opens on the subject the sheet picked, if it did.
 */
export function ExamsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const { subject } = useLocalSearchParams<{ subject?: string }>();
  const requested = SUBJECTS.findIndex(({ id }) => id === subject);
  const { scrollRef, index, geometry, height, goTo, onLayout, onMomentumScrollEnd } =
    useSubjectCarousel(SUBJECTS.length, requested >= 0 ? requested : null);
  const bookHeight = Math.max(0, height - BOOK_ROOM.top - BOOK_ROOM.bottom);
  const underWay = useContinueAttempt();

  return (
    <Screen testID="exams-screen" padded="vertical">
      <View style={styles.inset}>
        <ScreenHeader
          title=""
          left={
            <HeaderIconButton
              testID="exams-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={() => router.back()}
            />
          }
        />
      </View>

      <View style={[styles.inset, { gap: theme.spacing.xs }]}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={MIN_TITLE_SCALE}
          style={[theme.typography.editorialHero, { color: theme.colors.text }]}
        >
          Theology Exams
        </Text>
        <Text
          testID="exams-count"
          style={[theme.typography.summaryStrong, { color: theme.colors.textInactive }]}
        >
          {formatCatalogCount(SUBJECTS)}
        </Text>
      </View>

      {underWay && (
        <View style={styles.inset}>
          <Pressable
            testID="exams-continue"
            accessibilityRole="button"
            accessibilityLabel={`${underWay.label}, ${underWay.detail}`}
            accessibilityHint="Goes back into it"
            onPress={() => router.push(examSessionHref(underWay.attemptId))}
            style={[
              styles.continue,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.lg,
                paddingHorizontal: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.accent, borderRadius: theme.radii.pill },
              ]}
            />
            <View style={styles.continueWords}>
              <Text
                numberOfLines={1}
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                {underWay.label}
              </Text>
              <Text style={[theme.typography.stepLabel, { color: theme.colors.textInactive }]}>
                {underWay.detail}
              </Text>
            </View>
            <ArrowRight
              size={CONTINUE_ICON}
              color={theme.colors.text}
              strokeWidth={theme.icon.strokeWidth}
            />
          </Pressable>
        </View>
      )}

      <View style={[styles.inset, styles.controls, { gap: theme.spacing.sm }]}>
        <Text
          testID="exams-position"
          numberOfLines={1}
          style={[theme.typography.kicker, styles.position, { color: theme.colors.textMuted }]}
        >
          Subject {formatSubjectPosition(index, SUBJECTS.length)}
        </Text>
        <IconSquareButton
          testID="exams-all-subjects-button"
          icon={LayoutGrid}
          accessibilityLabel="All subjects"
          onPress={() => router.push(examSubjectsHref)}
        />
      </View>

      {/* The rest of the page, down to the tab bar: the books fill it. */}
      <View
        testID="exams-carousel"
        onLayout={onLayout}
        style={[styles.shelf, { marginBottom: getFloatingNavBarClearance(insetBottom) }]}
      >
        <ScrollView
          testID="exams-carousel-scroller"
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={geometry.interval || undefined}
          snapToAlignment="start"
          onMomentumScrollEnd={onMomentumScrollEnd}
          contentContainerStyle={{
            gap: geometry.gap,
            paddingLeft: geometry.inset,
            paddingRight: geometry.trailing,
            paddingTop: BOOK_ROOM.top,
            paddingBottom: BOOK_ROOM.bottom,
          }}
        >
          {geometry.width > 0 &&
            bookHeight > 0 &&
            SUBJECTS.map((item, position) => (
              <ExamFolio
                key={item.id}
                testID={`exams-folio-${item.id}`}
                subject={item}
                index={position}
                width={geometry.width}
                height={bookHeight}
                inView={position === index}
                onPress={() =>
                  position === index ? router.push(examSubjectHref(item.id)) : goTo(position)
                }
              />
            ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: PAGE_INSET },
  controls: { flexDirection: "row", alignItems: "center" },
  position: { flex: 1 },
  shelf: { flex: 1 },
  continue: { minHeight: CONTINUE_HEIGHT, flexDirection: "row", alignItems: "center" },
  continueWords: { flex: 1 },
  dot: { width: CONTINUE_DOT, height: CONTINUE_DOT },
});
