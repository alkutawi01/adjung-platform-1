import { fetchDocText } from './_fetchDoc.js';

export default async function handler(req, res) {
  const { status, body } = await fetchDocText(req.query.url);
  return res.status(status).json(body);
}
