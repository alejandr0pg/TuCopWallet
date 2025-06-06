import { FiatAccountType, ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, BackHandler, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import { FormatType } from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import LineItemRow from 'src/components/LineItemRow'
import Touchable from 'src/components/Touchable'
import { CryptoAmount, FiatAmount } from 'src/fiatExchanges/amount'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { convertToFiatConnectFiatCurrency } from 'src/fiatconnect'
import {
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
} from 'src/fiatconnect/selectors'
import { createFiatConnectTransfer, refetchQuote } from 'src/fiatconnect/slice'
import i18n from 'src/i18n'
import {
  getDefaultLocalCurrencyCode,
  usdToLocalCurrencyRateSelector,
} from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import {
  getFeeCurrencyAndAmounts,
  prepareERC20TransferTransaction,
} from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatConnectReview>

const usePrepareBaseFiatConnectOutTransactions = ({
  transferAmount,
  token,
  tokenId,
}: {
  transferAmount: string
  token?: TokenBalance
  tokenId: string
}) => {
  const walletAddress = useSelector(walletAddressSelector)

  return useAsync(async () => {
    if (!walletAddress) {
      throw new Error('Missing wallet address')
    }
    if (!token) {
      throw new Error(`Missing token info for token id ${tokenId}`)
    }
    if (!token.address) {
      throw new Error(
        `Fiatconnect only supports ERC-20 tokens. Token ${tokenId} is missing address`
      )
    }

    // note that the receipient address on the prepared transaction is the
    // user's own address. this will be replaced by the fiatconnect provider
    // transfer address in the sagas if the user proceeds with the transaction.
    // the provider address is not known until making a POST request to the
    // provider endpoint, which we should only do if the user intends to proceed
    // with the transaction because it locks the quoteId and prevents it from
    // being used again.
    return prepareERC20TransferTransaction({
      fromWalletAddress: walletAddress,
      toWalletAddress: walletAddress,
      amount: BigInt(tokenAmountInSmallestUnit(new BigNumber(transferAmount), token.decimals)),
      feeCurrencies: [token], // according to the FC spec, the fee currency is paid in the same token as the cash out token
      sendToken: token as TokenBalanceWithAddress,
    })
  }, [token, tokenId, transferAmount])
}

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow, normalizedQuote, fiatAccount, shouldRefetchQuote } = route.params
  const fiatConnectQuotesLoading = useSelector(fiatConnectQuotesLoadingSelector)
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)
  const defaultLocaleCurrencyCode = useSelector(getDefaultLocalCurrencyCode)
  const [showingExpiredQuoteDialog, setShowingExpiredQuoteDialog] = useState(
    normalizedQuote.getGuaranteedUntil() < new Date()
  )
  const showFeeDisclaimer = useMemo(
    () =>
      normalizedQuote.getFiatType() !== convertToFiatConnectFiatCurrency(defaultLocaleCurrencyCode),
    [normalizedQuote, defaultLocaleCurrencyCode]
  )

  const tokenId = normalizedQuote.getTokenId()
  const token = useTokenInfo(tokenId)

  const prepareTransactionsResult = usePrepareBaseFiatConnectOutTransactions({
    transferAmount: normalizedQuote.getCryptoAmount(),
    tokenId: normalizedQuote.getTokenId(),
    token,
  })
  const networkFee = getFeeCurrencyAndAmounts(prepareTransactionsResult.result)

  useEffect(() => {
    if (shouldRefetchQuote) {
      dispatch(
        refetchQuote({
          flow,
          cryptoType: normalizedQuote.getCryptoType(),
          cryptoAmount: normalizedQuote.getCryptoAmount(),
          fiatAmount: normalizedQuote.getFiatAmount(),
          providerId: normalizedQuote.getProviderId(),
          fiatAccount,
          tokenId: normalizedQuote.getTokenId(),
        })
      )
    }
  }, [shouldRefetchQuote])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton testID="backButton" onPress={onPressBack} />,
    })
  }, [navigation])

  useEffect(() => {
    function hardwareBackPress() {
      goBack()
      return true
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', hardwareBackPress)
    return function cleanup() {
      backHandler.remove()
    }
  }, [])

  const goBack = () => {
    // Navigate Back unless the previous screen was FiatDetailsScreen
    const routes = navigation.getState().routes
    const previousScreen = routes[routes.length - 2]
    if (previousScreen?.name === Screens.FiatDetailsScreen) {
      navigate(Screens.SelectProvider, {
        flow: normalizedQuote.flow,
        tokenId: normalizedQuote.getTokenId(),
        amount: {
          fiat: parseFloat(normalizedQuote.getFiatAmount()),
          crypto: parseFloat(normalizedQuote.getCryptoAmount()),
        },
      })
    } else if (previousScreen?.name === Screens.FiatConnectRefetchQuote) {
      navigateHome()
    } else {
      navigateBack()
    }
  }

  const onPressBack = async () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_review_back, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })
    goBack()
  }

  const onPressSupport = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_review_error_contact_support, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })
    navigate(Screens.SupportContact)
  }

  const onPressTryAgain = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_review_error_retry, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })

    dispatch(
      refetchQuote({
        flow,
        cryptoType: normalizedQuote.getCryptoType(),
        cryptoAmount: normalizedQuote.getCryptoAmount(),
        fiatAmount: normalizedQuote.getFiatAmount(),
        providerId: normalizedQuote.getProviderId(),
        fiatAccount,
        tokenId: normalizedQuote.getTokenId(),
      })
    )
  }

  const getFeeDisclaimer = () => {
    switch (fiatAccount.fiatAccountType) {
      case FiatAccountType.BankAccount:
        return t('fiatConnectReviewScreen.bankFeeDisclaimer')
      case FiatAccountType.MobileMoney:
        return t('fiatConnectReviewScreen.mobileMoneyFeeDisclaimer')
      default:
        return ''
    }
  }

  if (fiatConnectQuotesError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('fiatConnectReviewScreen.failedRefetch.title')}</Text>
        <Text style={styles.description}>
          {t('fiatConnectReviewScreen.failedRefetch.description')}
        </Text>
        <Button
          style={styles.button}
          testID="TryAgain"
          onPress={onPressTryAgain}
          text={t('fiatConnectReviewScreen.failedRefetch.tryAgain')}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
        />
        <Button
          style={styles.button}
          testID="SupportContactLink"
          onPress={onPressSupport}
          text={t('contactSupport')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
        />
      </View>
    )
  }

  if (fiatConnectQuotesLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.content}>
      <Dialog
        testID="expiredQuoteDialog"
        isVisible={showingExpiredQuoteDialog}
        title={t('fiatConnectReviewScreen.quoteExpiredDialog.title')}
        actionText={t('fiatConnectReviewScreen.quoteExpiredDialog.continue')}
        actionPress={() => {
          dispatch(
            refetchQuote({
              flow,
              cryptoType: normalizedQuote.getCryptoType(),
              cryptoAmount: normalizedQuote.getCryptoAmount(),
              fiatAmount: normalizedQuote.getFiatAmount(),
              providerId: normalizedQuote.getProviderId(),
              fiatAccount,
              tokenId: normalizedQuote.getTokenId(),
            })
          )
          setShowingExpiredQuoteDialog(false)
        }}
      >
        {t('fiatConnectReviewScreen.quoteExpiredDialog.body')}
      </Dialog>
      <View>
        <ReceiveAmount
          flow={flow}
          normalizedQuote={normalizedQuote}
          networkFee={networkFee.maxFeeAmount}
        />
        <TransactionDetails
          flow={flow}
          normalizedQuote={normalizedQuote}
          networkFee={networkFee.maxFeeAmount}
          isLoading={prepareTransactionsResult.loading}
          hasError={!!prepareTransactionsResult.error}
        />
        <PaymentMethod flow={flow} normalizedQuote={normalizedQuote} fiatAccount={fiatAccount} />
      </View>
      <View>
        {showFeeDisclaimer && <Text style={styles.disclaimer}>{getFeeDisclaimer()}</Text>}
        <Button
          testID="submitButton"
          style={styles.submitBtn}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          disabled={
            flow === CICOFlow.CashOut &&
            (!prepareTransactionsResult.result ||
              prepareTransactionsResult.result.type !== 'possible')
          } // Cash out requires sending a prepared transaction
          text={
            flow === CICOFlow.CashIn
              ? t('fiatConnectReviewScreen.cashIn.button')
              : t('fiatConnectReviewScreen.cashOut.button')
          }
          onPress={() => {
            if (normalizedQuote.getGuaranteedUntil() < new Date()) {
              setShowingExpiredQuoteDialog(true)
            } else {
              AppAnalytics.track(FiatExchangeEvents.cico_fc_review_submit, {
                flow,
                provider: normalizedQuote.getProviderId(),
              })

              dispatch(
                createFiatConnectTransfer({
                  flow,
                  fiatConnectQuote: normalizedQuote,
                  fiatAccountId: fiatAccount.fiatAccountId,
                  serializablePreparedTransaction:
                    prepareTransactionsResult.result?.type === 'possible'
                      ? getSerializablePreparedTransaction(
                          prepareTransactionsResult.result.transactions[0] // there should be only one transaction
                        )
                      : undefined,
                  networkId: token?.networkId,
                })
              )

              navigate(Screens.FiatConnectTransferStatus, {
                flow,
                normalizedQuote,
                fiatAccount,
              })
            }
          }}
        />
      </View>
    </SafeAreaView>
  )
}

