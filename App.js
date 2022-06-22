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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { GOOGLE_CLOUD_VISION_API_KEY } from "./secret";
import detectItems from "./detectItems";
import saveInformation from "./saveInformation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Contacts from "expo-contacts";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";

const API_KEY = GOOGLE_CLOUD_VISION_API_KEY;
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
const STORAGE_KEY = "@NPEC";
const COUNT_KEY = "@COUNT";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  const cameraRef = useRef();
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [photo, setPhoto] = useState();
  const [libraryPermission, setLibraryPermission] = useState(false);
  const [photoFromLibrary, setPhotoFromLibrary] = useState(null);
  const [image, setImage] = useState(null);
  const [detected, setDetected] = useState("");
  const [name, setName] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [email, setEmail] = useState(null);
  const [company, setCompany] = useState("");
  const [information, setInformation] = useState(null);
  const [listView, setListView] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    company: "",
  });
  const [searchView, setSearchView] = useState(false);
  const [searchedArray, setSearchedArray] = useState(information);
  const [searchString, setSearchString] = useState("");
  const [contactPermission, setContactPermission] = useState(false);
  const [googleCount, setGoogleCount] = useState(0);

  useEffect(() => {
    loadInformation();
    loadCount();

    // console.log("1useEffect: ", googleCount);
  }, []);

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

  // contacts
  useEffect(() => {
    (async () => {
      const requestContactPermission = await Contacts.requestPermissionsAsync();
      setContactPermission(requestContactPermission.status === "granted");
    })();
  }, []);

  useEffect(() => {
    setName(null);
    setPhoneNumber(null);
    setEmail(null);
    setCompany("");

    if (image !== null) {
      callGoogleVisionAsync(image);
      setGoogleCount((prev) => prev + 1);
    }
  }, [image]);

  useEffect(() => {
    const data = detectItems(detected);
    setName(data.name);
    setPhoneNumber(data.phoneNumber);
    setEmail(data.email);
  }, [detected]);

  useEffect(() => {
    if (searchString.length === 0) {
      setSearchedArray(information);
    } else {
      const searchedObjects = {};
      Object.keys(information).map((key) => {
        if (
          information[key].name
            .toLowerCase()
            .includes(searchString.toLowerCase()) ||
          information[key].company
            .toLowerCase()
            .includes(searchString.toLowerCase())
        ) {
          searchedObjects[key] = information[key];
        }
      });
      setSearchedArray(searchedObjects);
    }
  }, [searchString]);

  useEffect(() => {
    saveCount()
    if (googleCount > 800) {
      Alert.alert("Google API Usage over 800");
      return;
    }
  }, [googleCount])

  const generateBody = (image) => {
    const body = {
      requests: [
        {
          image: {
            content: image,
          },
          features: [
            {
              type: "TEXT_DETECTION",
              maxResults: 1,
            },
          ],
        },
      ],
    };
    return body;
  };

  const callGoogleVisionAsync = async (image) => {
    const body = generateBody(image);
    const responseFromGoogle = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((result) => {
        try {
          const googleDetected = result.responses[0].fullTextAnnotation;
          setDetected(googleDetected.text);
          detectItems(detected);
        } catch (e) {
          console.log(e);
        }
      });
    return responseFromGoogle
      ? responseFromGoogle
      : { text: "No text detected." };
  };

  const loadInformation = async () => {
    try {
      const previousInformation = await AsyncStorage.getItem(STORAGE_KEY);
      if (previousInformation) {
        setInformation(JSON.parse(previousInformation));
        setSearchedArray(JSON.parse(previousInformation));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const loadCount = async () => {
    try {
      const previousCount = await AsyncStorage.getItem(COUNT_KEY);
      if (previousCount) {
        setGoogleCount(parseInt(previousCount));
      }
    } catch (e) {
      console.log(e);
    }
  };

  const saveCount = async () => {
    try {
      await AsyncStorage.setItem(COUNT_KEY, JSON.stringify(googleCount));
      console.log("GoogleAPIUsageCount: ", googleCount);
    } catch (e) {
      console.log(e);
    }
  };

  const onChangeName = (name) => setName(name);
  const onChangePhoneNumber = (phoneNumber) => setPhoneNumber(phoneNumber);
  const onChangeEmail = (email) => setEmail(email);
  const onChangeCompany = (company) => setCompany(company);
  const onChangeEditInformation = (name, value) => {
    setEditData({
      ...editData,
      [name]: value,
    });
  };
  const onChangeSearchString = (payload) => setSearchString(payload);

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

  const chooseFromLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true,
    });
    if (!result.cancelled) {
      setPhotoFromLibrary(result.uri);
      setImage(result.base64);
    }
  };

  const addInformation = async () => {
    if (
      name === null ||
      name === "" ||
      phoneNumber === null ||
      phoneNumber === ""
    ) {
      Alert.alert("Name and Phone Number must be provided.");
    } else {
      const newInformation = {
        ...information,
        [Date.now()]: {
          name,
          phoneNumber,
          email,
          company,
          edit: false,
        },
      };
      setInformation(newInformation);
      await saveInformation(newInformation, STORAGE_KEY);
      setSearchedArray(newInformation);
      Alert.alert("Saved!");
      // setImage(null);
    }
  };

  const backToFalse = async () => {
    Object.keys(information).map((key) => {
      if (information[key].edit === true) {
        information[key].edit = false;
      }
    });
    await saveInformation(information, STORAGE_KEY);
    setSearchedArray(information);
  };

  const edit = async (key) => {
    const newInformation = { ...information };
    if (newInformation[key].edit === false) {
      newInformation[key].edit = true;
      setEditData({
        name: information[key].name,
        phoneNumber: information[key].phoneNumber,
        email: information[key].email,
        company: information[key].company ? information[key].company : "",
      });
    } else {
      newInformation[key].edit = false;
    }
    setInformation(newInformation);
    await saveInformation(newInformation, STORAGE_KEY);
    setSearchedArray(newInformation);
  };

  const editInformation = async (key) => {
    const newInformation = { ...information };
    newInformation[key].edit = false;
    newInformation[key].name = editData.name;
    newInformation[key].phoneNumber = editData.phoneNumber;
    newInformation[key].email = editData.email;
    newInformation[key].company = editData.company;
    setInformation(newInformation);
    await saveInformation(newInformation, STORAGE_KEY);
    setSearchedArray(newInformation);
    setEditData({
      name: "",
      phoneNumber: "",
      email: "",
      company: "",
    });
  };

  const deleteInformation = async (key) => {
    const newInformation = { ...information };
    Alert.alert("Delete Businss Card", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          delete newInformation[key];
          setInformation(newInformation);
          await saveInformation(newInformation, STORAGE_KEY);
          setSearchedArray(newInformation);
        },
      },
    ]);
    return;
  };

  const saveToContact = async (name, phoneNumber) => {
    const contact = {
      [Contacts.Fields.FirstName]: name.slice(1, name.length),
      [Contacts.Fields.LastName]: name[0],
      [Contacts.Fields.PhoneNumbers]: [{ number: phoneNumber }],
    };
    await Contacts.addContactAsync(contact);
    Alert.alert("Saved to Contact");
  };

  const copyToClipboard = async (str) => {
    await Clipboard.setStringAsync(str);
  };

  if (image) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.chooseFromLibrary}
      >
        <View>
          <Button
            title="Pick an image from library"
            onPress={() => {
              setImage(null);
              setName(null);
              setPhoneNumber(null);
              setEmail(null);
              setCompany("");
              setDetected("");
              chooseFromLibrary();
            }}
          />
          <Button
            title="Cancel"
            onPress={() => {
              setImage(null);
              setPhoto(null);
            }}
          />
          <View style={styles.photoFromLibraryImageView}>
            <Image
              source={{ uri: photoFromLibrary }}
              style={styles.photoFromLibrary}
            />
          </View>
          <ScrollView style={styles.photoFromLibraryView}>
            <Text style={styles.photoFromLibraryDetectText}>{detected}</Text>
          </ScrollView>
          <View style={styles.photoFromLibraryInputView}>
            <Text>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={onChangeName}
            />
            <Text>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phoneNumber}
              onChangeText={onChangePhoneNumber}
            />
            <Text>Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={onChangeEmail}
            />
            <Text>Company</Text>
            <TextInput
              style={styles.textInput}
              value={company}
              onChangeText={onChangeCompany}
              placeholder="(Optional)"
            />
            <View>
              <Button
                title="Save"
                onPress={() => {
                  addInformation();
                  setPhoto(null);
                }}
              />
              {contactPermission && (
                <Button
                  title="Save to Contact"
                  onPress={() => {
                    saveToContact(name, phoneNumber);
                    setPhoto(null);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
                setPhotoFromLibrary(photo.uri);
                setImage(photo.base64);
              }}
            />
          ) : undefined}
          <Button
            title="Don't save and continue"
            onPress={() => {
              setImage(photo.base64);
              setPhotoFromLibrary(photo.uri);
            }}
          />
          <Button title="Discard" onPress={() => setPhoto(undefined)} />
        </View>
      </View>
    );
  }

  if (listView) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.listViewContainer}
      >
        <Button
          title="Back to Main Menu"
          onPress={() => {
            setListView(false);
            backToFalse();
          }}
        />
        <ScrollView style={styles.listViewScrollView}>
          {Object.keys(information)
            .reverse()
            .map((key) => (
              <View key={key} style={styles.searchViewBuisnessCard}>
                {!information[key].edit ? (
                  <View>
                    {information[key].company !== "" && (
                      <Text style={styles.listViewText}>
                        Company: {information[key].company}
                      </Text>
                    )}

                    <View style={{ flexDirection: "row" }}>
                      <Text style={styles.listViewText}>
                        Name: {information[key].name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          copyToClipboard(information[key].name);
                        }}
                      >
                        <Feather name="copy" size={30} color="tomato" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={styles.listViewText}>
                        P.N: {information[key].phoneNumber}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          copyToClipboard(information[key].phoneNumber);
                        }}
                      >
                        <Feather name="copy" size={30} color="tomato" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Linking.openURL(
                            `sms:${information[key].phoneNumber}`
                          );
                        }}
                      >
                        <Feather
                          name="message-square"
                          size={32}
                          color="lightslategrey"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Linking.openURL(
                            `tel:${information[key].phoneNumber}`
                          );
                        }}
                      >
                        <Feather name="phone-outgoing" size={30} color="teal" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row" }}>
                      <Text style={styles.listViewText}>
                        Email: {information[key].email}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          copyToClipboard(information[key].email);
                        }}
                      >
                        <Feather name="copy" size={30} color="tomato" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.listViewText}>Company:</Text>
                    <TextInput
                      style={styles.listViewTextInput}
                      onChangeText={(text) => {
                        onChangeEditInformation("company", text);
                      }}
                      value={editData.company}
                      returnKeyType="done"
                      enablesReturnKeyAutomatically
                      onSubmitEditing={() => {
                        editInformation(key);
                      }}
                    />
                    <Text style={styles.listViewText}>Name:</Text>
                    <TextInput
                      style={styles.listViewTextInput}
                      onChangeText={(text) => {
                        onChangeEditInformation("name", text);
                      }}
                      value={editData.name}
                      returnKeyType="done"
                      enablesReturnKeyAutomatically
                      onSubmitEditing={() => {
                        editInformation(key);
                      }}
                    />
                    <Text style={styles.listViewText}>P.N:</Text>
                    <TextInput
                      style={styles.listViewTextInput}
                      onChangeText={(text) => {
                        onChangeEditInformation("phoneNumber", text);
                      }}
                      value={editData.phoneNumber}
                      returnKeyType="done"
                      enablesReturnKeyAutomatically
                      onSubmitEditing={() => {
                        editInformation(key);
                      }}
                    />
                    <Text style={styles.listViewText}>Email:</Text>
                    <TextInput
                      style={styles.listViewTextInput}
                      onChangeText={(text) => {
                        onChangeEditInformation("email", text);
                      }}
                      value={editData.email}
                      returnKeyType="done"
                      enablesReturnKeyAutomatically
                      onSubmitEditing={() => {
                        editInformation(key);
                      }}
                    />
                  </View>
                )}
                <View style={styles.listViewButtonView}>
                  <Button title="Edit" onPress={() => edit(key)} />
                  <Button
                    title="Delete"
                    onPress={() => {
                      deleteInformation(key);
                    }}
                  />
                </View>
              </View>
            ))}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  if (searchView) {
    return (
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.listViewContainer}
      >
        <Button
          title="Back to Main Menu"
          onPress={() => {
            setSearchView(false);
            backToFalse();
            setSearchString("");
          }}
        />
        <View style={{ alignItems: "center" }}>
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search Name or Company"
            value={searchString}
            onChangeText={onChangeSearchString}
          />
        </View>
        <ScrollView>
          {Object.keys(searchedArray).map((key) => (
            <View key={key} style={styles.searchViewBuisnessCard}>
              {!searchedArray[key].edit ? (
                <View>
                  {searchedArray[key].company !== "" && (
                    <Text style={styles.listViewText}>
                      Company: {searchedArray[key].company}
                    </Text>
                  )}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.listViewText}>
                      Name: {searchedArray[key].name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        copyToClipboard(searchedArray[key].name);
                      }}
                    >
                      <Feather name="copy" size={30} color="tomato" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.listViewText}>
                      P.N: {searchedArray[key].phoneNumber}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          copyToClipboard(searchedArray[key].phoneNumber);
                        }}
                      >
                        <Feather name="copy" size={30} color="tomato" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Linking.openURL(
                            `sms:${searchedArray[key].phoneNumber}`
                          );
                        }}
                      >
                        <Feather
                          name="message-square"
                          size={32}
                          color="lightslategrey"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Linking.openURL(
                            `tel:${searchedArray[key].phoneNumber}`
                          );
                        }}
                      >
                        <Feather name="phone-outgoing" size={30} color="teal" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.listViewText}>
                      Email: {searchedArray[key].email}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        copyToClipboard(searchedArray[key].email);
                      }}
                    >
                      <Feather name="copy" size={30} color="tomato" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.listViewText}>Company:</Text>
                  <TextInput
                    style={styles.listViewTextInput}
                    onChangeText={(text) => {
                      onChangeEditInformation("company", text);
                    }}
                    value={editData.company}
                    returnKeyType="done"
                    enablesReturnKeyAutomatically
                    onSubmitEditing={() => {
                      editInformation(key);
                    }}
                  />
                  <Text style={styles.listViewText}>Name:</Text>
                  <TextInput
                    style={styles.listViewTextInput}
                    onChangeText={(text) => {
                      onChangeEditInformation("name", text);
                    }}
                    value={editData.name}
                    returnKeyType="done"
                    enablesReturnKeyAutomatically
                    onSubmitEditing={() => {
                      editInformation(key);
                    }}
                  />
                  <Text style={styles.listViewText}>P.N:</Text>
                  <TextInput
                    style={styles.listViewTextInput}
                    onChangeText={(text) => {
                      onChangeEditInformation("phoneNumber", text);
                    }}
                    value={editData.phoneNumber}
                    returnKeyType="done"
                    enablesReturnKeyAutomatically
                    onSubmitEditing={() => {
                      editInformation(key);
                    }}
                  />
                  <Text style={styles.listViewText}>Email:</Text>
                  <TextInput
                    style={styles.listViewTextInput}
                    onChangeText={(text) => {
                      onChangeEditInformation("email", text);
                    }}
                    value={editData.email}
                    returnKeyType="done"
                    enablesReturnKeyAutomatically
                    onSubmitEditing={() => {
                      editInformation(key);
                    }}
                  />
                </View>
              )}
              <View style={styles.listViewButtonView}>
                <Button title="Edit" onPress={() => edit(key)} />
                <Button
                  title="Delete"
                  onPress={() => {
                    deleteInformation(key);
                  }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
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
            <TouchableOpacity
              style={styles.t1}
              onPress={() => chooseFromLibrary()}
            >
              <Text style={styles.text1}>Choose From Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.t1}
              onPress={() => {
                setSearchView(true);
                setSearchString("");
              }}
            >
              <Text style={styles.text1}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.t1}
              onPress={() => {
                setListView(true);
              }}
            >
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
  chooseFromLibrary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -50,
    marginTop: 50,
  },
  photoFromLibrary: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT / 4,
  },
  photoFromLibraryImageView: {
    flex: 1.2,
  },
  photoFromLibraryView: {
    flex: 1,
    padding: 10,
    borderWidth: 3,
    borderRadius: 5,
    borderWidth: 5,
  },
  photoFromLibraryInputView: {
    flex: 2,
    alignItems: "center",
  },
  textInput: {
    height: 40,
    width: SCREEN_WIDTH - 100,
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 4,
    fontSize: 20,
  },
  photoFromLibraryDetectText: {
    fontSize: 25,
  },
  listViewContainer: {
    flex: 1,
    marginTop: 50,
    marginBottom: 50,
  },
  listViewScrollView: {
    height: SCREEN_HEIGHT - 300,
  },
  listViewText: {
    fontSize: 25,
  },
  listViewTextInput: {
    height: 50,
    marginLeft: 5,
    width: SCREEN_WIDTH - 10,
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 4,
    fontSize: 30,
  },
  listViewButtonView: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  searchTextInput: {
    height: 50,
    width: SCREEN_WIDTH - 50,
    borderWidth: 3,
    borderColor: "black",
    borderRadius: 4,
    fontSize: 30,
  },
  searchViewBuisnessCard: {
    borderWidth: 3,
    borderColor: "gainsboro",
    borderRadius: 10,
  },
});
