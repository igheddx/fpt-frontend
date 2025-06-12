import { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
const useEncryptDecrypt = () => {
  const [data, setData] = useState("");
  const getEncryptDecryptWithUserName = async (username) => {
    let data2 = "";
    data2 = username + "|8216EB35-BB77-49AD-94CA-A7C3520DC464";
    const iv = "F5cEUty4UwQL2EyW";
    const key = "CHqcPp7MN3mTY3nF6TWHdG8dHPVSgJBj";

    const fkey = CryptoJS.enc.Utf8.parse(key);
    const fiv = CryptoJS.enc.Utf8.parse(iv);

    const enc = CryptoJS.AES.encrypt(data2, fkey, {
      iv: fiv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const final = enc.ciphertext.toString(CryptoJS.enc.Base64);

    sessionStorage.setItem("xapikey", final);

    setData(final);
  };
  // return {data, };

  const getEncryptDecryptNoUserName = async () => {
    let data2 = "";
    data2 = "8216EB35-BB77-49AD-94CA-A7C3520DC464";

    const iv = "F5cEUty4UwQL2EyW";
    const key = "CHqcPp7MN3mTY3nF6TWHdG8dHPVSgJBj";

    const fkey = CryptoJS.enc.Utf8.parse(key);
    const fiv = CryptoJS.enc.Utf8.parse(iv);

    const enc = CryptoJS.AES.encrypt(data2, fkey, {
      iv: fiv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const final = enc.ciphertext.toString(CryptoJS.enc.Base64);

    sessionStorage.setItem("xapikeyNoAccessToken", final);

    //console.log("dominic inside encrypt", final);
    setData(final);
  };
  return { data, getEncryptDecryptNoUserName, getEncryptDecryptWithUserName };
};

export default useEncryptDecrypt;
