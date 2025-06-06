import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import { Token } from 'src/positions/types'
import colors from 'src/styles/colors'
import { BaseToken } from 'src/tokens/slice'
import USD from './v2.png'

export enum IconSize {
  XXSMALL = 'xxsmall',
  XSMALL = 'xsmall',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
}

const IconSizeToStyle = {
  [IconSize.XXSMALL]: {
    tokenImageSize: 16,
    networkImageSize: 8,
    networkImagePosition: 10,
    tokenTextSize: 3,
  },
  [IconSize.XSMALL]: {
    tokenImageSize: 20,
    networkImageSize: 10,
    networkImagePosition: 12,
    tokenTextSize: 4,
  },
  [IconSize.SMALL]: {
    tokenImageSize: 24,
    networkImageSize: 9,
    networkImagePosition: 15,
    tokenTextSize: 6,
  },
  [IconSize.MEDIUM]: {
    tokenImageSize: 32,
    networkImageSize: 12,
    networkImagePosition: 20,
    tokenTextSize: 10,
  },
  [IconSize.LARGE]: {
    tokenImageSize: 40,
    networkImageSize: 16,
    networkImagePosition: 25,
    tokenTextSize: 12,
  },
  [IconSize.XLARGE]: {
    tokenImageSize: 48,
    networkImageSize: 20,
    networkImagePosition: 30,
    tokenTextSize: 14,
  },
}

interface Props {
  token: BaseToken | Token
  viewStyle?: StyleProp<ViewStyle>
  testID?: string
  size?: IconSize
  showNetworkIcon?: boolean
}

export default function TokenIcon({
  token,
  viewStyle,
  testID,
  size = IconSize.MEDIUM,
  showNetworkIcon = false,
}: Props) {
  const { tokenImageSize, networkImageSize, networkImagePosition, tokenTextSize } =
    IconSizeToStyle[size]

  const getTokenImagen = (token: BaseToken | Token) => {
    const symbols: Record<string, any> = {
      // cCOP: '',
      'USD₮': USD,
    }

    if (token.symbol && token.symbol in symbols) {
      return symbols[token.symbol]
    }
    return { uri: token.imageUrl }
  }

  return (
    <View testID={testID} style={[styles.defaultViewStyle, viewStyle]}>
      {token.imageUrl ? (
        <FastImage
          source={getTokenImagen(token)}
          style={[
            styles.tokenImage,
            {
              width: tokenImageSize,
              height: tokenImageSize,
              borderRadius: tokenImageSize / 2,
            },
          ]}
          testID={testID ? `${testID}/TokenIcon` : 'TokenIcon'}
        />
      ) : (
        <View
          style={[
            styles.tokenCircle,
            {
              width: tokenImageSize,
              height: tokenImageSize,
              borderRadius: tokenImageSize / 2,
            },
          ]}
          testID={testID ? `${testID}/DefaultTokenIcon` : 'DefaultTokenIcon'}
        >
          <Text style={[styles.tokenText, { fontSize: tokenTextSize }]} allowFontScaling={false}>
            {token.symbol.substring(0, 4)}
          </Text>
        </View>
      )}

      {!!token.networkIconUrl && showNetworkIcon && (
        <FastImage
          source={{ uri: token.networkIconUrl }}
          style={[
            styles.networkImage,
            {
              width: networkImageSize,
              height: networkImageSize,
              borderRadius: networkImageSize / 2,
              top: networkImagePosition,
              left: networkImagePosition,
            },
          ]}
          testID={testID ? `${testID}/NetworkIcon` : 'NetworkIcon'}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tokenImage: {
    position: 'relative',
    top: 0,
    left: 0,
  },
  networkImage: {
    position: 'absolute',
  },
  tokenCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray2,
  },
  tokenText: {
    color: colors.black,
    textAlign: 'center',
  },
  defaultViewStyle: { borderColor: colors.black, borderWidth: 1, borderRadius: 20 },
})
