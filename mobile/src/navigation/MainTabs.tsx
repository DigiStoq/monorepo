import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  HomeIcon,
  BoxIcon,
  MenuIcon,
  UsersIcon,
  ReceiptIcon, // Using ReceiptIcon instead of ShoppingCartIcon
} from "../components/ui/UntitledIcons";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ItemsScreen } from "../screens/ItemsScreen";
import { SalesNavigator } from "../navigation/SalesNavigator";
import { CustomersScreen } from "../screens/CustomersScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "../contexts/ThemeContext";

const Tab = createBottomTabNavigator();

// Helper to create accessible tab button that preserves navigation behavior
const TabButton = (props: any) => {
  const { testID, accessibilityLabel, onPress, onLongPress, children, style } = props;
  return (
    <Pressable
      onPress={(e) => {
        console.log(`Tab pressed: ${testID}`);
        onPress?.(e);
      }}
      onLongPress={onLongPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
};

export function MainTabs() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: Platform.OS === 'ios' ? 30 : 12,
            paddingTop: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
          tabBarItemStyle: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
        id="MainTabs"
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            tabBarButton: (props) => <TabButton {...props} testID="dashboard-tab" accessibilityLabel="Dashboard" />,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <HomeIcon color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="SalesTab"
          component={SalesNavigator}
          options={{
            tabBarLabel: "Sales",
            tabBarButton: (props) => <TabButton {...props} testID="sales-tab" accessibilityLabel="Sales" />,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <ReceiptIcon color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="CustomersTab"
          component={CustomersScreen}
          options={{
            tabBarLabel: "Customers",
            tabBarButton: (props) => <TabButton {...props} testID="customers-tab" accessibilityLabel="Customers" />,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <UsersIcon color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="ItemsTab"
          component={ItemsScreen}
          options={{
            tabBarLabel: "Items",
            tabBarButton: (props) => <TabButton {...props} testID="items-tab" accessibilityLabel="Items" />,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <BoxIcon color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="MenuTab"
          component={SettingsScreen}
          options={{
            tabBarLabel: "Menu",
            tabBarButton: (props) => <TabButton {...props} testID="menu-tab" accessibilityLabel="Menu" />,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <MenuIcon color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  activeBackground: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 16,
  },
});
