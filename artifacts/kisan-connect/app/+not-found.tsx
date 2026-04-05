import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View, Pressable } from "react-native";

export default function NotFoundScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
      <Pressable onPress={() => navigation.getParent()?.goBack()} style={styles.link}>
        <Text style={styles.linkText}>Go to home screen!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
