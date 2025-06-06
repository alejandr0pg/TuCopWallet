import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { default as React, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, LayoutChangeEvent, RefreshControl, StyleSheet, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { FilterChip, NetworkFilterChip, isNetworkChip } from 'src/components/FilterChipsCarousel'
import NetworkMultiSelectBottomSheet from 'src/components/multiSelect/NetworkMultiSelectBottomSheet'
import { TIME_UNTIL_TOKEN_INFO_BECOMES_STALE } from 'src/config'
import EarnTabBar from 'src/earn/EarnTabBar'
import MarranitosContract, { Stake } from 'src/earn/marranitos/MarranitosContract'
import PoolList from 'src/earn/PoolList'
import { EarnTabType } from 'src/earn/types'
import { refreshAllBalances } from 'src/home/actions'
import AttentionIcon from 'src/icons/Attention'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { refreshPositions } from 'src/positions/actions'
import {
  earnPositionsSelector,
  positionsFetchedAtSelector,
  positionsStatusSelector,
} from 'src/positions/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address } from 'viem'

const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

export const MARRANITOS_POSITION_TYPE = 'marranitos'
export const MY_MARRANITOS_POSITION_TYPE = 'misMarranitos'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnHome>

// TODO: Se comentan los pools de marranitos para que no se muestren en la pantalla de Earn
const marranitos_pools = [
  // {
  //   positionId: 'position_marranito_id1',
  //   positionType: MARRANITOS_POSITION_TYPE,
  //   network: 'CELO',
  //   apy: '1.25',
  //   days: '30',
  //   duration: STAKING_DURATIONS.DAYS_30,
  //   isActive: true,
  // },
  // {
  //   positionId: 'position_marranito_id2',
  //   positionType: MARRANITOS_POSITION_TYPE,
  //   network: 'CELO',
  //   apy: '1.50',
  //   days: '60',
  //   duration: STAKING_DURATIONS.DAYS_60,
  //   isActive: true,
  // },
  // {
  //   positionId: 'position_marranito_id3',
  //   positionType: MARRANITOS_POSITION_TYPE,
  //   network: 'CELO',
  //   apy: '2.00',
  //   days: '90',
  //   duration: STAKING_DURATIONS.DAYS_90,
  //   isActive: true,
  // },
] as any[]

function useFilterChips(): FilterChip<TokenBalance>[] {
  const { t } = useTranslation()

  const pools = useSelector(earnPositionsSelector)
  const supportedNetworkIds = [...new Set(pools.map((pool) => pool.networkId))]
  const networkChipConfig: NetworkFilterChip<TokenBalance> = {
    id: 'network-ids',
    name: t('tokenBottomSheet.filters.selectNetwork'),
    filterFn: (token: TokenBalance, selected?: NetworkId[]) => {
      return !!selected && selected.includes(token.networkId)
    },
    isSelected: false,
    allNetworkIds: supportedNetworkIds,
    selectedNetworkIds: supportedNetworkIds,
  }
  return [networkChipConfig]
}

export default function EarnHome({ navigation, route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const pools = useSelector(earnPositionsSelector)

  const activeTab = route.params?.activeEarnTab ?? EarnTabType.AllPools

  const insets = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(insets.bottom, Spacing.Regular16),
  }

  const supportedNetworkIds = [NetworkId['celo-mainnet']]
  const allTokens = useSelector((state) => tokensByIdSelector(state, supportedNetworkIds))

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)
  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)

  const animatedListHeaderStyles = useAnimatedStyle(() => {
    if (nonStickyHeaderHeight === 0) {
      return {
        shadowColor: 'transparent',
        transform: [
          {
            translateY: -scrollPosition.value,
          },
        ],
      }
    }

    return {
      transform: [
        {
          translateY:
            scrollPosition.value > nonStickyHeaderHeight
              ? -nonStickyHeaderHeight
              : -scrollPosition.value,
        },
      ],
      shadowColor: interpolateColor(
        scrollPosition.value,
        [nonStickyHeaderHeight - 10, nonStickyHeaderHeight + 10],
        ['transparent', Colors.gray1]
      ),
    }
  }, [scrollPosition.value, nonStickyHeaderHeight])

  const networkChipRef = useRef<BottomSheetModalRefType>(null)
  const learnMoreBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  // The NetworkMultiSelectBottomSheet and TokenBottomSheet must be rendered at this level in order to be in
  // front of the bottom tabs navigator when they render. So, we need to manage the state of the filters here and pass them down
  // This is not ideal, and we should be wary of how this affects the performance of the home tabs since it renders
  // on all of them, not just the Earn tab.
  const chips = useFilterChips()
  const [filters, setFilters] = useState(chips)
  const [stakes, setStakes] = useState<Stake[]>([])
  const activeFilters = useMemo(() => filters.filter((filter) => filter.isSelected), [filters])
  const networkChip = useMemo(
    () => filters.find((chip): chip is NetworkFilterChip<TokenBalance> => isNetworkChip(chip)),
    [filters]
  )
  const tokens = [...new Set(pools.flatMap((pool: any) => pool.tokens))]

  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [allTokens])

  const tokenList = useMemo(() => {
    return tokensInfo.filter((token) => {
      // Exclude the token if it does not match the active filters
      if (
        !activeFilters.every((filter) => {
          if (isNetworkChip(filter)) {
            return filter.filterFn(token, filter.selectedNetworkIds)
          }
          return filter.filterFn(token)
        })
      ) {
        return false
      }

      return true
    })
  }, [tokensInfo, activeFilters])

  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    dispatch(refreshAllBalances())
    setRefreshing(false)
  }, [])

  // These function params mimic the params of the setSelectedNetworkIds function in
  // const [selectedNetworkIds, setSelectedNetworkIds] = useState<NetworkId[]>([])
  // This custom function is used to keep the same shared state between the network filter and the other filters
  // which made the rest of the code more readable and maintainable
  const setSelectedNetworkIds = (arg: NetworkId[] | ((networkIds: NetworkId[]) => NetworkId[])) => {
    setFilters((prev) => {
      return prev.map((chip) => {
        if (isNetworkChip(chip)) {
          const selectedNetworkIds = typeof arg === 'function' ? arg(chip.selectedNetworkIds) : arg
          return {
            ...chip,
            selectedNetworkIds,
            isSelected: selectedNetworkIds.length !== chip.allNetworkIds.length,
          }
        }
        return {
          ...chip,
          isSelected: false,
        }
      })
    })
  }

  const handleMeasureListHeadereHeight = (event: LayoutChangeEvent) => {
    setListHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  useScrollAwareHeader({
    navigation,
    title: t('earnFlow.home.title'),
    scrollPosition,
    startFadeInPosition: nonStickyHeaderHeight - HEADER_OPACITY_ANIMATION_START_OFFSET,
    animationDistance: HEADER_OPACITY_ANIMATION_DISTANCE,
  })

  const handleChangeActiveView = (selectedTab: EarnTabType) => {
    navigation.setParams({ activeEarnTab: selectedTab })
  }

  const displayPools = useMemo(() => {
    return activeTab === EarnTabType.AllPools
      ? pools
      : pools.filter(
          (pool) => new BigNumber(pool.balance).gt(0) && !!allTokens[pool.dataProps.depositTokenId]
        )
  }, [pools, allTokens, activeTab])

  const onPressLearnMore = () => {
    AppAnalytics.track(EarnEvents.earn_home_learn_more_press)
    learnMoreBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressTryAgain = () => {
    AppAnalytics.track(EarnEvents.earn_home_error_try_again)
    dispatch(refreshPositions())
  }

  const positionsStatus = useSelector(positionsStatusSelector)
  const positionsFetchedAt = useSelector(positionsFetchedAtSelector)
  const errorLoadingPools =
    positionsStatus === 'error' &&
    (pools.length === 0 ||
      Date.now() - (positionsFetchedAt ?? 0) > TIME_UNTIL_TOKEN_INFO_BECOMES_STALE)

  const walletAddress = useSelector(walletAddressSelector)

  useEffect(() => {
    if (walletAddress) {
      // Corregir el error de promesa no manejada
      void loadStakes()
    }
  }, [walletAddress])

  const allPools = useMemo(() => {
    const marranitos =
      activeTab === EarnTabType.AllPools ? marranitos_pools.filter((pool) => pool.isActive) : stakes
    return [
      ...marranitos,
      ...displayPools.filter((pool: any) =>
        pool.tokens.some((token: any) =>
          tokenList.map((token) => token.tokenId).includes(token.tokenId)
        )
      ),
    ]
  }, [displayPools, tokenList, marranitos_pools, activeTab])

  const zeroPoolsinMyPoolsTab =
    !errorLoadingPools && allPools.length === 0 && activeTab === EarnTabType.MyPools

  const loadStakes = async () => {
    if (!walletAddress) return

    try {
      const userStakes = await MarranitosContract.getUserStakes(walletAddress as Address)
      setStakes(
        userStakes
          .map((item, index) => {
            return {
              ...item,
              index,
              positionType: MY_MARRANITOS_POSITION_TYPE,
            }
          })
          .filter((item) => !item.claimed)
      )
    } catch (error) {
      Alert.alert(t('earnFlow.staking.error'), t('earnFlow.staking.errorLoadingStakes'))
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View testID="EarnScreen" style={styles.container}>
        <Animated.View
          style={[styles.listHeaderContainer, animatedListHeaderStyles]}
          onLayout={handleMeasureListHeadereHeight}
        >
          <View
            style={[styles.nonStickyHeaderContainer]}
            onLayout={handleMeasureNonStickyHeaderHeight}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('earnFlow.home.title')}</Text>
            </View>

            <EarnTabBar activeTab={activeTab} onChange={handleChangeActiveView} />
          </View>
        </Animated.View>
        {((allPools.length === 0 && activeTab === EarnTabType.AllPools) ||
          (allPools.length === 0 && errorLoadingPools)) && (
          <View style={styles.textContainer}>
            <AttentionIcon size={48} color={Colors.black} />
            <Text style={styles.errorTitle}>{t('earnFlow.home.errorTitle')}</Text>
            <Text style={styles.description}>{t('earnFlow.home.errorDescription')}</Text>
          </View>
        )}
        {zeroPoolsinMyPoolsTab && (
          <View style={styles.textContainer}>
            <AttentionIcon size={48} color={Colors.primary} />
            <Text style={styles.errorTitle}>{t('earnFlow.home.noPoolsTitle')}</Text>
            <Text style={styles.description}>{t('earnFlow.home.noPoolsDescription')}</Text>
          </View>
        )}
        {!!allPools.length &&
          !errorLoadingPools &&
          !zeroPoolsinMyPoolsTab &&
          (activeTab === EarnTabType.AllPools || activeTab === EarnTabType.MyPools) && (
            <PoolList
              handleScroll={handleScroll}
              listHeaderHeight={listHeaderHeight}
              paddingBottom={insets.bottom}
              displayPools={allPools}
              onPressLearnMore={onPressLearnMore}
              onRefresh={onRefresh}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary}
                />
              }
            />
          )}
        {errorLoadingPools && (
          <View style={[styles.buttonContainer, insetsStyle]}>
            <Button
              onPress={onPressTryAgain}
              text={t('earnFlow.home.errorButton')}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
            />
          </View>
        )}
      </Animated.View>
      <LearnMoreBottomSheet learnMoreBottomSheetRef={learnMoreBottomSheetRef} />
      {networkChip && (
        <NetworkMultiSelectBottomSheet
          allNetworkIds={networkChip.allNetworkIds}
          setSelectedNetworkIds={setSelectedNetworkIds}
          selectedNetworkIds={networkChip.selectedNetworkIds}
          forwardedRef={networkChipRef}
        />
      )}
    </View>
  )
}

