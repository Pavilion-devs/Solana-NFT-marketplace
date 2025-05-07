import axios from 'axios';

// Direct call to Magic Eden API
axios.get('https://api-mainnet.magiceden.dev/v2/marketplace/popular_collections')
  .then(({ data }) => console.log(data))
  .catch(err => console.error(err)); 