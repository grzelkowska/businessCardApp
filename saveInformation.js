import AsyncStorage from "@react-native-async-storage/async-storage";

const saveInformation = async (information, key) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(information))
    } catch (e) {
        console.log(e)
    }
}

export default saveInformation;