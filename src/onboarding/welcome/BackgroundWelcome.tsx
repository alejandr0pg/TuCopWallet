import React from 'react'
import { StyleSheet } from 'react-native'
import Svg, {
  ClipPath,
  Defs,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'

const BackgroundWelcome = ({ style, width = 391.5, height = 852 }: any) => {
  // Calculate center point
  const centerX = width / 2

  return (
    <Svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={[styles.fullScreen, style]}
      preserveAspectRatio="xMidYMid slice"
    >
      <G clip-path="url(#clip0_2051_242)">
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#paint0_radial_2051_242)" />
        <G clip-path="url(#clip1_2051_242)" transform={`translate(${centerX - 200})`}>
          <Path
            d="M399.967 329.439L399.967 242.976L228.811 242.976C105.727 242.976 0.807278 328.179 -0.741374 486.312L-0.741378 572.774L170.737 572.774C293.821 572.774 398.709 487.571 399.967 329.439ZM79.3358 486.312C79.3358 421.876 110.438 329.439 236.038 329.439L319.89 329.439C319.89 394.197 289.111 486.312 163.188 486.312L79.3358 486.312Z"
            fill="url(#paint1_linear_2051_242)"
            stroke="white"
            strokeOpacity="0.11"
            strokeMiterlimit="10"
          />
          <Path
            d="M78.8519 242.976L78.8519 58.8755C78.8519 -13.5373 113.728 -43.058 199.226 -43.058C284.723 -43.058 320.18 -13.5373 320.18 58.8755L320.18 212.777L401.387 212.777L401.387 58.8756C401.387 -61.0158 331.473 -124.385 199.194 -124.385C66.9145 -124.385 -2.41903 -61.0158 -2.41904 58.8755L-2.41905 347.623C19.6812 269.88 78.8196 242.976 78.8196 242.976L78.8519 242.976Z"
            stroke="white"
            strokeOpacity="0.11"
            strokeMiterlimit="10"
          />
          <Path
            d="M398.386 832.517L398.386 463.832C376.286 541.574 322.116 572.742 322.116 572.742L322.116 832.517C322.116 899.02 220.616 899.02 220.616 832.517L220.616 729.679C220.616 726.966 220.519 724.286 220.326 721.637C220.294 720.862 220.229 720.119 220.165 719.376C220.003 717.341 219.777 715.274 219.519 713.272C219.423 712.626 219.358 711.948 219.261 711.302C218.874 708.718 218.455 706.166 217.938 703.647C217.842 703.162 217.713 702.71 217.616 702.258C217.164 700.159 216.648 698.092 216.067 696.025C215.874 695.282 215.68 694.571 215.454 693.861C214.841 691.793 214.196 689.759 213.486 687.756C213.325 687.336 213.196 686.916 213.067 686.497C212.196 684.106 211.26 681.749 210.26 679.423C210.002 678.842 209.744 678.26 209.485 677.679C208.679 675.87 207.84 674.094 206.937 672.318C206.614 671.704 206.324 671.058 205.969 670.444C204.775 668.216 203.581 665.987 202.259 663.855C202.259 663.855 202.259 663.823 202.226 663.791C200.936 661.659 199.548 659.56 198.129 657.525C197.742 656.944 197.322 656.395 196.935 655.845C195.774 654.231 194.58 652.648 193.354 651.065C192.999 650.613 192.644 650.129 192.257 649.676C190.676 647.739 189.031 645.833 187.353 643.992C187.063 643.669 186.74 643.378 186.45 643.055C184.998 641.505 183.546 640.019 182.03 638.566C181.546 638.081 181.029 637.597 180.513 637.145C178.932 635.659 177.319 634.206 175.641 632.817C175.383 632.591 175.093 632.332 174.835 632.106C172.899 630.491 170.899 628.941 168.866 627.455C168.382 627.1 167.898 626.777 167.414 626.422C165.801 625.259 164.123 624.128 162.446 623.063C161.897 622.707 161.349 622.352 160.8 621.997C141.378 609.917 118.471 602.908 93.8543 602.908L-0.902673 602.908L-0.902676 679.262L93.8543 679.262C121.536 679.262 144.282 701.418 144.282 729.744L144.282 847.374C151.67 910.808 206.42 959.45 271.624 959.45C341.764 959.45 398.354 902.798 398.354 832.582L398.386 832.517Z"
            stroke="white"
            strokeOpacity="0.11"
            strokeMiterlimit="10"
          />
        </G>
      </G>
      <Defs>
        <Filter id="blur" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
          <FeGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur" />
        </Filter>
        <RadialGradient
          id="paint0_radial_2051_242"
          cx="100%"
          cy="0%"
          rx="68.31%"
          ry="68.31%"
          fx="100%"
          fy="0%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#2F4ACD" />
          <Stop offset="100%" stopColor="#0D0D0D" />
        </RadialGradient>
        <LinearGradient
          id="paint1_linear_2051_242"
          x1="-30.5"
          y1="-83.5"
          x2="352.5"
          y2="525"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#2F4ACD" stopOpacity="1" />
          <Stop offset="1" stopColor="#999999" stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="clip0_2051_242">
          <Rect width="100%" height="100%" fill="white" />
        </ClipPath>
        <ClipPath id="clip1_2051_242">
          <Rect
            width="100%"
            height="100%"
            fill="white"
            transform="translate(403 -126) rotate(90)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
})

export default BackgroundWelcome
