import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SvgUri } from 'react-native-svg'
import Logo from 'src/images/Logo'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'

const DAPP_IMAGE_SIZE = 40

interface Props {
  dappImageUrl?: string
  dappName: string
}

export default function Logos({ dappImageUrl, dappName }: Props) {
  if (!dappImageUrl) {
    return null
  }

  let isDappImageSvg = false
  try {
    const parsedUrl = new URL(dappImageUrl ?? '')
    isDappImageSvg = parsedUrl.pathname.toLowerCase().endsWith('.svg')
  } catch (error) {
    // do nothing if the url cannot be parsed
  }

  return (
    <View style={styles.logoContainer}>
      <View style={styles.tucopLogoShadow}>
        <View style={styles.tucopLogoBackground}>
          <Logo size={20} />
        </View>
      </View>
      <View style={styles.logoShadow}>
        {isDappImageSvg ? (
          <View style={styles.logoBackground}>
            <SvgUri width={24} height={24} uri={dappImageUrl} />
          </View>
        ) : dappImageUrl ? (
          <Image style={styles.dappImage} source={{ uri: dappImageUrl }} resizeMode="cover" />
        ) : (
          <View style={[styles.logoBackground, styles.placeholderLogoBackground]}>
            <Text allowFontScaling={false} style={styles.placeholderLogoText}>
              {dappName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.Regular16,
    paddingStart: 25,
  },
  logoShadow: {
    ...getShadowStyle(Shadow.SoftLight),
    borderRadius: 100,
  },
  tucopLogoShadow: {
    ...getShadowStyle(Shadow.SoftLight),
    borderRadius: 16,
  },
  logoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.white,
  },
  tucopLogoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE * 2.0, // Más ancho para acomodar el logo rectangular
    borderRadius: 16, // Bordes más redondeados
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.Tiny4,
  },
  dappImage: {
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.white,
    marginLeft: -4,
  },
  placeholderLogoBackground: {
    backgroundColor: Colors.white,
    marginRight: -Spacing.Small12,
    borderColor: Colors.gray2,
    borderWidth: 1,
  },
  placeholderLogoText: {
    ...typeScale.titleMedium,
    lineHeight: undefined,
    color: Colors.gray4,
  },
})
