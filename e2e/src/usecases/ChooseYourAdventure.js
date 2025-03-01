import { launchApp } from '../utils/retries'
import {
  quickOnboarding,
  waitForElementByIdAndTap,
  waitForElementByText,
  waitForElementId,
} from '../utils/utils'

export default ChooseYourAdventure = () => {
  beforeEach(async () => {
    await launchApp({
      delete: true,
      launchArgs: {
        onboardingOverrides: 'EnableBiometry,ProtectWallet,PhoneVerification,CloudBackup',
      },
    })
    await quickOnboarding({ stopOnCYA: true, cloudBackupEnabled: true })
  })

  it('learn about points navigates to points journey page', async () => {
    await waitForElementByText({ text: `Learn about Mento Points`, tap: true })

    // Check that we are on the Points journey page
    await waitForElementByText({ text: 'Earn points effortlessly', index: 0 })

    // Back should go to the home screen
    await element(by.id('BackChevron')).tap()
    await waitForElementByIdAndTap('Tab/Wallet')
    await waitForElementId('TabWallet')
  })

  it('build your profile navigates to profile page', async () => {
    await waitForElementByText({ text: 'Build your profile', tap: true })

    // Check that we are on the profile page
    await waitForElementId('ProfileEditName')

    // Back should go to the home screen
    await element(by.id('BackButton')).tap()
    await waitForElementByIdAndTap('Tab/Wallet')
    await waitForElementId('TabWallet')
  })

  it('add funds to your wallet navigates to home and opens the token bottom sheet', async () => {
    await waitForElementByText({ text: 'Add funds to your wallet', tap: true })

    // Check that we are on the bottom sheet
    await waitForElementId('TokenBottomSheet')

    // dismissing the bottom sheet should show home screen
    await element(by.id('TokenBottomSheet')).swipe('down')
    await waitForElementByIdAndTap('Tab/Wallet')
    await waitForElementId('TabWallet')
  })

  it('explore earning opportunities navigates to stablecoins info page', async () => {
    await waitForElementByText({ text: 'Explore earning opportunities', tap: true })

    // Check that we are on the Earn On Your Stablecoins page
    await waitForElementId('EarnInfoScreen/Title')
    await waitForElementByText({ text: 'Earn on your\ncrypto' })
  })
}
