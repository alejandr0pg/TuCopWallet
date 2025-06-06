import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, Text, TextStyle } from 'react-native'
import { APPROX_SYMBOL } from 'src/components/TokenEnterAmount'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfo } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'

const DEFAULT_DISPLAY_DECIMALS = 2

function calculateDecimalsToShow(value: BigNumber) {
  const exponent = value?.e ?? 0
  if (exponent >= 0) {
    return DEFAULT_DISPLAY_DECIMALS
  }

  return Math.abs(exponent) + 1
}

// Formats |value| so that it shows at least 2 significant figures and at least 2 decimal places without trailing zeros.
export function formatValueToDisplay(value: BigNumber) {
  let decimals = calculateDecimalsToShow(value)
  let text = value.toFormat(decimals)
  while (text[text.length - 1] === '0' && decimals-- > 2) {
    text = text.substring(0, text.length - 1)
  }
  return text
}

export const getTokenSymbol = (t: any, symbol: string | undefined) => {
  const symbols: Record<string, string> = {
    cCOP: t('assets.pesos'),
    'USD₮': t('assets.dollars'),
  }

  return symbol && symbol in symbols ? symbols[symbol] : symbol
}

interface Props {
  amount: BigNumber.Value
  tokenId?: string
  showSymbol?: boolean
  showLocalAmount?: boolean
  hideSign?: boolean
  showApprox?: boolean
  showExplicitPositiveSign?: boolean
  localAmount?: LocalAmount
  style?: StyleProp<TextStyle>
  testID?: string
  errorFallback?: string
}

function TokenDisplay({
  amount,
  tokenId,
  showLocalAmount = true,
  showSymbol = true,
  showExplicitPositiveSign = false,
  hideSign = false,
  showApprox = false,
  localAmount,
  style,
  testID,
  errorFallback = '-',
}: Props) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(tokenId)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const showError = showLocalAmount
    ? !localAmount && (!tokenInfo?.priceUsd || !localCurrencyExchangeRate)
    : !tokenInfo?.symbol

  const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(amount)
  const amountInLocalCurrency = localAmount
    ? new BigNumber(localAmount.value)
    : new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(amountInUsd ?? 0)
  const fiatSymbol = localAmount
    ? LocalCurrencySymbol[localAmount.currencyCode as LocalCurrencyCode]
    : localCurrencySymbol

  const amountToShow = showLocalAmount ? amountInLocalCurrency : new BigNumber(amount)

  const sign = hideSign ? '' : amountToShow.isNegative() ? '-' : showExplicitPositiveSign ? '+' : ''
  const amountFallback = '--'

  return (
    <Text style={style} testID={testID}>
      {showError ? (
        errorFallback
      ) : (
        <>
          {showApprox && `${APPROX_SYMBOL} `}
          {sign}
          {showLocalAmount && fiatSymbol}
          {amountToShow.isNaN()
            ? amountFallback
            : formatValueToDisplay(amountToShow.absoluteValue())}
          {!showLocalAmount && showSymbol && ` ${getTokenSymbol(t, tokenInfo?.symbol) ?? ''}`}
        </>
      )}
    </Text>
  )
}

export default TokenDisplay