function ReceiveAmount({
  flow,
  normalizedQuote,
  networkFee,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  networkFee?: BigNumber
}) {
  const { t } = useTranslation()
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const tokenInfo = useTokenInfo(normalizedQuote.getTokenId())!
  const { receiveDisplay } = getDisplayAmounts({
    flow,
    normalizedQuote,
    usdToLocalRate,
    networkFee,
    tokenInfo,
  })
  return (
    <View style={styles.receiveAmountContainer}>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={t('fiatConnectReviewScreen.receiveAmount')}
        amount={receiveDisplay('receive-amount')}
      />
    </View>
  )
}

function getDisplayAmounts({
  flow,
  normalizedQuote,
  usdToLocalRate,
  networkFee = new BigNumber(0),
  tokenInfo,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  usdToLocalRate: string | null
  networkFee?: BigNumber
  tokenInfo: TokenBalance | undefined
}) {
  const fiatType = normalizedQuote.getFiatType()
  const tokenId = normalizedQuote.getTokenId()
  if (flow === CICOFlow.CashOut) {
    const providerFee =
      (!!tokenInfo && normalizedQuote.getFeeInCrypto(usdToLocalRate, tokenInfo)) || new BigNumber(0)
    const receive = Number(normalizedQuote.getFiatAmount())
    const total = Number(
      new BigNumber(normalizedQuote.getCryptoAmount()).plus(networkFee).toString()
    )
    const totalFee = Number(providerFee.plus(networkFee))
    const totalMinusFees = total - totalFee
    const exchangeRate = receive / totalMinusFees

    const receiveDisplay = (testID: string) => (
      <FiatAmount amount={receive} currency={fiatType} testID={testID} />
    )
    const totalDisplay = <CryptoAmount amount={total} tokenId={tokenId} testID="txDetails-total" />

    const feeDisplay = totalFee && (
      <CryptoAmount amount={totalFee} tokenId={tokenId} testID="txDetails-fee" />
    )

    const totalMinusFeeDisplay = (
      <CryptoAmount amount={totalMinusFees} tokenId={tokenId} testID="txDetails-converted" />
    )
    const exchangeRateDisplay = (
      <FiatAmount
        amount={exchangeRate}
        currency={fiatType}
        testID="txDetails-exchangeRate"
        formatType={FormatType.ExchangeRate}
      />
    )
    return {
      receiveDisplay,
      totalDisplay,
      feeDisplay,
      totalMinusFeeDisplay,
      exchangeRateDisplay,
    }
  } else {
    const receive = normalizedQuote.getCryptoAmount()
    const total = normalizedQuote.getFiatAmount()
    const fee =
      (!!tokenInfo && normalizedQuote.getFeeInFiat(usdToLocalRate, tokenInfo)) || new BigNumber(0)
    const totalMinusFee = Number(total) - Number(fee || 0)
    const exchangeRate = totalMinusFee / Number(receive)

    const receiveDisplay = (testID: string) => (
      <CryptoAmount amount={receive} tokenId={normalizedQuote.getTokenId()} testID={testID} />
    )
    const totalDisplay = <FiatAmount amount={total} currency={fiatType} testID="txDetails-total" />

    const feeDisplay = fee && <FiatAmount amount={fee} currency={fiatType} testID="txDetails-fee" />

    const totalMinusFeeDisplay = (
      <FiatAmount amount={totalMinusFee} currency={fiatType} testID="txDetails-converted" />
    )
    const exchangeRateDisplay = (
      <FiatAmount
        amount={exchangeRate}
        currency={fiatType}
        testID="txDetails-exchangeRate"
        formatType={FormatType.ExchangeRate}
      />
    )
    return {
      receiveDisplay,
      totalDisplay,
      feeDisplay,
      totalMinusFeeDisplay,
      exchangeRateDisplay,
    }
  }
}

