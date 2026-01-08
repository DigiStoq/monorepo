import {
  widthPercentageToDP as wp2dp,
  heightPercentageToDP as hp2dp,
} from "react-native-responsive-screen";

export const wp = (percentage: number | string) => wp2dp(percentage);
export const hp = (percentage: number | string) => hp2dp(percentage);
