import axios from 'axios';

async function testApi2() {
  try {
    const { data } = await axios.get('https://eds.letemsvetemapplem.eu/'); // Just try ekosystem api.otvorenezmluvy.sk
  } catch (e) { }

  try {
    const { data } = await axios.get('https://api.otvorenezmluvy.sk/v1/search/documents', {
        params: { q: 'deratizacia' }
    });
    console.log("otvorenezmluvy", data.elements.length);
  } catch (e) {
    console.log("otvorene zmluvy failed");
  }
}
testApi2();
