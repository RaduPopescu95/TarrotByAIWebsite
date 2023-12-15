import { type NextRequest } from "next/server";
const { Translate } = require("@google-cloud/translate").v2;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { text, target } = req.body;

    // Initialize the Google Cloud Translation client
    const translate = new Translate({
      projectId: "webdynamicx-d16a1", // Replace with your actual project ID
      key: "AIzaSyApL6NKBvCqvKq_mq6aXFAJBc-8NekG0Oo", // Replace with your actual API key
    });

    try {
      // Translate the text
      const [translation] = await translate.translate(text, target);
      res.status(200).json({ translation });
    } catch (error) {
      console.error("Translation API error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    // Respond with 405 for non-POST requests
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