function TransactionDetails({
  flow,
  normalizedQuote,
  networkFee,
  isLoading,
  hasError,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  networkFee?: BigNumber
  isLoading: boolean
  hasError: boolean
}) {
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const tokenInfo = useTokenInfo(normalizedQuote.getTokenId())

  const { receiveDisplay, totalDisplay, feeDisplay, exchangeRateDisplay, totalMinusFeeDisplay } =
    getDisplayAmounts({
      flow,
      normalizedQuote,
      usdToLocalRate,
      networkFee,
      tokenInfo,
    })
  const { t } = useTranslation()
  let tokenDisplay: string
  switch (tokenInfo?.name) {
    case 'cUSD':
      tokenDisplay = t('celoDollar')
      break
    case 'cEUR':
      tokenDisplay = t('celoEuro')
      break
    case 'cREAL':
      tokenDisplay = t('celoReal')
      break
    case 'Celo':
      tokenDisplay = 'CELO'
      break
    case 'USDT':
      tokenDisplay = 'USDT'
      break
    case 'cCOP':
      tokenDisplay = 'cCOP'
      break
    default:
      tokenDisplay = t('total')
  }
  // Network fee is only relevant for Cash Out
  const feeHasError = flow === CICOFlow.CashOut && hasError
  const feeIsLoading = flow === CICOFlow.CashOut && isLoading
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>
        {t('fiatConnectReviewScreen.transactionDetails')}
      </Text>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={
          flow === CICOFlow.CashOut
            ? t('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')
            : t('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')
        }
        amount={totalDisplay}
      />
      <LineItemRow
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
        title={
          flow === CICOFlow.CashOut
            ? t('fiatConnectReviewScreen.cashOut.transactionDetailsAmountConverted')
            : t('fiatConnectReviewScreen.cashIn.transactionDetailsAmountConverted')
        }
        amount={totalMinusFeeDisplay}
      />
      {!!feeDisplay && (
        // TODO(any): consider using FeeDrawer if we want to show fee breakdown
        <LineItemRow
          title={t('feeEstimate')}
          testID="feeEstimateRow"
          amount={!feeHasError && !feeIsLoading && feeDisplay}
          style={styles.sectionSubTextContainer}
          textStyle={styles.sectionSubText}
          isLoading={feeIsLoading}
          hasError={feeHasError}
        />
      )}
      <LineItemRow
        title={
          <>
            {`${tokenDisplay} @ `}
            {exchangeRateDisplay}
          </>
        }
        amount={receiveDisplay('txDetails-receive')}
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
      />
    </View>
  )
}

