import axios from 'axios';

async function testApi() {
  try {
    // Open Data od Datalab (zadarmo, nevyzaduje API key pre zakladne data)
    // api.otvorenezmluvy.sk alebo uvostat (dokumentovane na uvostat.sk/api)
    // Pozrieme format z UVOstat API bez kluca (vacsinou je limitovany)
    const { data } = await axios.get('https://www.uvostat.sk/api/zakazky', {
      params: { q: 'deratizácia' }
    });
    console.log(data);
  } catch (e) {
    if (e.response && e.response.status === 404) {
      console.log('404 Not Found na /zakazky. Skusam iny endpoint.');
    } else {
      console.error(e.message);
    }
  }
}
testApi();
