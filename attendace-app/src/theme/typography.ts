import type { TextStyle } from 'react-native';
import { fonts } from './fonts';

function type(family: string, fontSize: number, extra?: TextStyle): TextStyle {
  return { fontFamily: family, fontSize, ...extra };
}

/** Typography scale — Inter across the mobile app. */
export const typography = {
  /** Screen titles (Dashboard, Attendance) — Bold 24–28 */
  screenTitle: type(fonts.bold, 26, { lineHeight: 32, letterSpacing: -0.5 }),
  /** Section headers — SemiBold 18–20 */
  sectionHeader: type(fonts.semiBold, 19, { lineHeight: 24 }),
  /** Card titles — SemiBold 16–18 */
  cardTitle: type(fonts.semiBold, 17, { lineHeight: 22 }),
  /** Employee names — Medium 15–16 */
  employeeName: type(fonts.medium, 15, { lineHeight: 20 }),
  /** Body text — Regular 14–16 */
  body: type(fonts.regular, 15, { lineHeight: 22 }),
  bodySmall: type(fonts.regular, 14, { lineHeight: 20 }),
  /** Secondary / sub text — Regular 12–14 */
  secondary: type(fonts.regular, 13, { lineHeight: 18, color: '#9CA3AF' }),
  secondarySmall: type(fonts.regular, 12, { lineHeight: 16, color: '#9CA3AF' }),
  /** Form labels — Medium 13–14 */
  label: type(fonts.medium, 14, { lineHeight: 18 }),
  /** Button text — SemiBold 14–16 */
  button: type(fonts.semiBold, 15, { lineHeight: 20 }),
  /** Table / list data — Regular 14 */
  tableData: type(fonts.regular, 14, { lineHeight: 20 }),
  /** Status chips — Medium 12–14 */
  statusChip: type(fonts.medium, 13, { lineHeight: 16 }),
  /** Bottom tab labels — Medium 12 */
  tabLabel: type(fonts.medium, 12, { lineHeight: 16 }),
  /** Small captions — Regular 11–12 */
  caption: type(fonts.regular, 11, { lineHeight: 14 }),
} as const;
