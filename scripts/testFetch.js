import fetch from 'node-fetch';

const url = "https://docs.google.com/document/d/1lgsNG0DCBFwPIi4wNhXhFNdGMhRMdtO1YJhaj1KM-Uc/export?format=txt";

async function test() {
  try {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    console.log(`Response Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`--- Response Text (first 500 chars) ---`);
    console.log(text.slice(0, 500));
    console.log(`----------------------------------------`);
  } catch (err) {
    console.error(err);
  }
}

test();
