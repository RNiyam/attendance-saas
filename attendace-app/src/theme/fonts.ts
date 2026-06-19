export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export type FontWeightName = keyof typeof fonts;

export const fontAssets = {
  [fonts.regular]: require('../../assets/fonts/Inter_28pt-Regular.ttf'),
  [fonts.medium]: require('../../assets/fonts/Inter_28pt-Medium.ttf'),
  [fonts.semiBold]: require('../../assets/fonts/Inter_28pt-SemiBold.ttf'),
  [fonts.bold]: require('../../assets/fonts/Inter_28pt-Bold.ttf'),
};
