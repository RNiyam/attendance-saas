import { Text, TextInput } from 'react-native';
import { fonts } from './fonts';

let applied = false;

/** Sets Inter Regular as the default for all Text and TextInput (override with fontFamily in styles). */
export function applyGlobalFontDefaults() {
  if (applied) return;
  applied = true;

  const defaultStyle = { fontFamily: fonts.regular };

  const patch = (Component: typeof Text | typeof TextInput) => {
    const C = Component as typeof Text & { defaultProps?: { style?: unknown } };
    C.defaultProps = C.defaultProps ?? {};
    const prev = C.defaultProps.style;
    C.defaultProps.style = prev ? [defaultStyle, prev] : defaultStyle;
  };

  patch(Text);
  patch(TextInput);
}
