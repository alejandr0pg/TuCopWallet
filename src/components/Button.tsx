import { debounce } from 'lodash'
import React, { ReactNode, useCallback } from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Shadow } from 'react-native-shadow-2'
import LinealGradientBtnBackground from 'src/components/LinealGradientBtnBackground'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'

const BUTTON_TAP_DEBOUNCE_TIME = 300 // milliseconds
const DEBOUNCE_OPTIONS = {
  leading: true,
  trailing: false,
}

export enum BtnTypes {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary',
  OUTLINE = 'Outline',
}

export enum BtnSizes {
  SMALL = 'small',
  MEDIUM = 'medium',
  FULL = 'full',
}

export enum TextSizes {
  SMALL = 'small',
  MEDIUM = 'medium',
  NORMAL = 'normal',
}

export interface ButtonProps {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  text: string | ReactNode
  showLoading?: boolean // shows activity indicator on the button, but doesn't disable it. disabled must explicitly be set to disable the button
  loadingColor?: string
  accessibilityLabel?: string
  type?: BtnTypes
  icon?: ReactNode
  iconPositionLeft?: boolean
  disabled?: boolean
  size?: BtnSizes
  testID?: string
  touchableStyle?: StyleProp<ViewStyle>
  iconMargin?: number
  textSize?: TextSizes
  textBold?: boolean
}

export default React.memo(function Button(props: ButtonProps) {
  const {
    accessibilityLabel,
    disabled,
    size,
    testID,
    text,
    icon,
    iconPositionLeft = true,
    type = BtnTypes.PRIMARY,
    style,
    showLoading,
    loadingColor,
    touchableStyle,
    textBold,
    iconMargin = 4,
    textSize = TextSizes.MEDIUM,
  } = props

  // Debounce onPress event so that it is called once on trigger and
  // consecutive calls in given period are ignored.
  const debouncedOnPress = useCallback(
    debounce(
      () => {
        if (type === BtnTypes.PRIMARY) {
          vibrateInformative()
        }
        props.onPress()
      },
      BUTTON_TAP_DEBOUNCE_TIME,
      DEBOUNCE_OPTIONS
    ),
    [props.onPress, type, disabled]
  )

  const { textColor, backgroundColor, opacity, borderColor } = getColors(type, disabled)

  return (
    <Shadow
      style={styles.shadow}
      offset={[0, 4]}
      distance={8}
      startColor="rgba(190, 201, 255, 0.28)"
      disabled={
        type === BtnTypes.PRIMARY || type === BtnTypes.OUTLINE || type === BtnTypes.TERTIARY
      }
    >
      <View style={getStyleForWrapper(size, style)}>
        {/* these Views cannot be combined as it will cause ripple to not respect the border radius */}
        <View style={[styles.containRipple, styles.rounded]}>
          <Touchable
            onPress={debouncedOnPress}
            disabled={disabled}
            style={[
              getStyle(size, backgroundColor, opacity, borderColor, iconPositionLeft),
              touchableStyle,
            ]}
            testID={testID}
          >
            <>
              {showLoading ? (
                <ActivityIndicator
                  size="small"
                  color={loadingColor ?? textColor}
                  testID="Button/Loading"
                />
              ) : (
                <>
                  {type === BtnTypes.PRIMARY && <LinealGradientBtnBackground />}
                  {icon}
                  <Text
                    maxFontSizeMultiplier={1}
                    accessibilityLabel={accessibilityLabel}
                    style={{
                      ...getTextStyle(textSize),
                      color: textColor,
                      marginLeft: icon && iconPositionLeft ? iconMargin : 0,
                      marginRight: icon && !iconPositionLeft ? iconMargin : 0,
                      fontWeight: textBold ? 'bold' : 'normal',
                    }}
                  >
                    {text}
                  </Text>
                </>
              )}
            </>
          </Touchable>
        </View>
      </View>
    </Shadow>
  )
})

const styles = StyleSheet.create({
  // on android Touchable Provides a ripple effect, by itself it does not respect the border radius on Touchable
  containRipple: {
    overflow: 'hidden',
  },
  shadow: {
    borderRadius: 15,
    alignSelf: 'stretch',
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  rounded: {
    borderRadius: 100,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 24,
    maxHeight: 56,
  },
  small: {
    height: 40,
    minWidth: 120,
  },
  medium: {
    height: 48,
    minWidth: 120,
  },
  full: {
    height: 48,
    flexGrow: 1,
    width: '100%',
  },
})

function getColors(type: BtnTypes, disabled: boolean | undefined) {
  let textColor
  let backgroundColor
  let opacity
  let borderColor
  switch (type) {
    case BtnTypes.PRIMARY:
      textColor = Colors.white
      backgroundColor = Colors.primary
      opacity = disabled ? 0.25 : 1.0
      break
    case BtnTypes.SECONDARY:
      textColor = Colors.primary
      backgroundColor = Colors.white
      borderColor = Colors.white
      opacity = disabled ? 0.5 : 1.0
      break
    case BtnTypes.TERTIARY:
      textColor = Colors.black
      backgroundColor = Colors.white
      borderColor = Colors.gray2
      opacity = disabled ? 0.5 : 1.0
      break
    case BtnTypes.OUTLINE:
      textColor = Colors.white
      backgroundColor = Colors.white11
      borderColor = Colors.white
      opacity = disabled ? 0.5 : 1
      break
  }

  return { textColor, backgroundColor, opacity, borderColor }
}

function getStyle(
  size: BtnSizes | undefined,
  backgroundColor: Colors,
  opacity: number | undefined,
  borderColor: Colors | undefined,
  iconPositionLeft: boolean
) {
  const borderStyles = borderColor
    ? {
        borderColor,
        borderRadius: 100,
        borderWidth: 1,
      }
    : {}
  const commonStyles: ViewStyle = {
    ...styles.button,
    ...borderStyles,
    backgroundColor,
    opacity,
    flexDirection: iconPositionLeft ? 'row' : 'row-reverse',
  }
  switch (size) {
    case BtnSizes.SMALL:
      return {
        ...commonStyles,
        ...styles.small,
      }
    case BtnSizes.FULL:
      return {
        ...commonStyles,
        ...styles.full,
      }
    default:
      return {
        ...commonStyles,
        ...styles.medium,
      }
  }
}

function getTextStyle(textSize: TextSizes | undefined) {
  switch (textSize) {
    case TextSizes.NORMAL:
      return typeScale.labelSemiBoldLarge
    case TextSizes.SMALL:
      return typeScale.labelSemiBoldSmall
    default:
      return typeScale.labelSemiBoldMedium
  }
}

function getStyleForWrapper(
  size: BtnSizes | undefined,
  style: StyleProp<ViewStyle>
): StyleProp<ViewStyle> {
  if (size === BtnSizes.FULL) {
    return [{ flexDirection: 'column', width: '100%' }, style]
  }
  return [{ flexDirection: 'row' }, style]
}
