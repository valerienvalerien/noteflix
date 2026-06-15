import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { LibraryProvider, useLibrary } from "./src/library/LibraryContext";
import AuthScreen from "./src/auth/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import PathsScreen from "./src/screens/PathsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PlayerModal from "./src/components/PlayerModal";
import AddModal from "./src/components/AddModal";
import ShareCapture from "./src/share/ShareCapture";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.red,
  },
};

function tabIcon(emoji: string) {
  return () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function GlobalModals() {
  const {
    playing,
    closePlayer,
    removeItem,
    toggleFavorite,
    showAdd,
    addUrl,
    closeAdd,
    editing,
    openEdit,
    closeEdit,
    replaceItem,
    categories,
    refresh,
  } = useLibrary();
  return (
    <>
      {playing ? (
        <PlayerModal
          item={playing}
          onClose={closePlayer}
          onDelete={removeItem}
          onToggleFavorite={toggleFavorite}
          onEdit={openEdit}
        />
      ) : null}
      {showAdd ? (
        <AddModal
          categories={categories}
          initialUrl={addUrl}
          onClose={closeAdd}
          onCreated={() => {
            closeAdd();
            refresh();
          }}
        />
      ) : null}
      {editing ? (
        <AddModal
          categories={categories}
          item={editing}
          onClose={closeEdit}
          onCreated={(saved) => {
            replaceItem(saved);
            closeEdit();
          }}
        />
      ) : null}
    </>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} options={{ tabBarIcon: tabIcon("🏠") }} />
      <Tab.Screen name="Recherche" component={SearchScreen} options={{ tabBarIcon: tabIcon("🔍") }} />
      <Tab.Screen name="Parcours" component={PathsScreen} options={{ tabBarIcon: tabIcon("🧭") }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ tabBarIcon: tabIcon("👤") }} />
    </Tab.Navigator>
  );
}

function Gate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <LibraryProvider>
      <NavigationContainer theme={navTheme}>
        <MainTabs />
      </NavigationContainer>
      <GlobalModals />
      <ShareCapture />
    </LibraryProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
