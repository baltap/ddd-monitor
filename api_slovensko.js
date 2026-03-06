import axios from 'axios';
async function run() {
  try {
     const req = await axios.get("https://openapi.slovensko.digital/api/datasets");
     console.log(req.data);
  } catch(e) {
     console.log("no digital endpoint");
  }
}
run();
