import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  return (
    <View style={styles.container}>
      <View>
        <View style={styles.appName}>
          <Text style={styles.appNameText}>BusinessCardApp</Text>
        </View>
        <View style={styles.view1}>
          <TouchableOpacity style={styles.t1}>
            <Text style={styles.text1}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.t1}>
            <Text style={styles.text1}>Choose From Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.t1}>
            <Text style={styles.text1}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.t1}>
            <Text style={styles.text1}>List</Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="auto" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    alignItems: "center",
    marginTop: "30%",
  },
  appNameText: {
    color: "black",
    fontSize: 50,
  },
  view1: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  t1: {
    width: (2 * SCREEN_WIDTH) / 3,
    height: 40,
    borderRadius: 4,
    backgroundColor: "tomato",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "cetner",
    marginBottom: "10%",
    marginTop: 10,
  },
  text1: {
    color: "black",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5
  },
});
