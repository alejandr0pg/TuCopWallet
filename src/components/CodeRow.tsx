import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import TextInput from 'src/components/TextInput'
import withTextInputPasteAware from 'src/components/WithTextInputPasteAware'
import { withTranslation } from 'src/i18n'
import Checkmark from 'src/icons/Checkmark'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

const CodeInput = withTextInputPasteAware(TextInput)

export enum CodeRowStatus {
  DISABLED, // input disabled
  INPUTTING, // input enabled
  PROCESSING, // is the inputted code being processed
  RECEIVED, // is the inputted code recieved but not yet confirmed
  ACCEPTED, // has the code been accepted and completed
}

export interface CodeRowProps {
  status: CodeRowStatus
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
  shouldShowClipboard: (value: string) => boolean
  testID?: string
}

type Props = CodeRowProps & WithTranslation

function CodeRow({
  status,
  inputValue,
  inputPlaceholder,
  onInputChange,
  shouldShowClipboard,
  t,
  testID,
}: Props) {
  if (status === CodeRowStatus.DISABLED) {
    return (
      <View style={styles.codeInputDisabledContainer}>
        <Text style={styles.codeValue}>{inputPlaceholder}</Text>
      </View>
    )
  }

  if (status === CodeRowStatus.INPUTTING) {
    return (
      <CodeInput
        value={inputValue}
        placeholder={inputPlaceholder}
        shouldShowClipboard={shouldShowClipboard}
        onChangeText={onInputChange}
        style={styles.codeInput}
        testID={testID}
      />
    )
  }

  const shortenedInput = inputValue && inputValue.substr(0, 25) + '...'

  if (status === CodeRowStatus.PROCESSING) {
    return (
      <View style={styles.codeProcessingContainer}>
        <Text style={styles.codeValue}>{shortenedInput || t('processing')}</Text>
        <ActivityIndicator size="small" color={colors.accent} style={styles.codeInputSpinner} />
      </View>
    )
  }

  if (status === CodeRowStatus.RECEIVED) {
    return (
      <View style={styles.codeReceivedContainer}>
        <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode={'tail'}>
          {shortenedInput || t('processing')}
        </Text>
      </View>
    )
  }

  if (status === CodeRowStatus.ACCEPTED) {
    return (
      <View style={styles.codeReceivedContainer}>
        <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode={'tail'}>
          {shortenedInput || t('accepted')}
        </Text>
        <View style={styles.checkmarkContainer}>
          <Checkmark height={20} width={20} />
        </View>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  codeInput: {
    flex: 0,
    backgroundColor: colors.white,
    borderColor: colors.gray2,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    marginVertical: 5,
  },
  codeReceivedContainer: {
    justifyContent: 'center',
    marginVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.gray1,
    borderRadius: 3,
    height: 50,
  },
  checkmarkContainer: {
    backgroundColor: colors.gray1,
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 10,
  },
  codeProcessingContainer: {
    backgroundColor: colors.white,
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 5,
    paddingHorizontal: 10,
    borderColor: colors.gray2,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
  },
  codeInputSpinner: {
    backgroundColor: colors.white,
    position: 'absolute',
    top: 5,
    right: 3,
    padding: 10,
  },
  codeInputDisabledContainer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginVertical: 5,
    borderColor: colors.gray2,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    backgroundColor: colors.gray1,
  },
  codeValue: {
    ...typeScale.bodyMedium,
    fontSize: 15,
    color: colors.gray5,
  },
})

export default withTranslation<Props>()(CodeRow)
