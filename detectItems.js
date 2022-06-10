const detectItems = (paragraph) => {
  var phoneExp =
    /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gim;

  const data = {
    name: "",
    phoneNumber: "",
    email: "",
  };
  const sentences = paragraph.split("\n");

  for (let s = 0; s < sentences.length; s++) {
    if (sentences[s].includes("@")) {
      data.email = sentences[s];
    }
    if (sentences[s].trim().length === 3) {
      data.name = sentences[s].trim();
    }
    if (phoneExp.test(sentences[s])) {
      data.phoneNumber = sentences[s].replace(/\D/g, "");
    }
  }
  return data;
};

export default detectItems;
