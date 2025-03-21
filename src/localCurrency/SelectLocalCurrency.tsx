import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SelectionOption from 'src/components/SelectionOption'
import i18n from 'src/i18n'
import { selectPreferredCurrency } from 'src/localCurrency/actions'
import { LOCAL_CURRENCY_CODES, LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { useDispatch } from 'src/redux/hooks'
import { typeScale } from 'src/styles/fonts'

const DEFAULT_CURRENCY_CODE = LocalCurrencyCode.COP

function keyExtractor(item: LocalCurrencyCode) {
  return item
}

function SelectLocalCurrency() {
  const selectedCurrencyCode = useLocalCurrencyCode() || DEFAULT_CURRENCY_CODE
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const onSelect = (code: string) => {
    dispatch(selectPreferredCurrency(code as LocalCurrencyCode))

    // Wait for next frame before navigating back
    // so the user can see the changed selection briefly
    requestAnimationFrame(() => {
      navigateBack()
    })
  }

  const renderItem = ({ item: code }: ListRenderItemInfo<LocalCurrencyCode>) => {
    return (
      <SelectionOption
        key={code}
        text={code}
        onSelect={onSelect}
        isSelected={code === selectedCurrencyCode}
        data={code}
        testID={`SelectLocalCurrency/${code}`}
      />
    )
  }

  return (
    <ScrollView style={styles.container} testID="SelectLocalCurrencyScrollView">
      <SafeAreaView edges={['bottom']}>
        <Text style={styles.title} testID={'ChooseCurrencyTitle'}>
          {t('selectCurrency')}
        </Text>
        <FlatList
          initialNumToRender={LOCAL_CURRENCY_CODES.length}
          style={styles.container}
          data={LOCAL_CURRENCY_CODES}
          extraData={selectedCurrencyCode}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typeScale.titleMedium,
    margin: 16,
  },
})

SelectLocalCurrency.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTitle: i18n.t('localCurrencyTitle'),
})

export default SelectLocalCurrency
