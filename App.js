import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  Button,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  const cameraRef = useRef();
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [photo, setPhoto] = useState();
  const [libraryPermission, setLibraryPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const requestCameraPermission =
        await Camera.requestCameraPermissionsAsync();
      const requestLibraryPermission =
        await MediaLibrary.requestPermissionsAsync();
      setCameraPermission(requestCameraPermission.status === "granted");
      setLibraryPermission(requestLibraryPermission.status === "granted");
    })();
  }, []);

  if (cameraPermission === undefined) {
    return <Text>Requesting Permission</Text>;
  } else if (!cameraPermission) {
    return <Text>Please Grant Permission on settings.</Text>;
  }

  const launchCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setCameraOn(true);
    } else {
      Alert.alert("Access Denied");
    }
  };

  const capture = async () => {
    const options = {
      quality: 1,
      base64: true,
      exif: false,
    };
    const newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto);
  };

  const savePhoto = () => {
    MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {
      setPhoto(undefined);
    });
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image
          style={styles.img}
          source={{ uri: "data:image/jpg;base64," + photo.base64 }}
        ></Image>
        <View style={styles.photoButtonView}>
          {libraryPermission ? (
            <Button
              title="Save and Continue"
              onPress={() => {
                savePhoto();
              }}
            />
          ) : undefined}
          <Button title="Don't save and continue" onPress={() => {}} />
          <Button
            title="Discard"
            onPress={() => {
              setPhoto(undefined);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cameraOn ? (
        <View style={styles.cameraView}>
          <Camera style={styles.camera} ref={cameraRef}></Camera>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => capture()}
          >
            <Text style={styles.cameraViewText}>Capture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCameraOn(false)}
          >
            <Text style={styles.cameraViewText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.appName}>
            <Text style={styles.appNameText}>BusinessCardApp</Text>
          </View>
          <View style={styles.view1}>
            <TouchableOpacity style={styles.t1} onPress={() => launchCamera()}>
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
      )}
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
    marginTop: 5,
  },
  cameraView: {
    alignItems: "center",
  },
  camera: {
    flex: 3 / 5,
    width: SCREEN_HEIGHT,
  },
  captureButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: "10%",
    borderRadius: 4,
    backgroundColor: "teal",
    width: (2 * SCREEN_WIDTH) / 3,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: "10%",
    borderRadius: 4,
    backgroundColor: "tomato",
    width: (2 * SCREEN_WIDTH) / 3,
  },
  cameraViewText: {
    fontSize: 50,
  },
  img: {
    width: 400,
    height: 300,
    resizeMode: "center",
  },
  photoButtonView: {
    height: 150,
    justifyContent: "space-between",
    marginTop: 50,
  },
});