function LearnMoreBottomSheet({
  learnMoreBottomSheetRef,
}: {
  learnMoreBottomSheetRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      forwardedRef={learnMoreBottomSheetRef}
      title={t('earnFlow.home.learnMoreBottomSheet.bottomSheetTitle')}
      testId={'Earn/Home/LearnMoreBottomSheet'}
      titleStyle={styles.learnMoreTitle}
    >
      <Text style={styles.learnMoreSubTitle}>
        {t('earnFlow.home.learnMoreBottomSheet.yieldPoolSubtitle')}
      </Text>
      <Text style={styles.learnMoreDescription}>
        {t('earnFlow.home.learnMoreBottomSheet.yieldPoolDescription')}
      </Text>
      <Text style={styles.learnMoreSubTitle}>
        {t('earnFlow.home.learnMoreBottomSheet.chooseSubtitle')}
      </Text>
      <Text style={styles.learnMoreDescription}>
        {t('earnFlow.home.learnMoreBottomSheet.chooseDescription')}
      </Text>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typeScale.titleLarge,
    color: Colors.primary,
  },
  listHeaderContainer: {
    ...getShadowStyle(Shadow.SoftLight),
    paddingBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    backgroundColor: Colors.white,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  nonStickyHeaderContainer: {
    zIndex: 1,
    gap: Spacing.Thick24,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
  },
  // filterChipsCarouselContainer: {
  //   flexDirection: 'row',
  // },
  // contentContainerStyle: {
  //   justifyContent: 'flex-end',
  // },
  learnMoreTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  learnMoreSubTitle: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
    marginBottom: Spacing.Tiny4,
  },
  learnMoreDescription: {
    ...typeScale.bodySmall,
    color: Colors.black,
    marginBottom: Spacing.Thick24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Thick24,
  },
  errorTitle: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    marginTop: Spacing.Regular16,
    color: Colors.primary,
  },
  description: {
    ...typeScale.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.Regular16,
    color: Colors.gray3,
  },
  buttonContainer: {
    marginHorizontal: Spacing.Thick24,
  },
})