function PaymentMethod({
  flow,
  normalizedQuote,
  fiatAccount,
}: {
  flow: CICOFlow
  normalizedQuote: FiatConnectQuote
  fiatAccount: ObfuscatedFiatAccountData
}) {
  const { t } = useTranslation()

  const onPress = () => {
    navigate(Screens.SelectProvider, {
      flow: normalizedQuote.flow,
      tokenId: normalizedQuote.getTokenId(),
      amount: {
        fiat: parseFloat(normalizedQuote.getFiatAmount()),
        crypto: parseFloat(normalizedQuote.getCryptoAmount()),
      },
    })
  }

  return (
    <Touchable onPress={onPress}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeaderText}>
          {flow === CICOFlow.CashIn
            ? t('fiatConnectReviewScreen.cashIn.paymentMethodHeader')
            : t('fiatConnectReviewScreen.cashOut.paymentMethodHeader')}
        </Text>
        <View style={styles.sectionMainTextContainer}>
          <Text style={styles.sectionMainText} testID="paymentMethod-text">
            {fiatAccount.accountName}
          </Text>
        </View>
        <View style={styles.sectionSubTextContainer}>
          <Text style={styles.sectionSubText} testID="paymentMethod-via">
            {t('fiatConnectReviewScreen.paymentMethodVia', {
              providerName: normalizedQuote.getProviderName(),
            })}
          </Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  receiveAmountContainer: {
    marginHorizontal: variables.contentPadding,
    paddingVertical: 24,
  },
  sectionContainer: {
    marginHorizontal: variables.contentPadding,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingVertical: 24,
  },
  sectionHeaderText: {
    ...typeScale.labelSemiBoldSmall,
    color: colors.gray3,
    marginBottom: 8,
  },
  sectionMainTextContainer: {
    marginVertical: 0,
  },
  sectionMainText: {
    ...typeScale.labelMedium,
  },
  sectionSubTextContainer: {
    marginVertical: 2,
  },
  sectionSubText: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  submitBtn: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
    marginBottom: 24,
  },
  cancelBtn: {
    color: colors.gray3,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typeScale.titleSmall,
  },
  description: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 48,
    paddingBottom: 24,
  },
  button: {
    marginTop: 13,
  },
  disclaimer: {
    ...typeScale.bodySmall,
    paddingHorizontal: variables.contentPadding,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.gray4,
  },
})

FiatConnectReviewScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReview>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatConnectReviewScreen.cashIn.header`)
      : i18n.t(`fiatConnectReviewScreen.cashOut.header`),
  headerRight: () => (
    <CancelButton
      onCancel={() => {
        AppAnalytics.track(FiatExchangeEvents.cico_fc_review_cancel, {
          flow: route.params.flow,
          provider: route.params.normalizedQuote.getProviderId(),
        })
        navigateHome()
      }}
      style={styles.cancelBtn}
    />
  ),
})
